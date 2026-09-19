"""
evaluate.py
-----------
Evaluates trained models on the held-out test set. Charts saved
under each dataset's own outputs/<dataset_name>/ folder.
"""

import os
import pickle
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    precision_score, recall_score, f1_score, average_precision_score,
    roc_auc_score, confusion_matrix, roc_curve, precision_recall_curve,
    classification_report,
)

from src import config


def evaluate_model(model, X_test, y_test, model_name="model"):
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    pr_auc = average_precision_score(y_test, y_proba)
    roc_auc = roc_auc_score(y_test, y_proba)

    print(f"\n===== {model_name} Evaluation =====")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"PR-AUC:    {pr_auc:.4f}")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print("\nFull classification report:")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Fraud"], zero_division=0))

    return {"model_name": model_name, "precision": precision, "recall": recall,
            "f1": f1, "pr_auc": pr_auc, "roc_auc": roc_auc, "y_pred": y_pred, "y_proba": y_proba}


def plot_confusion_matrix(y_test, y_pred, model_name, output_dir):
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=["Legitimate", "Fraud"], yticklabels=["Legitimate", "Fraud"])
    plt.title(f"Confusion Matrix - {model_name}")
    plt.ylabel("Actual")
    plt.xlabel("Predicted")
    plt.tight_layout()
    os.makedirs(output_dir, exist_ok=True)
    save_path = os.path.join(output_dir, f"confusion_matrix_{model_name}.png")
    plt.savefig(save_path)
    plt.close()
    print(f"Saved confusion matrix to: {save_path}")


def plot_roc_curve(y_test, y_proba, model_name, output_dir):
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    roc_auc = roc_auc_score(y_test, y_proba)
    plt.figure(figsize=(6, 5))
    plt.plot(fpr, tpr, label=f"ROC curve (AUC = {roc_auc:.4f})")
    plt.plot([0, 1], [0, 1], linestyle="--", color="gray")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title(f"ROC Curve - {model_name}")
    plt.legend()
    plt.tight_layout()
    os.makedirs(output_dir, exist_ok=True)
    save_path = os.path.join(output_dir, f"roc_curve_{model_name}.png")
    plt.savefig(save_path)
    plt.close()
    print(f"Saved ROC curve to: {save_path}")


def plot_pr_curve(y_test, y_proba, model_name, output_dir):
    precision, recall, _ = precision_recall_curve(y_test, y_proba)
    pr_auc = average_precision_score(y_test, y_proba)
    plt.figure(figsize=(6, 5))
    plt.plot(recall, precision, label=f"PR curve (AUC = {pr_auc:.4f})")
    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.title(f"Precision-Recall Curve - {model_name}")
    plt.legend()
    plt.tight_layout()
    os.makedirs(output_dir, exist_ok=True)
    save_path = os.path.join(output_dir, f"pr_curve_{model_name}.png")
    plt.savefig(save_path)
    plt.close()
    print(f"Saved PR curve to: {save_path}")


def plot_feature_importance(model, feature_names, model_name, output_dir):
    if not hasattr(model, "feature_importances_"):
        print(f"Skipping feature importance — {model_name} has no feature_importances_ attribute.")
        return
    importances = model.feature_importances_
    importance_df = pd.DataFrame(
        {"feature": feature_names, "importance": importances}
    ).sort_values("importance", ascending=False).head(15)
    plt.figure(figsize=(8, 6))
    sns.barplot(data=importance_df, x="importance", y="feature", color="steelblue")
    plt.title(f"Top 15 Feature Importances - {model_name}")
    plt.tight_layout()
    os.makedirs(output_dir, exist_ok=True)
    save_path = os.path.join(output_dir, f"feature_importance_{model_name}.png")
    plt.savefig(save_path)
    plt.close()
    print(f"Saved feature importance chart to: {save_path}")


def run_full_evaluation(model, X_test, y_test, model_name, dataset_name):
    output_dir = config.get_output_dir(dataset_name)
    results = evaluate_model(model, X_test, y_test, model_name)
    plot_confusion_matrix(y_test, results["y_pred"], model_name, output_dir)
    plot_roc_curve(y_test, results["y_proba"], model_name, output_dir)
    plot_pr_curve(y_test, results["y_proba"], model_name, output_dir)
    plot_feature_importance(model, X_test.columns, model_name, output_dir)
    return results


if __name__ == "__main__":
    dataset_name = "creditcard"
    model_paths = config.get_model_paths(dataset_name)
    processed_paths = config.get_processed_paths(dataset_name)

    with open(model_paths["xgboost"], "rb") as f:
        xgb_model = pickle.load(f)
    with open(model_paths["logistic_regression"], "rb") as f:
        lr_model = pickle.load(f)
    with open(processed_paths["X_test"], "rb") as f:
        X_test = pickle.load(f)
    with open(processed_paths["y_test"], "rb") as f:
        y_test = pickle.load(f)

    run_full_evaluation(xgb_model, X_test, y_test, "xgboost", dataset_name)
    run_full_evaluation(lr_model, X_test, y_test, "logistic_regression", dataset_name)