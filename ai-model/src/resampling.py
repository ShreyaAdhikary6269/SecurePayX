"""
resampling.py
--------------
Handles class imbalance in the training data using SMOTE
(Synthetic Minority Oversampling Technique).

IMPORTANT: Resampling is applied ONLY to the training set, never
the test set. The test set must reflect real-world fraud rates
so evaluation metrics are meaningful.
"""

import pandas as pd
from imblearn.over_sampling import SMOTE

from src import config


def apply_smote(X_train: pd.DataFrame, y_train: pd.Series):
    """
    Applies SMOTE to the training data only.
    """
    if config.VERBOSE:
        print(f"Before SMOTE: {y_train.value_counts().to_dict()}")

    smote = SMOTE(
        sampling_strategy=config.SMOTE_SAMPLING_STRATEGY,
        random_state=config.RANDOM_STATE,
    )

    X_resampled, y_resampled = smote.fit_resample(X_train, y_train)

    if config.VERBOSE:
        print(f"After SMOTE: {pd.Series(y_resampled).value_counts().to_dict()}")

    return X_resampled, y_resampled


def resample_data(X_train: pd.DataFrame, y_train: pd.Series):
    """
    Dispatches to the resampling method set in config.RESAMPLING_METHOD.

    Options:
      - "smote": oversample minority class using SMOTE
      - "class_weight": no resampling here; model itself handles
        imbalance via class_weight param (set in train.py)
      - "none": no resampling at all
    """
    method = config.RESAMPLING_METHOD.lower()

    if method == "smote":
        return apply_smote(X_train, y_train)
    elif method == "class_weight":
        if config.VERBOSE:
            print("Skipping resampling — using class_weight in model instead.")
        return X_train, y_train
    elif method == "none":
        if config.VERBOSE:
            print("No resampling applied.")
        return X_train, y_train
    else:
        raise ValueError(
            f"Unknown RESAMPLING_METHOD '{config.RESAMPLING_METHOD}'. "
            f"Use 'smote', 'class_weight', or 'none'."
        )


if __name__ == "__main__":
    # Quick manual test: loads preprocessed data and applies resampling
    import pickle

    with open(config.X_TRAIN_PATH, "rb") as f:
        X_train = pickle.load(f)
    with open(config.Y_TRAIN_PATH, "rb") as f:
        y_train = pickle.load(f)

    X_resampled, y_resampled = resample_data(X_train, y_train)
    print(f"\nFinal resampled shape: {X_resampled.shape}")