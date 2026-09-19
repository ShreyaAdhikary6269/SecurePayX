"""
data_loader.py
---------------
Loads raw fraud detection data for ANY registered payment type
(creditcard, paysim, banksim, etc.) based on config.PAYMENT_TYPE_REGISTRY.

Also handles PaySim-scale sampling: keeps all fraud rows, samples
a manageable number of legitimate rows, since PaySim has 6.3M+ rows.
"""

import os
import pandas as pd

from src import config


def load_raw_data(dataset_name: str) -> pd.DataFrame:
    data_path = config.get_raw_path(dataset_name)
    target_column = config.get_target_column(dataset_name)

    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f"Dataset not found at: {data_path}\n"
            f"Make sure the file is placed inside data/raw/ and that "
            f"the filename matches config.PAYMENT_TYPE_REGISTRY['{dataset_name}']."
        )

    file_ext = os.path.splitext(data_path)[1].lower()

    if config.VERBOSE:
        print(f"[{dataset_name}] Loading dataset from: {data_path}")

    if file_ext == ".csv":
        df = pd.read_csv(data_path)
    elif file_ext in (".xlsx", ".xls"):
        df = pd.read_excel(data_path, engine="openpyxl")
    else:
        raise ValueError(f"Unsupported file extension '{file_ext}'. Use .csv or .xlsx.")

    if len(df) > config.MAX_LEGITIMATE_SAMPLES and target_column in df.columns:
        df = _sample_large_dataset(df, target_column, dataset_name)

    _validate_data(df, target_column, dataset_name)

    if config.VERBOSE:
        print(f"[{dataset_name}] Loaded dataset with shape: {df.shape}")
        print(f"[{dataset_name}] Columns: {list(df.columns)}")

    return df


def _sample_large_dataset(df: pd.DataFrame, target_column: str, dataset_name: str) -> pd.DataFrame:
    fraud_rows = df[df[target_column] == 1]
    legit_rows = df[df[target_column] == 0]

    n_legit_to_keep = min(len(legit_rows), config.MAX_LEGITIMATE_SAMPLES)
    legit_sampled = legit_rows.sample(n=n_legit_to_keep, random_state=config.RANDOM_STATE)

    sampled_df = pd.concat([fraud_rows, legit_sampled]).sample(
        frac=1, random_state=config.RANDOM_STATE
    ).reset_index(drop=True)

    if config.VERBOSE:
        print(
            f"[{dataset_name}] Dataset too large ({len(df)} rows) - sampled down to "
            f"{len(sampled_df)} rows (kept all {len(fraud_rows)} fraud cases + "
            f"{n_legit_to_keep} legitimate samples)."
        )

    return sampled_df


def _validate_data(df: pd.DataFrame, target_column: str, dataset_name: str) -> None:
    if df.empty:
        raise ValueError(f"[{dataset_name}] Loaded dataset is empty.")

    if target_column not in df.columns:
        raise ValueError(
            f"[{dataset_name}] Expected target column '{target_column}' not found. "
            f"Available columns: {list(df.columns)}"
        )

    missing_counts = df.isnull().sum()
    total_missing = missing_counts.sum()
    if total_missing > 0 and config.VERBOSE:
        print(f"[{dataset_name}] Warning: dataset has {total_missing} missing values.")

    if config.VERBOSE:
        fraud_count = df[target_column].sum()
        total_count = len(df)
        fraud_pct = (fraud_count / total_count) * 100
        print(f"[{dataset_name}] Fraud cases: {fraud_count} / {total_count} ({fraud_pct:.3f}%)")


if __name__ == "__main__":
    df = load_raw_data("creditcard")
    print(df.head())