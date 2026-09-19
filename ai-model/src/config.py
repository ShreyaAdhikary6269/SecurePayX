"""
config.py
---------
Central configuration for the SecurePayX fraud detection models.

Uses a PAYMENT_TYPE_REGISTRY pattern: each payment category maps to
its own dataset, target column, and file paths. This lets the same
pipeline code (train.py, evaluate.py, predict.py) work across all
datasets by just passing a different "dataset_name" key, instead of
hardcoding logic per dataset.

Add a new payment type by adding one entry here - no need to touch
the pipeline logic itself.
"""

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # ai-model/

DATA_RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
DATA_PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODELS_DIR = os.path.join(BASE_DIR, "models")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

PAYMENT_TYPE_REGISTRY = {
    "creditcard": {
        "raw_filename": "creditcard.csv",
        "target_column": "Class",
        "processed_dir": os.path.join(DATA_PROCESSED_DIR, "creditcard"),
        "model_dir": os.path.join(MODELS_DIR, "creditcard"),
        "output_dir": os.path.join(OUTPUTS_DIR, "creditcard"),
    },
    "paysim": {
        "raw_filename": "paysim.csv",
        "target_column": "isFraud",
        "processed_dir": os.path.join(DATA_PROCESSED_DIR, "paysim"),
        "model_dir": os.path.join(MODELS_DIR, "paysim"),
        "output_dir": os.path.join(OUTPUTS_DIR, "paysim"),
    },
    "banksim": {
        "raw_filename": "banksim dataset.csv",
        "target_column": "fraud",
        "processed_dir": os.path.join(DATA_PROCESSED_DIR, "banksim"),
        "model_dir": os.path.join(MODELS_DIR, "banksim"),
        "output_dir": os.path.join(OUTPUTS_DIR, "banksim"),
    },
    # IEEE-CIS placeholder - fill in once dataset is downloaded.
    # "ieee_cis": {
    #     "raw_dir": os.path.join(DATA_RAW_DIR, "ieee_cis"),
    #     "target_column": "isFraud",
    #     "processed_dir": os.path.join(DATA_PROCESSED_DIR, "ieee_cis"),
    #     "model_dir": os.path.join(MODELS_DIR, "ieee_cis"),
    #     "output_dir": os.path.join(OUTPUTS_DIR, "ieee_cis"),
    # },
}

ACTIVE_DATASETS = ["creditcard", "paysim", "banksim"]


def get_raw_path(dataset_name: str) -> str:
    entry = PAYMENT_TYPE_REGISTRY[dataset_name]
    if "raw_filename" in entry:
        return os.path.join(DATA_RAW_DIR, entry["raw_filename"])
    raise ValueError(f"No raw_filename defined for '{dataset_name}'.")


def get_processed_paths(dataset_name: str) -> dict:
    processed_dir = PAYMENT_TYPE_REGISTRY[dataset_name]["processed_dir"]
    return {
        "X_train": os.path.join(processed_dir, "X_train.pkl"),
        "X_test": os.path.join(processed_dir, "X_test.pkl"),
        "y_train": os.path.join(processed_dir, "y_train.pkl"),
        "y_test": os.path.join(processed_dir, "y_test.pkl"),
    }


def get_model_paths(dataset_name: str) -> dict:
    model_dir = PAYMENT_TYPE_REGISTRY[dataset_name]["model_dir"]
    return {
        "xgboost": os.path.join(model_dir, "xgboost_fraud_model.pkl"),
        "logistic_regression": os.path.join(model_dir, "logistic_regression_fraud_model.pkl"),
        "scaler": os.path.join(model_dir, "scaler.pkl"),
    }


def get_output_dir(dataset_name: str) -> str:
    return PAYMENT_TYPE_REGISTRY[dataset_name]["output_dir"]


def get_target_column(dataset_name: str) -> str:
    return PAYMENT_TYPE_REGISTRY[dataset_name]["target_column"]


TEST_SIZE = 0.2
RANDOM_STATE = 42
STRATIFY = True

RESAMPLING_METHOD = "smote"
SMOTE_SAMPLING_STRATEGY = 0.5

MAX_LEGITIMATE_SAMPLES = 300000

XGB_PARAMS = {
    "n_estimators": 300,
    "max_depth": 6,
    "learning_rate": 0.1,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "eval_metric": "aucpr",
    "random_state": RANDOM_STATE,
    "n_jobs": -1,
}

LOGISTIC_REGRESSION_PARAMS = {
    "class_weight": "balanced",
    "max_iter": 1000,
    "random_state": RANDOM_STATE,
}

DEFAULT_THRESHOLD = 0.5

VERBOSE = True