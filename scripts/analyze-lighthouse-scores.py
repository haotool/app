#!/usr/bin/env python3
"""
Lighthouse 分數分析工具
用途: 分析歷史 Lighthouse 報告，追蹤性能趨勢
作者: Claude Code
日期: 2025-12-02
版本: v1.0.0

使用方法:
  python3 scripts/analyze-lighthouse-scores.py
  python3 scripts/analyze-lighthouse-scores.py --report-dir ./reports/lighthouse
  python3 scripts/analyze-lighthouse-scores.py --compare 20251201_120000 20251202_120000
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple
import argparse

# ANSI 顏色碼
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'  # No Color

# Baseline 分數 (v1.2.0)
BASELINE = {
    'performance': 97,
    'accessibility': 100,
    'best-practices': 100,
    'seo': 100
}

def print_colored(color: str, message: str):
    """打印帶顏色的訊息"""
    print(f"{color}{message}{Colors.NC}")

def load_lighthouse_report(json_path: Path) -> Dict:
    """載入 Lighthouse JSON 報告"""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print_colored(Colors.RED, f"❌ 無法載入報告: {json_path}")
        print_colored(Colors.RED, f"   錯誤: {e}")
        return None

def extract_scores(report: Dict) -> Dict[str, int]:
    """提取分數"""
    if not report or 'categories' not in report:
        return None

    categories = report['categories']
    scores = {}

    for key in ['performance', 'accessibility', 'best-practices', 'seo']:
        if key in categories:
            scores[key] = round(categories[key]['score'] * 100)

    return scores

def compare_with_baseline(scores: Dict[str, int]) -> Tuple[bool, List[str]]:
    """比對 baseline，返回 (是否通過, 警告列表)"""
    if not scores:
        return False, ["無法提取分數"]

    warnings = []
    passed = True

    for category, baseline_score in BASELINE.items():
        current_score = scores.get(category, 0)
        diff = baseline_score - current_score

        if diff >= 5:  # 下降 5 分以上
            warnings.append(
                f"{category.upper()}: {current_score}/100 "
                f"(baseline: {baseline_score}, 下降 {diff} 分)"
            )
            passed = False
        elif diff > 0:
            warnings.append(
                f"{category.upper()}: {current_score}/100 "
                f"(baseline: {baseline_score}, 下降 {diff} 分，尚可接受)"
            )

    return passed, warnings

def analyze_report_directory(report_dir: Path, timestamp: str = None):
    """分析報告目錄"""
    if not report_dir.exists():
        print_colored(Colors.RED, f"❌ 報告目錄不存在: {report_dir}")
        return

    # 如果指定 timestamp，只分析該目錄
    if timestamp:
        target_dir = report_dir / timestamp
        if not target_dir.exists():
            print_colored(Colors.RED, f"❌ 找不到報告: {timestamp}")
            return
        analyze_single_run(target_dir)
        return

    # 分析所有報告
    report_dirs = sorted([d for d in report_dir.iterdir() if d.is_dir()])

    if not report_dirs:
        print_colored(Colors.YELLOW, "⚠️  沒有找到任何報告")
        return

    print_colored(Colors.CYAN, f"\n📊 找到 {len(report_dirs)} 次掃描記錄\n")

    # 顯示最近 5 次掃描
    recent_reports = report_dirs[-5:]

    for report_path in recent_reports:
        print_colored(Colors.BLUE, f"{'='*60}")
        analyze_single_run(report_path)
        print()

def analyze_single_run(run_dir: Path):
    """分析單次掃描"""
    timestamp = run_dir.name
    print_colored(Colors.CYAN, f"📅 掃描時間: {timestamp}")

    # 尋找所有 JSON 報告
    json_files = list(run_dir.glob("*.report.json"))

    if not json_files:
        print_colored(Colors.YELLOW, "   ⚠️  沒有找到報告檔案")
        return

    all_passed = True

    for json_file in json_files:
        page_name = json_file.stem.replace('.report', '').replace('lighthouse-', '')
        report = load_lighthouse_report(json_file)

        if not report:
            continue

        scores = extract_scores(report)
        passed, warnings = compare_with_baseline(scores)

        print(f"\n   📄 {page_name}:")

        # 顯示分數
        for category, score in scores.items():
            baseline = BASELINE[category]
            diff = score - baseline

            if diff >= 0:
                color = Colors.GREEN
                symbol = "✅"
            elif diff >= -5:
                color = Colors.YELLOW
                symbol = "⚠️ "
            else:
                color = Colors.RED
                symbol = "❌"

            print_colored(
                color,
                f"      {symbol} {category.upper()}: {score}/100 "
                f"(baseline: {baseline}, diff: {diff:+d})"
            )

        if not passed:
            all_passed = False
            print_colored(Colors.YELLOW, "\n   ⚠️  警告:")
            for warning in warnings:
                print(f"      • {warning}")

    if all_passed:
        print_colored(Colors.GREEN, "\n   🎉 所有頁面通過檢查！")
    else:
        print_colored(Colors.YELLOW, "\n   ⚠️  部分頁面有分數下降")

def compare_two_runs(report_dir: Path, timestamp1: str, timestamp2: str):
    """比較兩次掃描結果"""
    run1_dir = report_dir / timestamp1
    run2_dir = report_dir / timestamp2

    if not run1_dir.exists():
        print_colored(Colors.RED, f"❌ 找不到報告: {timestamp1}")
        return

    if not run2_dir.exists():
        print_colored(Colors.RED, f"❌ 找不到報告: {timestamp2}")
        return

    print_colored(Colors.CYAN, f"\n📊 比較報告\n")
    print(f"   前: {timestamp1}")
    print(f"   後: {timestamp2}\n")

    # 取得兩次掃描的頁面
    json_files1 = {f.stem: f for f in run1_dir.glob("*.report.json")}
    json_files2 = {f.stem: f for f in run2_dir.glob("*.report.json")}

    common_pages = set(json_files1.keys()) & set(json_files2.keys())

    if not common_pages:
        print_colored(Colors.YELLOW, "⚠️  沒有共同的頁面可比較")
        return

    for page_key in sorted(common_pages):
        page_name = page_key.replace('.report', '').replace('lighthouse-', '')

        report1 = load_lighthouse_report(json_files1[page_key])
        report2 = load_lighthouse_report(json_files2[page_key])

        if not report1 or not report2:
            continue

        scores1 = extract_scores(report1)
        scores2 = extract_scores(report2)

        print_colored(Colors.BLUE, f"   📄 {page_name}:")

        has_regression = False

        for category in ['performance', 'accessibility', 'best-practices', 'seo']:
            score1 = scores1.get(category, 0)
            score2 = scores2.get(category, 0)
            diff = score2 - score1

            if diff > 0:
                color = Colors.GREEN
                symbol = "📈"
            elif diff < 0:
                color = Colors.RED if diff <= -5 else Colors.YELLOW
                symbol = "📉"
                if diff <= -5:
                    has_regression = True
            else:
                color = Colors.NC
                symbol = "➡️ "

            print_colored(
                color,
                f"      {symbol} {category.upper()}: {score1} → {score2} ({diff:+d})"
            )

        if has_regression:
            print_colored(Colors.RED, "      ⚠️  偵測到性能退化！")

        print()

def main():
    parser = argparse.ArgumentParser(description='分析 Lighthouse 報告')
    parser.add_argument(
        '--report-dir',
        type=Path,
        default=Path('./reports/lighthouse'),
        help='報告目錄路徑 (預設: ./reports/lighthouse)'
    )
    parser.add_argument(
        '--timestamp',
        type=str,
        help='指定要分析的報告時間戳記'
    )
    parser.add_argument(
        '--compare',
        nargs=2,
        metavar=('TIMESTAMP1', 'TIMESTAMP2'),
        help='比較兩次掃描結果'
    )
    parser.add_argument(
        '--list',
        action='store_true',
        help='列出所有可用的報告'
    )

    args = parser.parse_args()

    report_dir = args.report_dir

    # 列出所有報告
    if args.list:
        if not report_dir.exists():
            print_colored(Colors.RED, f"❌ 報告目錄不存在: {report_dir}")
            return

        report_dirs = sorted([d for d in report_dir.iterdir() if d.is_dir()])

        if not report_dirs:
            print_colored(Colors.YELLOW, "⚠️  沒有找到任何報告")
            return

        print_colored(Colors.CYAN, f"\n📋 可用報告 ({len(report_dirs)} 個):\n")
        for d in report_dirs:
            print(f"   • {d.name}")
        print()
        return

    # 比較兩次掃描
    if args.compare:
        compare_two_runs(report_dir, args.compare[0], args.compare[1])
        return

    # 分析報告
    analyze_report_directory(report_dir, args.timestamp)

if __name__ == '__main__':
    main()
