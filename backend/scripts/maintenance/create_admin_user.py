"""创建超级管理员用户脚本

用法:
    python scripts/maintenance/create_admin_user.py
        （交互式输入用户名与密码）
    python scripts/maintenance/create_admin_user.py --username admin --email admin@example.com
        （交互式输入密码）
    python scripts/maintenance/create_admin_user.py --username admin --password '强密码'
        （非交互场景，如 CI；密码会留在 shell 历史，慎用）

密码不会回显到输出，也不再提供任何硬编码默认密码。
"""
import argparse
import getpass
import os
import sys

# 添加项目根目录到 Python 路径（本脚本位于 scripts/maintenance/，需向上两级）
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

MIN_PASSWORD_LENGTH = 8

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.services.auth import AuthService


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="创建或检查超级管理员用户")
    parser.add_argument("--username", default="admin", help="用户名（默认 admin）")
    parser.add_argument(
        "--email", default="admin@example.com", help="邮箱（默认 admin@example.com）"
    )
    parser.add_argument(
        "--password",
        default=None,
        help="密码；省略时交互式输入（无终端输入时必须显式提供）",
    )
    parser.add_argument(
        "--non-interactive",
        action="store_true",
        help="声明非交互运行（CI/重定向 stdin）；此时必须提供 --password",
    )
    return parser.parse_args()


def _has_windows_console(fd: int) -> bool:
    """Windows 下 isatty() 会把 NUL 设备等重定向误报为 True；
    GetConsoleMode 只对真实控制台句柄成功，可立即区分。仅 Windows 调用。"""
    if sys.platform != "win32":
        return False

    import ctypes
    from ctypes import wintypes

    std_handle = {0: -10, 1: -11}[fd]
    handle = ctypes.windll.kernel32.GetStdHandle(std_handle)
    mode = wintypes.DWORD()
    return bool(ctypes.windll.kernel32.GetConsoleMode(handle, ctypes.byref(mode)))


def _can_prompt() -> bool:
    """判定当前是否能安全地进行交互式密码输入（否则 getpass 会永久阻塞）。"""
    if not (sys.stdin.isatty() and sys.stdout.isatty()):
        return False
    if os.name == "nt":
        return _has_windows_console(0)
    return True


def resolve_password(args: argparse.Namespace) -> str:
    """获取并校验密码：优先命令行参数，其次交互式输入。

    Windows 把 NUL 设备（如 </dev/null 重定向）当字符设备，isatty() 会
    误报 True 并导致 getpass 永久阻塞，因此 Windows 额外用 GetConsoleMode
    校验真实控制台；CI/脚本场景请显式传 --password（可加 --non-interactive）。
    """
    password = args.password
    if not password:
        if args.non_interactive or not _can_prompt():
            print("✗ 非交互环境下必须通过 --password 提供密码" "（CI 场景请同时加 --non-interactive）")
            sys.exit(1)
        password = getpass.getpass(f"请输入 {args.username} 的密码: ")
        confirm = getpass.getpass("请再次输入密码确认: ")
        if password != confirm:
            print("✗ 两次输入的密码不一致")
            sys.exit(1)

    if len(password) < MIN_PASSWORD_LENGTH:
        print(f"✗ 密码长度不得少于 {MIN_PASSWORD_LENGTH} 位")
        sys.exit(1)

    return password


def create_or_check_admin(username: str, email: str, password: str) -> bool:
    """检查或创建超级管理员用户；返回是否成功"""
    db = SessionLocal()
    try:
        user = AuthService.get_user_by_username(db, username)

        if user:
            print(f"✓ 用户 '{username}' 已存在")
            print(f"  - 邮箱: {user.email}")
            print(f"  - 是否超级管理员: {user.is_superuser}")
            print(f"  - 是否活跃: {user.is_active}")
            if args_has_password:
                print("  - 提示: 用户已存在，本次提供的 --password 未使用（不修改已有密码）")

            if not user.is_superuser:
                user.is_superuser = True
                db.commit()
                print("  ✓ 已设置为超级管理员")

            return True

        print(f"✓ 创建新用户 '{username}'")

        new_user = User(
            username=username,
            email=email,
            full_name="System Administrator",
            hashed_password=get_password_hash(password),
            is_active=True,
            is_superuser=True,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        print("  ✓ 用户创建成功")
        print(f"  - 用户名: {username}")
        print(f"  - 邮箱: {email}")
        print("  - 密码: (已设置，不回显)")
        print("  - 超级管理员: True")

        return True

    except Exception as e:
        print(f"✗ 操作失败: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("超级管理员用户管理")
    print("=" * 60)
    args = parse_args()
    args_has_password = bool(args.password)
    password = resolve_password(args)
    ok = create_or_check_admin(args.username, args.email, password)
    print("=" * 60)
    sys.exit(0 if ok else 1)
