"""
train.py
--------
Trains XGBoost (primary) and Logistic Regression (baseline) models
for ANY registered payment type.
"""

import os
import pickle
import pandas as pd
from xgboost import XGBClassifier
from sklearn.linear_model import LogisticRegression

from src import config
from src.resampling import resample_data

PREPROCESS_FUNCTIONS = {}


def _get_preprocess_function(dataset_name: str):
    if dataset_name not in PREPROCESS_FUNCTIONS:
        if dataset_name == "creditcard":
            from src.preprocess_creditcard import preprocess_data
        elif dataset_name == "paysim":
            from src.preprocess_paysim import preprocess_data
        elif dataset_name == "banksim":
            from src.preprocess_banksim import preprocess_data
        else:
            raise ValueError(f"No preprocessing function registered for '{dataset_name}'.")
        PREPROCESS_FUNCTIONS[dataset_name] = preprocess_data

    return PREPROCESS_FUNCTIONS[dataset_name]


def train_xgboost(X_train, y_train):
    model = XGBClassifier(**config.XGB_PARAMS)
    model.fit(X_train, y_train)
    return model


def train_logistic_regression(X_train, y_train):
    model = LogisticRegression(**config.LOGISTIC_REGRESSION_PARAMS)
    model.fit(X_train, y_train)
    return model


def save_model(model, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        pickle.dump(model, f)
    if config.VERBOSE:
        print(f"Saved model to: {path}")


def run_training_pipeline(dataset_name: str):
    print(f"\n{'=' * 50}")
    print(f"Training pipeline: {dataset_name}")
    print(f"{'=' * 50}")

    preprocess_data = _get_preprocess_function(dataset_name)
    X_train, X_test, y_train, y_test = preprocess_data()

    X_train_resampled, y_train_resampled = resample_data(X_train, y_train)

    model_paths = config.get_model_paths(dataset_name)

    print(f"[{dataset_name}] Training XGBoost...")
    xgb_model = train_xgboost(X_train_resampled, y_train_resampled)
    save_model(xgb_model, model_paths["xgboost"])

    print(f"[{dataset_name}] Training Logistic Regression...")
    lr_model = train_logistic_regression(X_train, y_train)
    save_model(lr_model, model_paths["logistic_regression"])

    return xgb_model, lr_model, X_test, y_test


if __name__ == "__main__":
    xgb_model, lr_model, X_test, y_test = run_training_pipeline("creditcard")
    print("\nTraining pipeline complete.")
    print(f"Test set ready for evaluation: {X_test.shape}")