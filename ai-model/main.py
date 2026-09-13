"""
main.py
-------
Orchestrates the full SecurePayX fraud detection pipeline end-to-end:

    load data -> preprocess -> resample -> train -> evaluate -> tune threshold

Run this single file to reproduce the entire pipeline from scratch,
including all saved models, scaler, and output charts.

Usage:
    python main.py
"""

from src import config
from src.train import run_training_pipeline
from src.evaluate import run_full_evaluation
from src.threshold_tuning import (
    find_best_threshold_by_f1,
    find_threshold_for_target_recall,
    evaluate_at_threshold,
)


def main():
    print("=" * 60)
    print("SecurePayX Fraud Detection - Full Pipeline")
    print("=" * 60)

    print("\n[1/3] Running training pipeline (load, preprocess, resample, train)...")
    xgb_model, lr_model, X_test, y_test = run_training_pipeline()

    print("\n[2/3] Evaluating models...")
    xgb_results = run_full_evaluation(xgb_model, X_test, y_test, "xgboost")
    lr_results = run_full_evaluation(lr_model, X_test, y_test, "logistic_regression")

    print("\n[3/3] Tuning decision threshold for XGBoost...")
    y_proba = xgb_results["y_proba"]

    default_f1 = evaluate_at_threshold(y_test, y_proba, config.DEFAULT_THRESHOLD)
    print(f"F1 at default threshold ({config.DEFAULT_THRESHOLD}): {default_f1:.4f}")

    best_threshold, best_f1 = find_best_threshold_by_f1(y_test, y_proba)
    find_threshold_for_target_recall(y_test, y_proba, target_recall=0.9)

    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE - SUMMARY")
    print("=" * 60)
    print(f"XGBoost         -> Precision: {xgb_results['precision']:.4f} | "
          f"Recall: {xgb_results['recall']:.4f} | "
          f"F1: {xgb_results['f1']:.4f} | "
          f"PR-AUC: {xgb_results['pr_auc']:.4f}")
    print(f"LogisticRegr.   -> Precision: {lr_results['precision']:.4f} | "
          f"Recall: {lr_results['recall']:.4f} | "
          f"F1: {lr_results['f1']:.4f} | "
          f"PR-AUC: {lr_results['pr_auc']:.4f}")
    print(f"\nOptimal threshold for XGBoost: {best_threshold:.4f} (F1: {best_f1:.4f})")
    print(f"\nModels saved in: {config.MODELS_DIR}")
    print(f"Charts saved in: {config.OUTPUTS_DIR}")
    print("\nUpdate OPTIMAL_THRESHOLD in src/predict.py if this value changed.")


if __name__ == "__main__":
    main()