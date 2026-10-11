import hashlib
import uuid
from datetime import datetime
from typing import Any, Dict, List


def generate_uuid() -> str:
    """生成UUID"""
    return str(uuid.uuid4())


def generate_hash(text: str) -> str:
    """生成文本哈希"""
    return hashlib.md5(text.encode()).hexdigest()


def format_datetime(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """格式化日期时间"""
    return dt.strftime(format_str)


def safe_get(data: Dict[str, Any], key: str, default: Any = None) -> Any:
    """安全获取字典值"""
    return data.get(key, default)


def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    """将列表分块"""
    return [lst[i : i + chunk_size] for i in range(0, len(lst), chunk_size)]


def flatten_list(nested_list: List[List[Any]]) -> List[Any]:
    """展平嵌套列表"""
    return [item for sublist in nested_list for item in sublist]


def remove_duplicates(lst: List[Any]) -> List[Any]:
    """移除列表中的重复项，保持顺序"""
    seen = set()
    result = []
    for item in lst:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result
