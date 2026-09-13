"""
threshold_tuning.py
--------------------
Finds the optimal decision threshold for classifying a transaction
as fraud, instead of relying on the default 0.5 probability cutoff.

For imbalanced fraud data, 0.5 is rarely the best threshold. This
script scans the precision-recall curve and selects the threshold
that maximizes F1 score (best balance of precision and recall).
"""

import pickle
import numpy as np
import pandas as pd
from sklearn.metrics import precision_recall_curve, f1_score

from src import config


def find_best_threshold_by_f1(y_test: pd.Series, y_proba: np.ndarray):
    precisions, recalls, thresholds = precision_recall_curve(y_test, y_proba)

    f1_scores = (2 * precisions[:-1] * recalls[:-1]) / (precisions[:-1] + recalls[:-1] + 1e-10)

    best_idx = np.argmax(f1_scores)
    best_threshold = thresholds[best_idx]
    best_f1 = f1_scores[best_idx]

    if config.VERBOSE:
        print(f"Best threshold (by F1): {best_threshold:.4f}")
        print(f"  -> Precision: {precisions[best_idx]:.4f}")
        print(f"  -> Recall:    {recalls[best_idx]:.4f}")
        print(f"  -> F1 Score:  {best_f1:.4f}")

    return best_threshold, best_f1


def find_threshold_for_target_recall(y_test: pd.Series, y_proba: np.ndarray, target_recall: float = 0.9):
    precisions, recalls, thresholds = precision_recall_curve(y_test, y_proba)

    valid_indices = np.where(recalls[:-1] >= target_recall)[0]

    if len(valid_indices) == 0:
        print(f"No threshold achieves recall >= {target_recall}. Try a lower target.")
        return None, None

    best_idx = valid_indices[np.argmax(precisions[valid_indices])]
    best_threshold = thresholds[best_idx]

    if config.VERBOSE:
        print(f"\nThreshold for target recall >= {target_recall}: {best_threshold:.4f}")
        print(f"  -> Precision: {precisions[best_idx]:.4f}")
        print(f"  -> Recall:    {recalls[best_idx]:.4f}")

    return best_threshold, precisions[best_idx]


def apply_threshold(y_proba: np.ndarray, threshold: float) -> np.ndarray:
    return (y_proba >= threshold).astype(int)


def evaluate_at_threshold(y_test: pd.Series, y_proba: np.ndarray, threshold: float):
    y_pred = apply_threshold(y_proba, threshold)
    return f1_score(y_test, y_pred)


if __name__ == "__main__":
    with open(config.MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    with open(config.X_TEST_PATH, "rb") as f:
        X_test = pickle.load(f)
    with open(config.Y_TEST_PATH, "rb") as f:
        y_test = pickle.load(f)

    y_proba = model.predict_proba(X_test)[:, 1]

    print("===== Default threshold (0.5) =====")
    default_f1 = evaluate_at_threshold(y_test, y_proba, 0.5)
    print(f"F1 Score at 0.5: {default_f1:.4f}\n")

    print("===== Optimal threshold (maximizing F1) =====")
    best_threshold, best_f1 = find_best_threshold_by_f1(y_test, y_proba)

    print("\n===== Threshold for 90% recall target =====")
    find_threshold_for_target_recall(y_test, y_proba, target_recall=0.9)