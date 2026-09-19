"""
main.py
-------
Orchestrates the full pipeline for EVERY dataset in config.ACTIVE_DATASETS.
"""

from src import config
from src.train import run_training_pipeline
from src.evaluate import run_full_evaluation
from src.threshold_tuning import (
    find_best_threshold_by_f1,
    find_threshold_for_target_recall,
    evaluate_at_threshold,
)


def run_pipeline_for_dataset(dataset_name: str) -> dict:
    xgb_model, lr_model, X_test, y_test = run_training_pipeline(dataset_name)

    print(f"\n[{dataset_name}] Evaluating models...")
    xgb_results = run_full_evaluation(xgb_model, X_test, y_test, "xgboost", dataset_name)
    lr_results = run_full_evaluation(lr_model, X_test, y_test, "logistic_regression", dataset_name)

    print(f"\n[{dataset_name}] Tuning decision threshold for XGBoost...")
    y_proba = xgb_results["y_proba"]

    default_f1 = evaluate_at_threshold(y_test, y_proba, config.DEFAULT_THRESHOLD)
    print(f"[{dataset_name}] F1 at default threshold ({config.DEFAULT_THRESHOLD}): {default_f1:.4f}")

    best_threshold, best_f1 = find_best_threshold_by_f1(y_test, y_proba)
    find_threshold_for_target_recall(y_test, y_proba, target_recall=0.9)

    return {"dataset_name": dataset_name, "xgb_results": xgb_results, "lr_results": lr_results,
            "best_threshold": best_threshold, "best_f1": best_f1}


def main():
    print("=" * 60)
    print("SecurePayX Fraud Detection - Full Multi-Dataset Pipeline")
    print(f"Active datasets: {config.ACTIVE_DATASETS}")
    print("=" * 60)

    all_summaries = []
    for dataset_name in config.ACTIVE_DATASETS:
        summary = run_pipeline_for_dataset(dataset_name)
        all_summaries.append(summary)

    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE - SUMMARY (ALL DATASETS)")
    print("=" * 60)
    for s in all_summaries:
        xr = s["xgb_results"]
        lr = s["lr_results"]
        print(f"\n[{s['dataset_name']}]")
        print(f"  XGBoost       -> Precision: {xr['precision']:.4f} | Recall: {xr['recall']:.4f} | "
              f"F1: {xr['f1']:.4f} | PR-AUC: {xr['pr_auc']:.4f}")
        print(f"  LogisticRegr. -> Precision: {lr['precision']:.4f} | Recall: {lr['recall']:.4f} | "
              f"F1: {lr['f1']:.4f} | PR-AUC: {lr['pr_auc']:.4f}")
        print(f"  Optimal threshold: {s['best_threshold']:.4f} (F1: {s['best_f1']:.4f})")
        print(f"  -> Update OPTIMAL_THRESHOLDS['{s['dataset_name']}'] in src/predict.py to {s['best_threshold']:.4f}")

    print(f"\nAll models saved under: {config.MODELS_DIR}")
    print(f"All charts saved under: {config.OUTPUTS_DIR}")


if __name__ == "__main__":
    main()