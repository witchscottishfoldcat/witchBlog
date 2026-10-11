"""
集中式任务调度器

基于 asyncio 原生实现，集成到 FastAPI 生命周期。
- 支持 interval（固定间隔）和 cron（每天定时）两种触发方式
- cron 触发时间按 SCHEDULER_TIMEZONE 配置的时区解释，不依赖容器系统时区
- 应用停机期间错过的 cron 任务在启动时补跑一次
- 任务开关状态持久化到数据库
- 支持后台管理 API 控制启用/禁用
"""

import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional
from zoneinfo import ZoneInfo

from app.core.unified_logging import get_logger

logger = get_logger(__name__)

# interval 触发器的最小间隔（秒），防止误配置过小间隔压垮下游
MIN_INTERVAL_SECONDS = 60


def get_scheduler_timezone() -> ZoneInfo:
    """调度时区：cron 任务的触发时间按该时区的本地时间解释"""
    from app.core.config import settings

    return ZoneInfo(settings.SCHEDULER_TIMEZONE)


def _as_timezone(value: datetime, tz: ZoneInfo) -> datetime:
    """将 datetime 统一为 tz 时区的带时区时间；naive 值视为 tz 本地时间"""
    if value.tzinfo is None:
        return value.replace(tzinfo=tz)
    return value.astimezone(tz)


def compute_next_cron_run(
    now: datetime, tz: ZoneInfo, hour: int, minute: int
) -> datetime:
    """计算 cron 任务下次执行时间（返回 tz 时区的带时区时间）"""
    now_local = _as_timezone(now, tz)
    target = now_local.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if target <= now_local:
        target += timedelta(days=1)
    return target


def is_cron_run_missed(
    now: datetime,
    tz: ZoneInfo,
    hour: int,
    minute: int,
    last_run_at: Optional[datetime],
) -> bool:
    """判断是否停机错过了执行：今天目标时刻已过，且此后从未执行过"""
    now_local = _as_timezone(now, tz)
    today_target = now_local.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if now_local <= today_target:
        return False
    if last_run_at is None:
        return True
    return _as_timezone(last_run_at, tz) < today_target


class JobDefinition:
    """任务定义"""

    def __init__(
        self,
        name: str,
        func: Callable,
        trigger: str,
        description: str = "",
        **trigger_kwargs,
    ):
        self.name = name
        self.func = func
        self.trigger = trigger  # "interval" or "cron"
        self.description = description
        self.trigger_kwargs = trigger_kwargs
        self.task: Optional[asyncio.Task] = None
        self.is_running = False

    @property
    def trigger_config_json(self) -> str:
        return json.dumps(self.trigger_kwargs)

    @property
    def raw_interval_seconds(self) -> int:
        """按触发参数计算的总秒数（未应用最小间隔保护）"""
        seconds = self.trigger_kwargs.get("seconds", 0)
        seconds += self.trigger_kwargs.get("minutes", 0) * 60
        seconds += self.trigger_kwargs.get("hours", 0) * 3600
        return seconds

    @property
    def interval_seconds(self) -> int:
        """interval 触发器的总秒数（下限 MIN_INTERVAL_SECONDS）"""
        return max(self.raw_interval_seconds, MIN_INTERVAL_SECONDS)

    @property
    def display_interval(self) -> str:
        """人类可读的间隔描述"""
        if self.trigger == "cron":
            hour = self.trigger_kwargs.get("hour", 0)
            minute = self.trigger_kwargs.get("minute", 0)
            return f"每天 {hour:02d}:{minute:02d}"
        total = self.interval_seconds
        if total >= 3600:
            return f"每 {total // 3600} 小时"
        if total >= 60:
            return f"每 {total // 60} 分钟"
        return f"每 {total} 秒"


