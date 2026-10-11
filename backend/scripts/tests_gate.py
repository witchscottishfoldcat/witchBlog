# -*- coding: utf-8 -*-
"""全量测试套件棘轮门：通过数不得减少，失败+错误数不得增加。

用法:
    python scripts/tests_gate.py            # 以 scripts/tests_baseline.txt 为基线检查
    python scripts/tests_gate.py --update   # 环境改善/清偿失败后重置基线（通过数只升不降）

基线语义：本机开发环境（无本地服务、无 WITCHCAT_LIVE_TESTS）。
环境发生显著变化（如 MinIO 可用）后请先核对再 --update。

退出码: 0=未劣化; 1=劣化或执行失败。
"""
import json
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASELINE_FILE = Path(__file__).resolve().parent / "tests_baseline.txt"


def run_suite() -> dict:
    with tempfile.NamedTemporaryFile(suffix=".xml", delete=False) as tmp:
        junit = tmp.name
    try:
        try:
            result = subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "pytest",
                    "tests/",
                    "-q",
                    "--tb=no",
                    "-p",
                    "no:cacheprovider",
                    "-W",
                    "ignore::DeprecationWarning",
                    "--junitxml=" + junit,
                ],
                cwd=ROOT,
                capture_output=True,
                timeout=1800,
            )
            if result.returncode != 0:
                print(result.stdout.decode("utf-8", errors="replace")[-3000:])
        except subprocess.TimeoutExpired:
            print("测试棘轮门失败: 测试套件执行超过 30 分钟（可能有测试挂起）")
            sys.exit(1)
        evidence = ROOT / "docs/gates/latest/full-pytest.xml"
        evidence.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(junit, evidence)
        stats = ET.parse(junit).getroot().find("testsuite").attrib
    finally:
        Path(junit).unlink(missing_ok=True)

    tests = int(stats["tests"])
    failures = int(stats["failures"])
    errors = int(stats["errors"])
    skipped = int(stats.get("skipped", 0))
    passed = tests - failures - errors - skipped
    return {
        "passed": passed,
        "failures": failures,
        "errors": errors,
        "skipped": skipped,
    }


def main() -> int:
    current = run_suite()
    baseline = json.loads(BASELINE_FILE.read_text(encoding="utf-8"))

    degraded_passed = current["passed"] < baseline["passed"]
    degraded_failed = (current["failures"] + current["errors"]) > (
        baseline["failures"] + baseline["errors"]
    )

    if "--update" in sys.argv:
        if degraded_passed or degraded_failed:
            print(f"拒绝劣化基线: 当前 {current} vs 基线 {baseline}")
            return 1
        BASELINE_FILE.write_text(
            json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print(f"基线已更新: {baseline} -> {current}")
        return 0

    if degraded_passed or degraded_failed:
        print(f"测试棘轮门失败: 当前 {current} vs 基线 {baseline}")
        print("通过数下降或失败数增加；修复后重试，改善后可 --update 下调基线")
        return 1

    print(
        f"测试棘轮门通过: 通过 {current['passed']}（基线 {baseline['passed']}），"
        f"失败+错误 {current['failures'] + current['errors']}"
        f"（基线 {baseline['failures'] + baseline['errors']}，存量环境性失败）"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
