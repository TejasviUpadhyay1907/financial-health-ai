"""
Parse CSV/XLSX uploads and normalize to canonical columns.
- Flexible column name mapping (e.g. sales -> revenue).
- Require month; infer if possible else raise clear error.
- Missing numeric fields -> 0 and add data_quality flag.
"""
import io
from datetime import datetime
from typing import Any

import pandas as pd

# Canonical column names we expect in monthly_financials
CANONICAL = [
    "month",
    "revenue",
    "cogs",
    "operating_expense",
    "ar",
    "ap",
    "inventory",
    "loan_emi",
]

# Synonyms (case-insensitive) -> canonical
COLUMN_MAP = {
    "month": ["month", "month_end", "date", "period", "mth", "monthly period"],
    "revenue": ["revenue", "sales", "turnover", "income", "total revenue", "total sales"],
    "cogs": ["cogs", "cost of goods sold", "cost of sales", "direct cost", "cog"],
    "operating_expense": [
        "operating_expense",
        "operating expense",
        "opex",
        "expenses",
        "operating expenses",
        "admin expense",
        "overhead",
    ],
    "ar": ["ar", "accounts receivable", "receivables", "debtors", "sundry debtors"],
    "ap": ["ap", "accounts payable", "payables", "creditors", "sundry creditors"],
    "inventory": ["inventory", "stock", "inventory value", "stock value"],
    "loan_emi": ["loan_emi", "emi", "loan repayment", "loan emi", "emi payment", "debt service"],
}


def _normalize_header(name: str) -> str:
    return (name or "").strip().lower()


def _find_canonical_column(df_columns: list[str], canonical_key: str) -> str | None:
    """Return first matching column name from df for this canonical key, or None."""
    synonyms = [canonical_key] + COLUMN_MAP.get(canonical_key, [])
    normalized = [_normalize_header(c) for c in df_columns]
    for syn in synonyms:
        key_norm = _normalize_header(syn)
        for i, col_norm in enumerate(normalized):
            if key_norm in col_norm or col_norm in key_norm:
                return df_columns[i]
    return None


def _parse_month_value(val: Any) -> datetime | None:
    """Parse month from string or datetime. Returns date at month level."""
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    if isinstance(val, datetime):
        return val.replace(day=1)
    if isinstance(val, pd.Timestamp):
        return val.to_pydatetime().replace(day=1)
    s = str(val).strip()
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%m-%d-%Y", "%Y/%m/%d", "%B %Y", "%b %Y", "%Y-%m", "%m/%Y"):
        try:
            dt = datetime.strptime(s[:10] if len(s) >= 10 else s, fmt[: len(fmt)])
            return dt.replace(day=1)
        except ValueError:
            continue
    try:
        # Excel serial date
        if isinstance(val, (int, float)):
            return pd.Timestamp(val).to_pydatetime().replace(day=1)
    except Exception:
        pass
    return None


def normalize_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """
    Map columns to canonical names and ensure month exists.
    Returns (dataframe with canonical columns, data_quality_flags).
    """
    flags: list[str] = []
    mapping: dict[str, str] = {}
    for canon in CANONICAL:
        found = _find_canonical_column(list(df.columns), canon)
        if found:
            mapping[found] = canon
        elif canon != "month":
            # Optional numeric column missing -> will fill with 0
            flags.append(f"missing_column_{canon}")

    # Rename
    df = df.rename(columns=mapping)

    # Require month
    if "month" not in df.columns:
        # Try to infer: first column that looks like date
        for col in df.columns:
            if col in CANONICAL and col != "month":
                continue
            sample = df[col].dropna().head(1)
            if len(sample) and _parse_month_value(sample.iloc[0]) is not None:
                df = df.rename(columns={col: "month"})
                flags.append("month_column_inferred")
                break
        if "month" not in df.columns:
            raise ValueError(
                "No 'month' (or date/period) column found. "
                "Please add a column with month (e.g. month, date, period) with values like 2024-01 or Jan 2024."
            )

    # Ensure all canonical numeric columns exist
    for col in CANONICAL:
        if col == "month":
            continue
        if col not in df.columns:
            df[col] = 0

    # Parse month column
    months = []
    for v in df["month"]:
        m = _parse_month_value(v)
        if m is None:
            raise ValueError(f"Could not parse month value: {v}. Use formats like YYYY-MM-DD or Jan 2024.")
        months.append(m)
    df["month"] = months

    # Coerce numerics; replace non-numeric with 0
    for col in CANONICAL:
        if col == "month":
            continue
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
        if (df[col] < 0).any():
            flags.append(f"negative_values_{col}")

    # Sort by month
    df = df.sort_values("month").reset_index(drop=True)
    df = df[CANONICAL]

    return df, flags


def parse_upload(content: bytes, file_name: str) -> tuple[pd.DataFrame, list[str]]:
    """
    Parse CSV or XLSX from bytes. Returns (normalized dataframe, data_quality_flags).
    """
    ext = (file_name or "").lower().split(".")[-1]
    if ext == "csv":
        df = pd.read_csv(io.BytesIO(content))
    elif ext in ("xlsx", "xls"):
        df = pd.read_excel(io.BytesIO(content))
    else:
        raise ValueError(f"Unsupported file type: {ext}. Use CSV or XLSX.")

    if df.empty or len(df) == 0:
        raise ValueError("File has no data rows.")

    return normalize_dataframe(df)