class TaskScheduler:
    """集中式任务调度器"""

    def __init__(self):
        self._jobs: Dict[str, JobDefinition] = {}
        self._started = False

    def add_job(
        self,
        name: str,
        func: Callable,
        trigger: str = "interval",
        description: str = "",
        **trigger_kwargs,
    ) -> None:
        """
        注册一个定时任务

        Args:
            name: 任务唯一标识
            func: 异步或同步函数
            trigger: "interval" 或 "cron"
            description: 任务描述
            **trigger_kwargs: 触发参数
                interval: seconds, minutes, hours（实际间隔下限 60 秒）
                cron: hour, minute（按 SCHEDULER_TIMEZONE 时区解释）
        """
        job = JobDefinition(name, func, trigger, description, **trigger_kwargs)
        self._jobs[name] = job

        if trigger == "interval" and job.raw_interval_seconds < MIN_INTERVAL_SECONDS:
            logger.warning(
                f"任务 {name} 配置的间隔 {job.raw_interval_seconds}s 低于最小值"
                f" {MIN_INTERVAL_SECONDS}s，已按 {MIN_INTERVAL_SECONDS}s 执行"
            )
        logger.info(f"注册定时任务: {name} ({job.display_interval})")

    async def start(self) -> None:
        """启动调度器，从数据库同步开关状态后启动任务"""
        if self._started:
            return

        self._started = True
        logger.info(f"启动任务调度器，共 {len(self._jobs)} 个任务")

        # 同步数据库中的任务开关状态
        await self._sync_db_state()

        # 启动所有已启用的任务
        for name, job in self._jobs.items():
            enabled = await self._is_enabled(name)
            if enabled:
                self._start_job(job)
                logger.info(f"  ✅ {name}: {job.display_interval}")
            else:
                logger.info(f"  ⏸️ {name}: 已禁用")

    async def stop(self) -> None:
        """停止调度器，取消所有运行中的任务"""
        if not self._started:
            return

        self._started = False
        logger.info("停止任务调度器...")

        for name, job in self._jobs.items():
            if job.task and not job.task.done():
                job.task.cancel()
                try:
                    await job.task
                except asyncio.CancelledError:
                    pass
            job.task = None

        logger.info("任务调度器已停止")

    # ==================== 任务控制 ====================

    async def enable_job(self, name: str) -> bool:
        """启用任务"""
        job = self._jobs.get(name)
        if not job:
            return False

        await self._set_enabled(name, True)
        if self._started and (not job.task or job.task.done()):
            self._start_job(job)
            logger.info(f"任务已启用并启动: {name}")
        return True

    async def disable_job(self, name: str) -> bool:
        """禁用任务"""
        job = self._jobs.get(name)
        if not job:
            return False

        await self._set_enabled(name, False)
        if job.task and not job.task.done():
            job.task.cancel()
            try:
                await job.task
            except asyncio.CancelledError:
                pass
            job.task = None
            logger.info(f"任务已禁用并停止: {name}")
        return True

    async def run_job_now(self, name: str) -> Dict[str, Any]:
        """手动触发执行某个任务（运行中的任务拒绝重入，避免与定时执行重叠）"""
        job = self._jobs.get(name)
        if not job:
            return {"success": False, "error": f"任务 {name} 不存在"}

        if job.is_running:
            return {"success": False, "error": "任务正在执行中，请稍后再试"}

        return await self._execute_job(job)

    def get_all_status(self) -> List[Dict[str, Any]]:
        """获取所有任务状态"""
        result = []
        for name, job in self._jobs.items():
            result.append(
                {
                    "name": name,
                    "description": job.description,
                    "trigger": job.trigger,
                    "schedule": job.display_interval,
                    "is_running": job.is_running,
                    "has_task": job.task is not None and not job.task.done(),
                }
            )
        return result

    def get_job_names(self) -> List[str]:
        """获取所有注册的任务名称"""
        return list(self._jobs.keys())

    # ==================== 内部方法 ====================

    def _start_job(self, job: JobDefinition) -> None:
        """启动单个任务的后台循环"""
        if job.trigger == "interval":
            job.task = asyncio.create_task(
                self._interval_loop(job), name=f"scheduler:{job.name}"
            )
        elif job.trigger == "cron":
            job.task = asyncio.create_task(
                self._cron_loop(job), name=f"scheduler:{job.name}"
            )

    async def _interval_loop(self, job: JobDefinition) -> None:
        """interval 触发器的执行循环"""
        interval = job.interval_seconds
        # 首次延迟 30 秒再执行，避免启动时集中执行
        await asyncio.sleep(30)

        while True:
            await self._execute_job(job)
            await asyncio.sleep(interval)

    async def _cron_loop(self, job: JobDefinition) -> None:
        """cron 触发器的执行循环（每天定时，按 SCHEDULER_TIMEZONE 解释）"""
        tz = get_scheduler_timezone()
        target_hour = job.trigger_kwargs.get("hour", 0)
        target_minute = job.trigger_kwargs.get("minute", 0)

        # 停机错补：今天的目标时刻已过且此后从未执行过，启动时立即补跑一次
        last_run_at = await self._get_last_run_at(job.name)
        if is_cron_run_missed(
            datetime.now(tz), tz, target_hour, target_minute, last_run_at
        ):
            logger.info(f"任务 {job.name} 错过了今天的执行时间，启动时补跑一次")
            await self._execute_job(job)

        while True:
            target = compute_next_cron_run(
                datetime.now(tz), tz, target_hour, target_minute
            )
            wait_seconds = (target - datetime.now(tz)).total_seconds()
            logger.debug(
                f"任务 {job.name} 将在 {target.strftime('%Y-%m-%d %H:%M')} 执行"
                f"（{wait_seconds:.0f}秒后）"
            )

            # 更新下次执行时间（存调度时区的墙上时间，与库内 naive 时间列一致）
            await self._update_next_run(job.name, target.replace(tzinfo=None))
            await asyncio.sleep(wait_seconds)
            await self._execute_job(job)

    async def _execute_job(self, job: JobDefinition) -> Dict[str, Any]:
        """执行单个任务并记录结果"""
        start_time = time.time()
        job.is_running = True
        result: Dict[str, Any] = {"success": False, "name": job.name}

        try:
            logger.info(f"开始执行任务: {job.name}")
            await self._update_status(job.name, "running")

            # 执行任务函数（支持同步和异步）
            if asyncio.iscoroutinefunction(job.func):
                ret = await job.func()
            else:
                ret = await asyncio.to_thread(job.func)

            duration = int(time.time() - start_time)
            await self._record_success(job.name, duration)
            result["success"] = True
            result["duration"] = duration
            result["result"] = str(ret) if ret else None
            logger.info(f"任务完成: {job.name} ({duration}s)")

        except asyncio.CancelledError:
            raise
        except Exception as e:
            duration = int(time.time() - start_time)
            error_msg = str(e)
            await self._record_failure(job.name, duration, error_msg)
            result["error"] = error_msg
            result["duration"] = duration
            logger.error(f"任务失败: {job.name} - {error_msg}")
        finally:
            job.is_running = False

        return result

    # ==================== 数据库操作 ====================
    # 同步 SQLAlchemy 会话不能在事件循环里直接跑（会阻塞请求处理），
    # 所有落库操作通过 asyncio.to_thread 下放线程池执行

    async def _sync_db_state(self) -> None:
        """将注册的任务同步到数据库（首次注册 / 更新配置）"""
        try:
            await asyncio.to_thread(self._sync_db_state_sync)
        except Exception as e:
            logger.error(f"同步数据库任务状态失败: {e}")

    def _sync_db_state_sync(self) -> None:
        from app.core.database import SessionLocal
        from app.models.scheduled_task import ScheduledTask

        db = SessionLocal()
        try:
            for name, job in self._jobs.items():
                existing = (
                    db.query(ScheduledTask).filter(ScheduledTask.name == name).first()
                )

                if not existing:
                    task_record = ScheduledTask(
                        name=name,
                        description=job.description,
                        trigger_type=job.trigger,
                        trigger_config=job.trigger_config_json,
                        is_enabled=True,
                    )
                    db.add(task_record)
                    logger.debug(f"新任务写入数据库: {name}")
                else:
                    # 更新描述和触发配置
                    existing.description = job.description
                    existing.trigger_type = job.trigger
                    existing.trigger_config = job.trigger_config_json

            db.commit()
        finally:
            db.close()

    async def _is_enabled(self, name: str) -> bool:
        """从数据库查询任务是否启用"""
        try:
            return await asyncio.to_thread(self._is_enabled_sync, name)
        except Exception as e:
            logger.warning(f"查询任务启用状态失败: {e}")
            return True  # 默认启用

    def _is_enabled_sync(self, name: str) -> bool:
        from app.core.database import SessionLocal
        from app.models.scheduled_task import ScheduledTask

        db = SessionLocal()
        try:
            record = db.query(ScheduledTask).filter(ScheduledTask.name == name).first()
            return record.is_enabled if record else True
        finally:
            db.close()

    async def _set_enabled(self, name: str, enabled: bool) -> None:
        """更新数据库中的启用状态"""
        try:
            await asyncio.to_thread(self._set_enabled_sync, name, enabled)
        except Exception as e:
            logger.error(f"更新任务启用状态失败: {e}")

    def _set_enabled_sync(self, name: str, enabled: bool) -> None:
        from app.core.database import SessionLocal
        from app.models.scheduled_task import ScheduledTask

        db = SessionLocal()
        try:
            record = db.query(ScheduledTask).filter(ScheduledTask.name == name).first()
            if record:
                record.is_enabled = enabled
                db.commit()
        finally:
            db.close()

    async def _get_last_run_at(self, name: str) -> Optional[datetime]:
        """从数据库查询任务上次执行时间"""
        try:
            return await asyncio.to_thread(self._get_last_run_at_sync, name)
        except Exception as e:
            logger.warning(f"查询任务上次执行时间失败: {e}")
            return None

    def _get_last_run_at_sync(self, name: str) -> Optional[datetime]:
        from app.core.database import SessionLocal
        from app.models.scheduled_task import ScheduledTask

        db = SessionLocal()
        try:
            record = db.query(ScheduledTask).filter(ScheduledTask.name == name).first()
            return record.last_run_at if record else None
        finally:
            db.close()

    async def _update_status(self, name: str, status: str) -> None:
        """更新任务执行状态"""
        try:
            await asyncio.to_thread(self._update_status_sync, name, status)
        except Exception as e:
            logger.warning(f"更新任务执行状态失败: {e}")

    def _update_status_sync(self, name: str, status: str) -> None:
        from app.core.database import SessionLocal
        from app.models.scheduled_task import ScheduledTask

        db = SessionLocal()
        try:
            record = db.query(ScheduledTask).filter(ScheduledTask.name == name).first()
            if record:
                record.last_status = status
                if status == "running":
                    # 与 next_run_at 同基准：调度时区的墙上时间（naive 落库），
                    # 错补判定 is_cron_run_missed 按 SCHEDULER_TIMEZONE 解释 naive 值
                    record.last_run_at = datetime.now(get_scheduler_timezone()).replace(
                        tzinfo=None
                    )
                db.commit()
        finally:
            db.close()

    async def _update_next_run(self, name: str, next_run: datetime) -> None:
        """更新下次执行时间"""
        try:
            await asyncio.to_thread(self._update_next_run_sync, name, next_run)
        except Exception as e:
            logger.warning(f"更新任务下次执行时间失败: {e}")

    def _update_next_run_sync(self, name: str, next_run: datetime) -> None:
        from app.core.database import SessionLocal
        from app.models.scheduled_task import ScheduledTask

        db = SessionLocal()
        try:
            record = db.query(ScheduledTask).filter(ScheduledTask.name == name).first()
            if record:
                record.next_run_at = next_run
                db.commit()
        finally:
            db.close()

    async def _record_success(self, name: str, duration: int) -> None:
        """记录成功执行"""
        try:
            await asyncio.to_thread(self._record_success_sync, name, duration)
        except Exception as e:
            logger.warning(f"记录任务成功状态失败: {e}")

    def _record_success_sync(self, name: str, duration: int) -> None:
        from app.core.database import SessionLocal
        from app.models.scheduled_task import ScheduledTask

        db = SessionLocal()
        try:
            record = db.query(ScheduledTask).filter(ScheduledTask.name == name).first()
            if record:
                record.last_status = "success"
                record.last_duration = duration
                record.last_error = None
                record.run_count = (record.run_count or 0) + 1
                db.commit()
        finally:
            db.close()

    async def _record_failure(self, name: str, duration: int, error: str) -> None:
        """记录失败执行"""
        try:
            await asyncio.to_thread(self._record_failure_sync, name, duration, error)
        except Exception as e:
            logger.warning(f"记录任务失败状态失败: {e}")

    def _record_failure_sync(self, name: str, duration: int, error: str) -> None:
        from app.core.database import SessionLocal
        from app.models.scheduled_task import ScheduledTask

        db = SessionLocal()
        try:
            record = db.query(ScheduledTask).filter(ScheduledTask.name == name).first()
            if record:
                record.last_status = "failed"
                record.last_duration = duration
                record.last_error = error[:1000]
                record.run_count = (record.run_count or 0) + 1
                db.commit()
        finally:
            db.close()


# 全局调度器实例
scheduler = TaskScheduler()
