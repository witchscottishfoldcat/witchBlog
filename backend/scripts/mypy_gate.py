# -*- coding: utf-8 -*-
"""mypy 棘轮门：错误总数只允许减少，不允许增加。

用法:
    python scripts/mypy_gate.py            # 以 scripts/mypy_baseline.txt 为上限检查
    python scripts/mypy_gate.py --update   # 清偿部分债务后重置基线（只允许下调）

退出码: 0=未超基线; 1=超过基线或执行失败。
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASELINE_FILE = Path(__file__).resolve().parent / "mypy_baseline.txt"


def current_error_count() -> int:
    proc = subprocess.run(
        [
            sys.executable,
            "-m",
            "mypy",
            "app/",
            "tests/",
            "main.py",
            "--no-error-summary",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    # mypy 对可修复错误返回非零退出码；此处只关心错误行数
    # 用 ": error:" 匹配以兼容不带错误码的错误行（如语法错误）
    if proc.returncode == 2:  # mypy 自身崩溃（非"发现错误"）
        print("mypy 棘轮门失败: mypy 执行崩溃")
        print(proc.stdout[-2000:] if proc.stdout else "(无输出)")
        sys.exit(1)
    count = sum(1 for line in proc.stdout.splitlines() if ": error:" in line)
    return count


def read_baseline() -> int:
    return int(BASELINE_FILE.read_text(encoding="utf-8").strip())


def main() -> int:
    current = current_error_count()
    baseline = read_baseline()

    if "--update" in sys.argv:
        if current > baseline:
            print(f"拒绝上调基线: 当前 {current} > 基线 {baseline}")
            return 1
        BASELINE_FILE.write_text(f"{current}\n", encoding="utf-8")
        print(f"基线已更新: {baseline} -> {current}")
        return 0

    if current > baseline:
        print(f"mypy 棘轮门失败: 当前 {current} 个错误 > 基线 {baseline}")
        print("修复新增的类型错误，或清偿存量债务后运行 --update 下调基线")
        return 1

    print(f"mypy 棘轮门通过: 当前 {current} / 基线 {baseline}（剩余为存量债务）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
