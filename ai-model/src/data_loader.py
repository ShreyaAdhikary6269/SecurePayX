"""
data_loader.py
---------------
Loads the raw fraud detection dataset from data/raw/.
Supports both .csv and .xlsx automatically based on the file
extension set in config.RAW_DATA_PATH.

Also runs a few basic sanity checks so problems are caught
immediately instead of silently breaking later in the pipeline.
"""

import os
import pandas as pd

from src import config


def load_raw_data(path: str = None) -> pd.DataFrame:
    """
    Loads the raw dataset from disk.

    Parameters
    ----------
    path : str, optional
        Override path to the dataset. Defaults to config.RAW_DATA_PATH.

    Returns
    -------
    pd.DataFrame
        The raw, unprocessed dataset.
    """
    data_path = path or config.RAW_DATA_PATH

    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f"Dataset not found at: {data_path}\n"
            f"Make sure your file is placed inside data/raw/ and that "
            f"config.RAW_DATA_FILENAME matches the exact filename."
        )

    file_ext = os.path.splitext(data_path)[1].lower()

    if config.VERBOSE:
        print(f"Loading dataset from: {data_path}")

    if file_ext == ".csv":
        df = pd.read_csv(data_path)
    elif file_ext in (".xlsx", ".xls"):
        df = pd.read_excel(data_path, engine="openpyxl")
    else:
        raise ValueError(
            f"Unsupported file extension '{file_ext}'. Use .csv or .xlsx."
        )

    _validate_data(df)

    if config.VERBOSE:
        print(f"Loaded dataset with shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")

    return df


def _validate_data(df: pd.DataFrame) -> None:
    """
    Basic sanity checks on the loaded dataset.
    Raises clear errors early instead of failing deep in the pipeline.
    """
    if df.empty:
        raise ValueError("Loaded dataset is empty.")

    if config.TARGET_COLUMN not in df.columns:
        raise ValueError(
            f"Expected target column '{config.TARGET_COLUMN}' not found. "
            f"Available columns: {list(df.columns)}"
        )

    missing_counts = df.isnull().sum()
    total_missing = missing_counts.sum()
    if total_missing > 0:
        print(f"Warning: dataset has {total_missing} missing values.")
        print(missing_counts[missing_counts > 0])

    # Quick fraud-rate summary, useful to confirm imbalance early
    if config.VERBOSE:
        fraud_count = df[config.TARGET_COLUMN].sum()
        total_count = len(df)
        fraud_pct = (fraud_count / total_count) * 100
        print(
            f"Fraud cases: {fraud_count} / {total_count} "
            f"({fraud_pct:.3f}%)"
        )


if __name__ == "__main__":
    # Quick manual test: run this file directly to confirm loading works
    df = load_raw_data()
    print(df.head())