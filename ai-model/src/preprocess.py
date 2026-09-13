"""
preprocess.py
-------------
Preprocesses the raw fraud dataset:
  1. Scales 'Amount' and 'Time' (the only non-PCA-transformed columns)
  2. Splits into train/test sets using stratification
     (mandatory here given the extreme class imbalance)
  3. Saves the scaler and processed splits to disk for reuse

V1-V28 are left untouched since they're already PCA-transformed
and roughly standardized by construction.
"""

import pickle
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from src import config
from src.data_loader import load_raw_data


def preprocess_data(df: pd.DataFrame = None):
    """
    Runs the full preprocessing pipeline: scaling + stratified split.
    """
    if df is None:
        df = load_raw_data()

    df = df.copy()

    # 1. Scale Amount and Time
    scaler = StandardScaler()
    cols_to_scale = [config.AMOUNT_COLUMN, config.TIME_COLUMN]

    missing_cols = [c for c in cols_to_scale if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Expected columns not found in dataset: {missing_cols}")

    df[cols_to_scale] = scaler.fit_transform(df[cols_to_scale])

    if config.VERBOSE:
        print(f"Scaled columns: {cols_to_scale}")

    # 2. Separate features (X) and target (y)
    X = df.drop(columns=[config.TARGET_COLUMN])
    y = df[config.TARGET_COLUMN]

    # 3. Stratified train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=config.TEST_SIZE,
        random_state=config.RANDOM_STATE,
        stratify=y if config.STRATIFY else None,
    )

    if config.VERBOSE:
        print(f"Train shape: {X_train.shape}, Test shape: {X_test.shape}")
        print(f"Train fraud cases: {y_train.sum()} / {len(y_train)}")
        print(f"Test fraud cases: {y_test.sum()} / {len(y_test)}")

    # 4. Save scaler and processed splits
    _save_artifacts(scaler, X_train, X_test, y_train, y_test)

    return X_train, X_test, y_train, y_test


def _save_artifacts(scaler, X_train, X_test, y_train, y_test):
    """Saves the fitted scaler and processed data splits to disk."""
    with open(config.SCALER_PATH, "wb") as f:
        pickle.dump(scaler, f)

    X_train.to_pickle(config.X_TRAIN_PATH)
    X_test.to_pickle(config.X_TEST_PATH)
    y_train.to_pickle(config.Y_TRAIN_PATH)
    y_test.to_pickle(config.Y_TEST_PATH)

    if config.VERBOSE:
        print(f"Saved scaler to: {config.SCALER_PATH}")
        print(f"Saved processed train/test splits to: {config.DATA_PROCESSED_DIR}")


if __name__ == "__main__":
    # Quick manual test: run this file directly to confirm preprocessing works
    X_train, X_test, y_train, y_test = preprocess_data()
    print("\nSample of processed X_train:")
    print(X_train.head())