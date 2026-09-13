"""
config.py
---------
Central configuration for the SecurePayX fraud detection model.
All paths, constants, and hyperparameters live here so the rest
of the pipeline (data_loader, preprocess, train, evaluate) can
import from a single source of truth.
"""

import os

# ---------------------------------------------------------
# BASE PATHS
# ---------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # ai-model/

DATA_RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
DATA_PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODELS_DIR = os.path.join(BASE_DIR, "models")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

# ---------------------------------------------------------
# RAW DATASET FILE
# ---------------------------------------------------------
# Supports either CSV or XLSX. data_loader.py auto-detects
# based on the file extension found here.
RAW_DATA_FILENAME = "creditcard.csv"   # change to "creditcard.xlsx" if using Excel
RAW_DATA_PATH = os.path.join(DATA_RAW_DIR, RAW_DATA_FILENAME)

# ---------------------------------------------------------
# PROCESSED DATA (saved after preprocessing/splitting)
# ---------------------------------------------------------
X_TRAIN_PATH = os.path.join(DATA_PROCESSED_DIR, "X_train.pkl")
X_TEST_PATH = os.path.join(DATA_PROCESSED_DIR, "X_test.pkl")
Y_TRAIN_PATH = os.path.join(DATA_PROCESSED_DIR, "y_train.pkl")
Y_TEST_PATH = os.path.join(DATA_PROCESSED_DIR, "y_test.pkl")

# ---------------------------------------------------------
# MODEL OUTPUT
# ---------------------------------------------------------
MODEL_FILENAME = "xgboost_fraud_model.pkl"
MODEL_PATH = os.path.join(MODELS_DIR, MODEL_FILENAME)

SCALER_FILENAME = "scaler.pkl"
SCALER_PATH = os.path.join(MODELS_DIR, SCALER_FILENAME)

# ---------------------------------------------------------
# DATASET COLUMNS
# ---------------------------------------------------------
TARGET_COLUMN = "Class"          # 1 = fraud, 0 = legitimate
AMOUNT_COLUMN = "Amount"
TIME_COLUMN = "Time"

# ---------------------------------------------------------
# TRAIN/TEST SPLIT
# ---------------------------------------------------------
TEST_SIZE = 0.2
RANDOM_STATE = 42               # fixed seed for reproducibility
STRATIFY = True                 # mandatory given extreme class imbalance

# ---------------------------------------------------------
# RESAMPLING (IMBALANCE HANDLING)
# ---------------------------------------------------------
RESAMPLING_METHOD = "smote"     # options: "smote", "class_weight", "none"
SMOTE_SAMPLING_STRATEGY = 0.5   # ratio of minority:majority after SMOTE (tune as needed)

# ---------------------------------------------------------
# MODEL HYPERPARAMETERS (XGBoost)
# ---------------------------------------------------------
XGB_PARAMS = {
    "n_estimators": 300,
    "max_depth": 6,
    "learning_rate": 0.1,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "eval_metric": "aucpr",     # PR-AUC is the right metric for imbalanced fraud data
    "random_state": RANDOM_STATE,
    "n_jobs": -1,
}

# Baseline model (for comparison in report/deck)
LOGISTIC_REGRESSION_PARAMS = {
    "class_weight": "balanced",
    "max_iter": 1000,
    "random_state": RANDOM_STATE,
}

# ---------------------------------------------------------
# THRESHOLD TUNING
# ---------------------------------------------------------
# Default decision threshold (0.5) is usually wrong for imbalanced
# fraud data. threshold_tuning.py will search and override this.
DEFAULT_THRESHOLD = 0.5

# ---------------------------------------------------------
# MISC
# ---------------------------------------------------------
VERBOSE = True