"""
preprocess_banksim.py
----------------------
Preprocesses the BankSim dataset:
  1. Drops customer/merchant/zipcodeOri/zipMerchant (ID-like columns)
  2. One-hot encodes 'category' and 'gender'
  3. Scales numeric columns (step, age, amount)
  4. Splits into train/test sets using stratification
  5. Saves scaler and processed splits under data/processed/banksim/
"""

import os
import pickle
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from src import config
from src.data_loader import load_raw_data

DATASET_NAME = "banksim"

ID_COLUMNS_TO_DROP = ["customer", "merchant", "zipcodeOri", "zipMerchant"]
NUMERIC_COLUMNS = ["step", "age", "amount"]
CATEGORICAL_COLUMNS = ["category", "gender"]


def preprocess_data(df: pd.DataFrame = None):
    if df is None:
        df = load_raw_data(DATASET_NAME)

    df = df.copy()
    target_column = config.get_target_column(DATASET_NAME)

    # Clean quoted strings (BankSim CSV often has values like "'3'")
    for col in df.columns:
        if df[col].dtype == object:
            df[col] = df[col].astype(str).str.replace("'", "", regex=False)

    cols_to_drop = [c for c in ID_COLUMNS_TO_DROP if c in df.columns]
    if cols_to_drop:
        df = df.drop(columns=cols_to_drop)
        if config.VERBOSE:
            print(f"[{DATASET_NAME}] Dropped columns: {cols_to_drop}")

    for col in NUMERIC_COLUMNS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    df[target_column] = pd.to_numeric(df[target_column], errors="coerce")
    df = df.dropna(subset=[target_column])
    df[target_column] = df[target_column].astype(int)

    cat_cols_present = [c for c in CATEGORICAL_COLUMNS if c in df.columns]
    if cat_cols_present:
        df = pd.get_dummies(df, columns=cat_cols_present, prefix=cat_cols_present)
        if config.VERBOSE:
            print(f"[{DATASET_NAME}] One-hot encoded: {cat_cols_present}")

    scaler = StandardScaler()
    numeric_cols_present = [c for c in NUMERIC_COLUMNS if c in df.columns]
    df[numeric_cols_present] = scaler.fit_transform(df[numeric_cols_present])

    if config.VERBOSE:
        print(f"[{DATASET_NAME}] Scaled columns: {numeric_cols_present}")

    X = df.drop(columns=[target_column])
    y = df[target_column]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
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