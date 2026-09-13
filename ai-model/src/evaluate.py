"""
evaluate.py
-----------
Evaluates trained models on the held-out test set using metrics
appropriate for imbalanced fraud data: Precision, Recall, F1,
PR-AUC, ROC-AUC, and a confusion matrix.

Accuracy is intentionally NOT used as the headline metric since
it's misleading on a 0.17% fraud rate dataset.

Also saves chart images (confusion matrix, ROC curve, PR curve,
feature importance) to outputs/ for use in the project report/deck.
"""

import pickle
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    average_precision_score,
    roc_auc_score,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
    classification_report,
)

from src import config


def evaluate_model(model, X_test: pd.DataFrame, y_test: pd.Series, model_name: str = "model"):
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    pr_auc = average_precision_score(y_test, y_proba)
    roc_auc = roc_auc_score(y_test, y_proba)

    print(f"\n===== {model_name} Evaluation =====")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"PR-AUC:    {pr_auc:.4f}   (most important metric for imbalanced fraud data)")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print("\nFull classification report:")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Fraud"]))

    return {
        "model_name": model_name,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "pr_auc": pr_auc,
        "roc_auc": roc_auc,
        "y_pred": y_pred,
        "y_proba": y_proba,
    }


def plot_confusion_matrix(y_test, y_pred, model_name: str = "model"):
    cm = confusion_matrix(y_test, y_pred)

    plt.figure(figsize=(6, 5))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["Legitimate", "Fraud"],
        yticklabels=["Legitimate", "Fraud"],
    )
    plt.title(f"Confusion Matrix - {model_name}")
    plt.ylabel("Actual")
    plt.xlabel("Predicted")
    plt.tight_layout()

    save_path = f"{config.OUTPUTS_DIR}/confusion_matrix_{model_name}.png"
    plt.savefig(save_path)
    plt.close()
    print(f"Saved confusion matrix to: {save_path}")


def plot_roc_curve(y_test, y_proba, model_name: str = "model"):
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

    save_path = f"{config.OUTPUTS_DIR}/roc_curve_{model_name}.png"
    plt.savefig(save_path)
    plt.close()
    print(f"Saved ROC curve to: {save_path}")


def plot_pr_curve(y_test, y_proba, model_name: str = "model"):
    precision, recall, _ = precision_recall_curve(y_test, y_proba)
    pr_auc = average_precision_score(y_test, y_proba)

    plt.figure(figsize=(6, 5))
    plt.plot(recall, precision, label=f"PR curve (AUC = {pr_auc:.4f})")
    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.title(f"Precision-Recall Curve - {model_name}")
    plt.legend()
    plt.tight_layout()

    save_path = f"{config.OUTPUTS_DIR}/pr_curve_{model_name}.png"
    plt.savefig(save_path)
    plt.close()
    print(f"Saved PR curve to: {save_path}")


def plot_feature_importance(model, feature_names, model_name: str = "xgboost"):
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

    save_path = f"{config.OUTPUTS_DIR}/feature_importance_{model_name}.png"
    plt.savefig(save_path)
    plt.close()
    print(f"Saved feature importance chart to: {save_path}")


def run_full_evaluation(model, X_test, y_test, model_name: str = "model"):
    results = evaluate_model(model, X_test, y_test, model_name)
    plot_confusion_matrix(y_test, results["y_pred"], model_name)
    plot_roc_curve(y_test, results["y_proba"], model_name)
    plot_pr_curve(y_test, results["y_proba"], model_name)
    plot_feature_importance(model, X_test.columns, model_name)
    return results


if __name__ == "__main__":
    with open(config.MODEL_PATH, "rb") as f:
        xgb_model = pickle.load(f)

    lr_path = config.MODEL_PATH.replace("xgboost", "logistic_regression")
    with open(lr_path, "rb") as f:
        lr_model = pickle.load(f)

    with open(config.X_TEST_PATH, "rb") as f:
        X_test = pickle.load(f)
    with open(config.Y_TEST_PATH, "rb") as f:
        y_test = pickle.load(f)

    run_full_evaluation(xgb_model, X_test, y_test, "xgboost")
    run_full_evaluation(lr_model, X_test, y_test, "logistic_regression")