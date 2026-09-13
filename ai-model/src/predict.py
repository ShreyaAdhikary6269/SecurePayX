"""
predict.py
----------
Loads the trained model, scaler, and tuned threshold to make fraud
predictions on new, unseen transactions.

This is the module the backend will call: it takes raw transaction
data in, and returns a fraud prediction + probability score out.
"""

import pickle
import numpy as np
import pandas as pd

from src import config

# The optimal threshold found in threshold_tuning.py.
OPTIMAL_THRESHOLD = 0.9634


def load_prediction_artifacts():
    with open(config.MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    with open(config.SCALER_PATH, "rb") as f:
        scaler = pickle.load(f)

    return model, scaler


def preprocess_single_transaction(transaction: dict, scaler) -> pd.DataFrame:
    df = pd.DataFrame([transaction])

    cols_to_scale = [config.AMOUNT_COLUMN, config.TIME_COLUMN]
    missing_cols = [c for c in cols_to_scale if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Transaction is missing required columns: {missing_cols}")

    df[cols_to_scale] = scaler.transform(df[cols_to_scale])

    return df


def predict_transaction(transaction: dict, threshold: float = OPTIMAL_THRESHOLD) -> dict:
    model, scaler = load_prediction_artifacts()

    X = preprocess_single_transaction(transaction, scaler)

    fraud_probability = model.predict_proba(X)[0, 1]
    is_fraud = bool(fraud_probability >= threshold)

    result = {
        "is_fraud": is_fraud,
        "fraud_probability": float(fraud_probability),
        "threshold_used": threshold,
    }

    if config.VERBOSE:
        print(f"Prediction: {result}")

    return result


def predict_batch(transactions: pd.DataFrame, threshold: float = OPTIMAL_THRESHOLD) -> pd.DataFrame:
    model, scaler = load_prediction_artifacts()

    df = transactions.copy()
    cols_to_scale = [config.AMOUNT_COLUMN, config.TIME_COLUMN]
    df[cols_to_scale] = scaler.transform(df[cols_to_scale])

    fraud_probabilities = model.predict_proba(df)[:, 1]

    transactions = transactions.copy()
    transactions["fraud_probability"] = fraud_probabilities
    transactions["is_fraud"] = fraud_probabilities >= threshold

    return transactions


if __name__ == "__main__":
    with open(config.X_TEST_PATH, "rb") as f:
        X_test = pickle.load(f)
    with open(config.Y_TEST_PATH, "rb") as f:
        y_test = pickle.load(f)

    with open(config.MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    sample = X_test.iloc[[0]]
    actual_label = y_test.iloc[0]

    fraud_probability = model.predict_proba(sample)[0, 1]
    is_fraud = fraud_probability >= OPTIMAL_THRESHOLD

    print(f"Sample transaction actual label: {'Fraud' if actual_label == 1 else 'Legitimate'}")
    print(f"Predicted fraud probability: {fraud_probability:.4f}")
    print(f"Predicted as fraud (threshold {OPTIMAL_THRESHOLD}): {is_fraud}")