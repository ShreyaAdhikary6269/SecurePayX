"""
calibration.py
--------------
Small helpers that turn a model's raw fraud score into a calibrated
probability (Platt scaling on the logit of the raw score) and load the
tuned threshold that goes with it.
"""

import os
import json
import pickle

import numpy as np

from src import config

EPS = 1e-6


def to_logit(p):
    p = np.clip(np.asarray(p, dtype=float), EPS, 1 - EPS)
    return np.log(p / (1 - p))


def calibration_paths(dataset_name):
    model_dir = config.PAYMENT_TYPE_REGISTRY[dataset_name]["model_dir"]
    return {
        "calibrator": os.path.join(model_dir, "calibrator.pkl"),
        "settings": os.path.join(model_dir, "calibration.json"),
    }


def load_calibration(dataset_name):
    """Returns (calibrator, threshold), or None if this dataset isn't calibrated yet."""
    paths = calibration_paths(dataset_name)
    if not (os.path.exists(paths["calibrator"]) and os.path.exists(paths["settings"])):
        return None
    with open(paths["calibrator"], "rb") as f:
        calibrator = pickle.load(f)
    with open(paths["settings"]) as f:
        settings = json.load(f)
    return calibrator, float(settings["threshold"])


def apply_calibration(calibrator, raw_probs):
    x = to_logit(raw_probs).reshape(-1, 1)
    return calibrator.predict_proba(x)[:, 1]