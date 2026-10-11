# -*- coding: utf-8 -*-
"""静态检查列（canonical G1）：编译 + 格式 + 排序 + lint + 类型，一次跑全。

任一子检查失败即退出非零；对应 quality-gate.config.json 的 G1 命令。
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PY = [sys.executable]

CHECKS = [
    ("compileall", PY + ["-m", "compileall", "-q", "app", "tests", "main.py"]),
    ("black", PY + ["-m", "black", "--check", "app", "main.py", "tests", "scripts"]),
    (
        "isort",
        PY + ["-m", "isort", "--check-only", "app", "main.py", "tests", "scripts"],
    ),
    ("flake8", PY + ["-m", "flake8", "app", "main.py", "tests"]),
    ("mypy-ratchet", PY + ["scripts/mypy_gate.py"]),
]

LABELS = {
    "compileall": "语法编译（app/tests/main.py）",
    "black": "black 格式检查",
    "isort": "isort 导入排序",
    "flake8": "flake8 lint",
    "mypy-ratchet": "mypy 棘轮门（app+tests+main.py）",
}


def main() -> int:
    failed = False
    for name, cmd in CHECKS:
        proc = subprocess.run(
            cmd,
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        status = "PASS" if proc.returncode == 0 else f"FAIL(exit={proc.returncode})"
        print(f"[{name}] {status} - {LABELS[name]}")
        if proc.returncode != 0:
            failed = True
            out = (proc.stdout or "") + (proc.stderr or "")
            for line in out.strip().splitlines()[-5:]:
                print(f"    {line}")
    if failed:
        print("static_checks: FAIL")
        return 1
    print("static_checks: PASS（全部静态检查通过）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
