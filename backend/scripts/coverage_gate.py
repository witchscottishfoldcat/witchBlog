# -*- coding: utf-8 -*-
"""覆盖率棘轮门（canonical G3）：总覆盖率只允许上升，不允许下降。

跑 G2 同一快速子集并采集覆盖率，与 scripts/coverage_baseline.txt 对比；
输出 canonical 证据 JSON：{"coverage": {"baseline": n, "current": n}}。

用法:
    python scripts/coverage_gate.py            # 检查（低于基线退出非零）
    python scripts/coverage_gate.py --update   # 覆盖率提升后上调基线
"""

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASELINE_FILE = Path(__file__).resolve().parent / "coverage_baseline.txt"
EVIDENCE = ROOT / "docs/gates/latest/coverage-gate.json"

TEST_FILES = [
    "tests/test_game_showcase_auth.py",
    "tests/test_site_config_revalidate.py",
    "tests/test_link_category_validation.py",
    "tests/test_links_random_route.py",
    "tests/test_error_envelope.py",
    "tests/test_project_stats_sync.py",
]


def run_coverage() -> float:
    EVIDENCE.parent.mkdir(parents=True, exist_ok=True)
    cov_json = EVIDENCE.parent / "coverage-ratchet.json"
    proc = subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            *TEST_FILES,
            "-q",
            "-p",
            "no:cacheprovider",
            "-W",
            "ignore::DeprecationWarning",
            f"--cov=app",
            f"--cov-report=json:{cov_json}",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if proc.returncode != 0:
        print("coverage_gate: 测试子集失败，覆盖率检查无效")
        print((proc.stdout or "")[-1500:])
        sys.exit(1)
    data = json.loads(cov_json.read_text(encoding="utf-8"))
    return float(data["totals"]["percent_covered"])


def main() -> int:
    current = run_coverage()
    baseline = float(BASELINE_FILE.read_text(encoding="utf-8").strip())

    EVIDENCE.write_text(
        json.dumps(
            {
                "coverage": {
                    "baseline": round(baseline, 2),
                    "current": round(current, 2),
                }
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    if "--update" in sys.argv:
        if current < baseline:
            print(f"拒绝下调覆盖率基线: 当前 {current:.2f} < 基线 {baseline:.2f}")
            return 1
        BASELINE_FILE.write_text(f"{current:.2f}\n", encoding="utf-8")
        print(f"覆盖率基线已更新: {baseline:.2f} -> {current:.2f}")
        return 0

    if current + 1e-9 < baseline:
        print(f"coverage_gate FAIL: 当前 {current:.2f}% < 基线 {baseline:.2f}%")
        return 1
    print(f"coverage_gate PASS: 当前 {current:.2f}% >= 基线 {baseline:.2f}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
