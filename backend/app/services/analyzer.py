"""
Deterministic financial health analysis. All calculations in Python/pandas.
No AI for metrics or score. Produces metrics_json, risk_flags, health_score, risk_level.
"""
from datetime import date
from decimal import Decimal
from typing import Any

import pandas as pd

from app.schemas.assessment import ScoreBreakdown

# Weights for overall health score (sum = 1.0)
WEIGHTS = {
    "profitability": 0.30,
    "liquidity_proxy": 0.25,
    "leverage": 0.20,
    "cashflow_quality": 0.15,
    "data_quality": 0.10,
}


def _to_float(x: Any) -> float:
    if x is None:
        return 0.0
    if isinstance(x, Decimal):
        return float(x)
    return float(x)


def _series_to_floats(s: pd.Series) -> list[float]:
    return [_to_float(x) for x in s]


def compute_metrics_and_risk(
    df: pd.DataFrame,
    data_quality_flags: list[str],
) -> tuple[dict[str, Any], list[str], list[str], list[str]]:
    """
    From monthly_financials dataframe (canonical columns), compute:
    - metrics dict for JSONB
    - risk_flags list
    - top_positive_factors, top_negative_factors
    """
    if df.empty or len(df) < 2:
        return {}, ["insufficient_data"], [], []

    df = df.sort_values("month")
    rev = df["revenue"]
    cogs = df["cogs"]
    opex = df["operating_expense"]
    ar = df["ar"]
    ap = df["ap"]
    inv = df["inventory"]
    emi = df["loan_emi"]

    metrics: dict[str, Any] = {}
    risk_flags: list[str] = []
    positive: list[str] = []
    negative: list[str] = []

    # --- Revenue trend (recent vs older) ---
    n = len(rev)
    recent_n = min(3, n)
    older_n = min(3, n - recent_n)
    if older_n and recent_n:
        recent_avg = rev.iloc[-recent_n:].mean()
        older_avg = rev.iloc[:older_n].mean()
        if older_avg and older_avg != 0:
            revenue_trend_pct = float((recent_avg - older_avg) / abs(older_avg) * 100)
        else:
            revenue_trend_pct = 0.0
    else:
        revenue_trend_pct = 0.0
    metrics["revenue_trend_pct"] = round(revenue_trend_pct, 2)
    if revenue_trend_pct > 5:
        positive.append("Revenue trend is positive (growth)")
    elif revenue_trend_pct < -10:
        negative.append("Revenue trend is declining")
        risk_flags.append("revenue_decline")

    # --- Expense trend ---
    total_exp = cogs + opex
    if older_n and recent_n and total_exp.iloc[:older_n].mean() and total_exp.iloc[:older_n].mean() != 0:
        exp_trend_pct = float(
            (total_exp.iloc[-recent_n:].mean() - total_exp.iloc[:older_n].mean())
            / abs(total_exp.iloc[:older_n].mean())
            * 100
        )
    else:
        exp_trend_pct = 0.0
    metrics["expense_trend_pct"] = round(exp_trend_pct, 2)
    if exp_trend_pct > 15 and revenue_trend_pct < 5:
        negative.append("Expenses growing faster than revenue")
        risk_flags.append("expense_growth_high")

    # --- Profit proxy (revenue - cogs - opex) ---
    profit_proxy = rev - cogs - opex
    avg_profit = profit_proxy.mean()
    metrics["avg_profit_proxy"] = round(_to_float(avg_profit), 2)
    metrics["latest_profit_proxy"] = round(_to_float(profit_proxy.iloc[-1]), 2)
    if _to_float(avg_profit) > 0:
        positive.append("Positive average profit (revenue minus costs)")
    else:
        negative.append("Negative or thin profit")
        risk_flags.append("negative_profit_proxy")

    # --- EMI burden (emi / revenue) ---
    avg_rev = rev.mean()
    avg_emi = emi.mean()
    if avg_rev and _to_float(avg_rev) > 0:
        emi_burden_pct = _to_float(avg_emi) / _to_float(avg_rev) * 100
    else:
        emi_burden_pct = 0.0
    metrics["emi_burden_pct"] = round(emi_burden_pct, 2)
    if emi_burden_pct > 25:
        negative.append("High EMI burden relative to revenue")
        risk_flags.append("high_emi_burden")
    elif emi_burden_pct > 0 and emi_burden_pct <= 15:
        positive.append("Manageable EMI burden")

    # --- AR/AP/Inventory signals ---
    if ar.notna().any() and ar.sum() > 0:
        metrics["avg_ar"] = round(_to_float(ar.mean()), 2)
        if _to_float(rev.iloc[-1]) and _to_float(rev.iloc[-1]) > 0:
            ar_days_proxy = _to_float(ar.iloc[-1]) / (_to_float(rev.iloc[-1]) / 30)
            metrics["ar_days_proxy"] = round(ar_days_proxy, 0)
            if ar_days_proxy > 90:
                risk_flags.append("high_ar_days")
                negative.append("High receivables (slow collections)")
    if ap.notna().any() and ap.sum() > 0:
        metrics["avg_ap"] = round(_to_float(ap.mean()), 2)
    if inv.notna().any() and inv.sum() > 0:
        metrics["avg_inventory"] = round(_to_float(inv.mean()), 2)

    # --- Data quality ---
    months = df["month"]
    expected_months = (months.max() - months.min()).days // 30 if len(months) > 1 else 0
    actual_months = len(months)
    if expected_months > 0 and actual_months < expected_months * 0.8:
        risk_flags.append("missing_months")
        negative.append("Gaps in monthly data")
    if "negative_values_revenue" in data_quality_flags or "negative_values_cogs" in data_quality_flags:
        risk_flags.append("negative_values_in_data")
        negative.append("Negative values in financial data")
    if any("missing_column" in f for f in data_quality_flags):
        risk_flags.append("incomplete_columns")
    # Suspicious spike: any single month revenue > 3x median
    if len(rev) >= 3:
        med = rev.median()
        if _to_float(med) > 0:
            for i, v in enumerate(rev):
                if _to_float(v) > 3 * _to_float(med):
                    risk_flags.append("revenue_spike_detected")
                    negative.append("Unusual revenue spike in one or more months")
                    break

    metrics["data_quality_flags"] = data_quality_flags
    metrics["months_analyzed"] = len(df)
    metrics["period_start"] = str(months.min().date()) if hasattr(months.min(), "date") else str(months.min())
    metrics["period_end"] = str(months.max().date()) if hasattr(months.max(), "date") else str(months.max())

    return metrics, risk_flags, positive, negative


