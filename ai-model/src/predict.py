"""
predict.py
----------
Loads the trained model, scaler, and tuned threshold to make fraud
predictions on new transactions, for ANY registered payment type.
"""

import pickle
import pandas as pd

from src import config

OPTIMAL_THRESHOLDS = {
    "creditcard": 0.9634,
    "paysim": 0.5,
    "banksim": 0.5,
}


def load_prediction_artifacts(dataset_name: str):
    model_paths = config.get_model_paths(dataset_name)
    with open(model_paths["xgboost"], "rb") as f:
        model = pickle.load(f)
    with open(model_paths["scaler"], "rb") as f:
        scaler = pickle.load(f)
    return model, scaler


def predict_transaction(dataset_name: str, transaction_df: pd.DataFrame, threshold: float = None) -> dict:
    model, scaler = load_prediction_artifacts(dataset_name)
    if threshold is None:
        threshold = OPTIMAL_THRESHOLDS.get(dataset_name, config.DEFAULT_THRESHOLD)

    fraud_probability = model.predict_proba(transaction_df)[0, 1]
    is_fraud = bool(fraud_probability >= threshold)

    result = {
        "is_fraud": is_fraud,
        "fraud_probability": float(fraud_probability),
        "threshold_used": threshold,
        "payment_type": dataset_name,
    }
    if config.VERBOSE:
        print(f"[{dataset_name}] Prediction: {result}")
    return result


def predict_batch(dataset_name: str, transactions_df: pd.DataFrame, threshold: float = None) -> pd.DataFrame:
    model, scaler = load_prediction_artifacts(dataset_name)
    if threshold is None:
        threshold = OPTIMAL_THRESHOLDS.get(dataset_name, config.DEFAULT_THRESHOLD)

    fraud_probabilities = model.predict_proba(transactions_df)[:, 1]
    result_df = transactions_df.copy()
    result_df["fraud_probability"] = fraud_probabilities
    result_df["is_fraud"] = fraud_probabilities >= threshold
    return result_df


if __name__ == "__main__":
    dataset_name = "creditcard"
    processed_paths = config.get_processed_paths(dataset_name)

    with open(processed_paths["X_test"], "rb") as f:
        X_test = pickle.load(f)
    with open(processed_paths["y_test"], "rb") as f:
        y_test = pickle.load(f)

    sample = X_test.iloc[[0]]
    actual_label = y_test.iloc[0]
    result = predict_transaction(dataset_name, sample)

    print(f"\nSample transaction actual label: {'Fraud' if actual_label == 1 else 'Legitimate'}")
    print(f"Prediction result: {result}")
