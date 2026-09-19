"""
preprocess_creditcard.py
-------------------------
Preprocesses the credit card fraud dataset:
  1. Scales 'Amount' and 'Time' (the only non-PCA-transformed columns)
  2. Splits into train/test sets using stratification
  3. Saves the scaler and processed splits under data/processed/creditcard/

V1-V28 are left untouched since they're already PCA-transformed.
"""

import os
import pickle
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from src import config
from src.data_loader import load_raw_data

DATASET_NAME = "creditcard"
AMOUNT_COLUMN = "Amount"
TIME_COLUMN = "Time"


def preprocess_data(df: pd.DataFrame = None):
    if df is None:
        df = load_raw_data(DATASET_NAME)

    df = df.copy()
    target_column = config.get_target_column(DATASET_NAME)

    scaler = StandardScaler()
    cols_to_scale = [AMOUNT_COLUMN, TIME_COLUMN]

    missing_cols = [c for c in cols_to_scale if c not in df.columns]
    if missing_cols:
        raise ValueError(f"[{DATASET_NAME}] Expected columns not found: {missing_cols}")

    df[cols_to_scale] = scaler.fit_transform(df[cols_to_scale])

    if config.VERBOSE:
        print(f"[{DATASET_NAME}] Scaled columns: {cols_to_scale}")

    X = df.drop(columns=[target_column])
    y = df[target_column]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=config.TEST_SIZE,
        random_state=config.RANDOM_STATE,
        stratify=y if config.STRATIFY else None,
    )

    if config.VERBOSE:
        print(f"[{DATASET_NAME}] Train shape: {X_train.shape}, Test shape: {X_test.shape}")
        print(f"[{DATASET_NAME}] Train fraud cases: {y_train.sum()} / {len(y_train)}")
        print(f"[{DATASET_NAME}] Test fraud cases: {y_test.sum()} / {len(y_test)}")

    _save_artifacts(scaler, X_train, X_test, y_train, y_test)

    return X_train, X_test, y_train, y_test


def _save_artifacts(scaler, X_train, X_test, y_train, y_test):
    model_paths = config.get_model_paths(DATASET_NAME)
    processed_paths = config.get_processed_paths(DATASET_NAME)

    os.makedirs(os.path.dirname(model_paths["scaler"]), exist_ok=True)
    os.makedirs(os.path.dirname(processed_paths["X_train"]), exist_ok=True)

    with open(model_paths["scaler"], "wb") as f:
        pickle.dump(scaler, f)

    X_train.to_pickle(processed_paths["X_train"])
    X_test.to_pickle(processed_paths["X_test"])
    y_train.to_pickle(processed_paths["y_train"])
    y_test.to_pickle(processed_paths["y_test"])

    if config.VERBOSE:
        print(f"[{DATASET_NAME}] Saved scaler to: {model_paths['scaler']}")
        print(f"[{DATASET_NAME}] Saved processed splits to: {processed_paths['X_train']} (and siblings)")


if __name__ == "__main__":
    X_train, X_test, y_train, y_test = preprocess_data()
    print("\nSample of processed X_train:")
    print(X_train.head())