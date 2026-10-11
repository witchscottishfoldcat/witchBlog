"""调度器 cron 时区与重入保护测试

回归背景：旧实现用 naive `datetime.now()` 计算 cron 触发时间，容器内
默认 UTC，导致"每天 03:00"的任务实际跑在北京时间 11:00。
"""

import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo

import pytest
from pydantic import ValidationError

from app.core.config import BaseConfig
from app.core.scheduler import (
    MIN_INTERVAL_SECONDS,
    JobDefinition,
    TaskScheduler,
    compute_next_cron_run,
    is_cron_run_missed,
)

TZ = ZoneInfo("Asia/Shanghai")


def test_next_cron_run_before_target_same_day():
    now = datetime(2026, 10, 2, 2, 0, tzinfo=TZ)
    target = compute_next_cron_run(now, TZ, 3, 0)
    assert (target.day, target.hour, target.minute) == (2, 3, 0)


def test_next_cron_run_after_target_rolls_to_next_day():
    now = datetime(2026, 10, 2, 3, 30, tzinfo=TZ)
    target = compute_next_cron_run(now, TZ, 3, 0)
    assert (target.day, target.hour, target.minute) == (3, 3, 0)


def test_next_cron_run_accepts_utc_now():
    """UTC 18:30 即北京时间次日 02:30：应算出当天北京时间 03:00 执行

    若错误地按 UTC 本地时间解释（18:30 当作北京时间），会误判 03:00
    已过而推迟到再下一天——用这个用例区分两种解释。
    """
    now = datetime(2026, 10, 2, 18, 30, tzinfo=ZoneInfo("UTC"))
    target = compute_next_cron_run(now, TZ, 3, 0)
    assert (target.day, target.hour, target.minute) == (3, 3, 0)
    assert target.tzinfo is not None


def test_missed_when_never_run_after_target():
    now = datetime(2026, 10, 2, 4, 0, tzinfo=TZ)
    assert is_cron_run_missed(now, TZ, 3, 0, None) is True


def test_not_missed_before_target():
    now = datetime(2026, 10, 2, 2, 0, tzinfo=TZ)
    assert is_cron_run_missed(now, TZ, 3, 0, None) is False


def test_not_missed_when_ran_after_today_target():
    now = datetime(2026, 10, 2, 4, 0, tzinfo=TZ)
    last_run = datetime(2026, 10, 2, 3, 10)  # naive 视为调度时区本地时间
    assert is_cron_run_missed(now, TZ, 3, 0, last_run) is False


def test_missed_when_last_run_before_today_target():
    now = datetime(2026, 10, 2, 4, 0, tzinfo=TZ)
    last_run = datetime(2026, 10, 1, 3, 0)
    assert is_cron_run_missed(now, TZ, 3, 0, last_run) is True


def test_run_job_now_rejects_running_job():
    """运行中的任务手动触发被拒绝，避免与定时执行重叠"""

    async def _never() -> str:
        return "should-not-run"

    sched = TaskScheduler()
    sched.add_job("demo", _never, trigger="interval", description="测试", hours=1)
    sched._jobs["demo"].is_running = True

    result = asyncio.run(sched.run_job_now("demo"))

    assert result["success"] is False
    assert "正在执行" in result["error"]


def test_interval_floor_clamps_to_minimum():
    job = JobDefinition("demo", lambda: None, "interval", seconds=30)
    assert job.raw_interval_seconds == 30
    assert job.interval_seconds == MIN_INTERVAL_SECONDS


def test_invalid_scheduler_timezone_rejected():
    """无效时区名在配置加载即失败，避免 cron 协程静默死亡"""
    with pytest.raises(ValidationError):
        BaseConfig(SCHEDULER_TIMEZONE="Not/AZone")


def test_valid_scheduler_timezone_accepted():
    assert BaseConfig(SCHEDULER_TIMEZONE="UTC").SCHEDULER_TIMEZONE == "UTC"
