"""
train.py
--------
Trains two models on the preprocessed, resampled fraud data:
  1. XGBoost (primary model) - handles non-linear fraud patterns well
  2. Logistic Regression (baseline) - simple linear model for comparison

Both models are saved to disk. Comparing the two in your report/deck
shows you understand why a more complex model is justified here,
rather than just picking one algorithm blindly.
"""

import pickle
import pandas as pd
from xgboost import XGBClassifier
from sklearn.linear_model import LogisticRegression

from src import config
from src.preprocess import preprocess_data
from src.resampling import resample_data


def train_xgboost(X_train: pd.DataFrame, y_train: pd.Series) -> XGBClassifier:
    """
    Trains the primary XGBoost fraud detection model.
    """
    if config.VERBOSE:
        print("Training XGBoost model...")

    model = XGBClassifier(**config.XGB_PARAMS)
    model.fit(X_train, y_train)

    if config.VERBOSE:
        print("XGBoost training complete.")

    return model


def train_logistic_regression(X_train: pd.DataFrame, y_train: pd.Series) -> LogisticRegression:
    """
    Trains a Logistic Regression baseline model for comparison.
    """
    if config.VERBOSE:
        print("Training Logistic Regression baseline...")

    model = LogisticRegression(**config.LOGISTIC_REGRESSION_PARAMS)
    model.fit(X_train, y_train)

    if config.VERBOSE:
        print("Logistic Regression training complete.")

    return model


def save_model(model, path: str):
    """Saves a trained model to disk using pickle."""
    with open(path, "wb") as f:
        pickle.dump(model, f)
    if config.VERBOSE:
        print(f"Saved model to: {path}")


def run_training_pipeline():
    """
    Full training pipeline:
      1. Preprocess data (scale + split)
      2. Resample training data (SMOTE) for XGBoost
      3. Train XGBoost on resampled data
      4. Train Logistic Regression baseline on original (unresampled) data
      5. Save both models
    """
    X_train, X_test, y_train, y_test = preprocess_data()

    X_train_resampled, y_train_resampled = resample_data(X_train, y_train)

    xgb_model = train_xgboost(X_train_resampled, y_train_resampled)
    save_model(xgb_model, config.MODEL_PATH)

    lr_model = train_logistic_regression(X_train, y_train)
    lr_path = config.MODEL_PATH.replace("xgboost", "logistic_regression")
    save_model(lr_model, lr_path)

    return xgb_model, lr_model, X_test, y_test


if __name__ == "__main__":
    xgb_model, lr_model, X_test, y_test = run_training_pipeline()
    print("\nTraining pipeline complete. Both models saved.")
    print(f"Test set ready for evaluation: {X_test.shape}")