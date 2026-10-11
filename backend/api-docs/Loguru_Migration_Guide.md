# Loguru 日志系统迁移指南

## 概述

本项目已集成 Loguru 作为主要日志系统，同时保持与标准 logging 库的兼容性。Loguru 提供了更简洁的 API、更好的性能和更丰富的功能。

## 优势

- 更简单的 API，无需复杂的配置
- 更好的性能和内存效率
- 内置异常回溯和诊断功能
- 支持多种输出格式和处理器
- 自动日志轮转和保留策略
- 更美观的彩色控制台输出

## 使用方法

### 1. 获取日志器

```python
from app.core.logging import get_logger

# 获取日志器
logger = get_logger(__name__)

# 或者获取默认日志器
logger = get_logger()
```

### 2. 基本日志记录

```python
logger.debug("调试信息")
logger.info("一般信息")
logger.warning("警告信息")
logger.error("错误信息")
logger.critical("严重错误")
```

### 3. 异常记录

```python
try:
    # 可能出错的操作
    result = 1 / 0
except Exception as e:
    # 使用 exception() 自动记录堆栈跟踪
    logger.exception(f"发生错误: {e}")
```

### 4. 结构化日志

```python
# 使用 .bind() 添加额外上下文
request_logger = logger.bind(request_id="req-123", user="admin")
request_logger.info("处理请求")

# 使用 .opt() 自定义日志选项
logger.opt(colors=True).info("<green>绿色</green> <red>红色</red> <blue>蓝色</blue>")
```

## 从标准 logging 迁移

### 替换现有代码

**之前 (标准 logging):**
```python
import logging
logger = logging.getLogger(__name__)
logger.info("这是一条信息")
```

**之后 (Loguru):**
```python
from app.core.logging import get_logger
logger = get_logger(__name__)
logger.info("这是一条信息")
```

### 主要差异

1. **无需配置处理器**: Loguru 会自动设置处理器，无需手动添加
2. **更简单的格式化**: 可以直接在字符串中使用 f-string，无需使用 % 格式
3. **异常处理**: 使用 `logger.exception()` 代替 `logger.error(..., exc_info=True)`

## 配置

Loguru 的配置在 `app/core/loguru_logging.py` 中，包括：

- 日志级别
- 输出格式
- 文件轮转策略
- 错误日志单独记录

可以通过修改 `app/core/config.py` 中的日志设置来调整行为。

## 向后兼容性

项目保持与标准 logging 的完全兼容性：

1. 现有使用 `logging.getLogger()` 的代码将继续工作
2. 第三方库的日志将自动重定向到 Loguru
3. 可以逐步迁移现有代码，无需一次性更改

## 注意事项

1. 安装 loguru: `pip install loguru` (已添加到 requirements.txt)
2. 如需使用标准 logging 的特定功能，可以通过 `logging.getLogger()` 获取
3. 对于高频日志场景，Loguru 的性能优于标准 logging

## 更多信息

- [Loguru 官方文档](https://loguru.readthedocs.io/)
- [Loguru GitHub](https://github.com/Delgan/loguru)