def compute_sub_scores(
    metrics: dict[str, Any],
    risk_flags: list[str],
    data_quality_flags: list[str],
) -> ScoreBreakdown:
    """Compute 0–100 sub-scores for explainability."""
    # Profitability: based on profit proxy and revenue trend
    avg_profit = metrics.get("avg_profit_proxy", 0) or 0
    rev_trend = metrics.get("revenue_trend_pct", 0) or 0
    profitability = 50 + min(50, max(-50, rev_trend / 2))  # trend contribution
    if avg_profit > 0:
        profitability = min(100, profitability + 25)
    else:
        profitability = max(0, profitability - 30)
    profitability = max(0, min(100, profitability))

    # Liquidity proxy: AR/AP balance, EMI burden
    emi_burden = metrics.get("emi_burden_pct", 0) or 0
    liquidity = 100 - min(100, emi_burden * 2)  # high EMI -> lower liquidity score
    if "high_ar_days" in risk_flags:
        liquidity = max(0, liquidity - 15)
    liquidity = max(0, min(100, liquidity))

    # Leverage: EMI burden and negative profit
    leverage = 100
    if emi_burden > 30:
        leverage = 40
    elif emi_burden > 20:
        leverage = 65
    elif emi_burden > 10:
        leverage = 85
    if "negative_profit_proxy" in risk_flags:
        leverage = max(0, leverage - 20)
    leverage = max(0, min(100, leverage))

    # Cashflow quality: expense control, revenue stability
    exp_trend = metrics.get("expense_trend_pct", 0) or 0
    cashflow = 70
    if exp_trend > 20:
        cashflow -= 25
    elif exp_trend < 0:
        cashflow += 15
    if "revenue_decline" in risk_flags:
        cashflow -= 20
    cashflow = max(0, min(100, cashflow))

    # Data quality
    dq_penalty = len(data_quality_flags) * 15 + len([f for f in risk_flags if "missing" in f or "incomplete" in f or "negative_values" in f]) * 10
    data_quality = max(0, min(100, 100 - dq_penalty))

    return ScoreBreakdown(
        profitability=round(profitability, 1),
        liquidity_proxy=round(liquidity, 1),
        leverage=round(leverage, 1),
        cashflow_quality=round(cashflow, 1),
        data_quality=round(data_quality, 1),
    )


def compute_health_score(breakdown: ScoreBreakdown) -> int:
    """Weighted overall score 0–100."""
    s = (
        breakdown.profitability * WEIGHTS["profitability"]
        + breakdown.liquidity_proxy * WEIGHTS["liquidity_proxy"]
        + breakdown.leverage * WEIGHTS["leverage"]
        + breakdown.cashflow_quality * WEIGHTS["cashflow_quality"]
        + breakdown.data_quality * WEIGHTS["data_quality"]
    )
    return max(0, min(100, round(s)))


def get_risk_level(health_score: int, risk_flags: list[str]) -> str:
    """Low / Medium / High."""
    if health_score >= 70 and len(risk_flags) <= 1:
        return "Low"
    if health_score >= 50 and len(risk_flags) <= 3:
        return "Medium"
    return "High"
