"""
export_samples.py
-----------------
Creates frontend/src/data/creditcardSamples.json with real rows from the
credit card test set. Each row also carries its true label (_actual).

Scores and the threshold come from the calibrated model when
calibrate_model.py has been run, otherwise from the raw model.

Groups:
  fraud      - fraud rows the model flags (score at or above the threshold)
  borderline - rows with a middle score (below the threshold)
  safe       - legitimate rows the model clears with a very low score
  mixed      - rows spread over the whole score range, plus a few model mistakes

Run from the ai-model folder:  python export_samples.py
"""

import os
import json
import pickle

import pandas as pd

from src import config
from src.calibration import load_calibration, apply_calibration

DATASET = "creditcard"
N_FRAUD = 8
N_BORDERLINE = 6
N_SAFE = 8
N_PER_BIN = 6
SEED = 42

processed = config.get_processed_paths(DATASET)
model_paths = config.get_model_paths(DATASET)

with open(processed["X_test"], "rb") as f:
    X_test = pickle.load(f)
with open(processed["y_test"], "rb") as f:
    y_test = pickle.load(f)
with open(model_paths["scaler"], "rb") as f:
    scaler = pickle.load(f)
with open(model_paths["xgboost"], "rb") as f:
    model = pickle.load(f)

X = X_test.reset_index(drop=True)
y = pd.Series(y_test).reset_index(drop=True)
raw_probs = model.predict_proba(X)[:, 1]

calibration = load_calibration(DATASET)
if calibration is not None:
    calibrator, THRESHOLD = calibration
    probs = pd.Series(apply_calibration(calibrator, raw_probs))
    print(f"Using calibrated scores (threshold {THRESHOLD:.4f})")
else:
    THRESHOLD = 0.9634
    probs = pd.Series(raw_probs)
    print(f"Calibration not found, using raw scores (threshold {THRESHOLD})")

BORDERLINE_MIN = min(0.20, THRESHOLD * 0.5)

# Undo the scaling on Amount and Time so the form shows normal numbers
scaled_cols = list(getattr(scaler, "feature_names_in_", ["Amount", "Time"]))
raw = X.copy()
raw[scaled_cols] = scaler.inverse_transform(X[scaled_cols])


def pick(index, n):
    """Random choice of up to n row numbers from an index."""
    index = pd.Series(list(index))
    if len(index) == 0:
        return []
    return list(index.sample(min(n, len(index)), random_state=SEED))


fraud_idx = pick(y[(y == 1) & (probs >= THRESHOLD)].index, N_FRAUD)
borderline_idx = pick(probs[(probs >= BORDERLINE_MIN) & (probs < THRESHOLD)].index, N_BORDERLINE)
safe_idx = pick(y[(y == 0) & (probs < 0.05)].index, N_SAFE)

# Mixed pool: a few rows from each score range, whatever their true label
bins = sorted({0.0, 0.01, 0.1, 0.3, 0.7, THRESHOLD, 1.0001})
mixed_idx = []
for lo, hi in zip(bins[:-1], bins[1:]):
    mixed_idx += pick(probs[(probs >= lo) & (probs < hi)].index, N_PER_BIN)

# A few model mistakes, for honest error analysis
missed_frauds = y[(y == 1) & (probs < THRESHOLD)].index
false_alarms = y[(y == 0) & (probs >= THRESHOLD)].index
missed_pick = pick(missed_frauds, 3)
alarm_pick = pick(false_alarms, 2)
mixed_idx += missed_pick + alarm_pick
mixed_idx = list(dict.fromkeys(mixed_idx))  # remove duplicates, keep order


def to_record(i):
    rec = {
        "Amount": round(float(raw.loc[i, "Amount"]), 2),
        "Time": round(float(raw.loc[i, "Time"])),
    }
    for k in range(1, 29):
        rec[f"V{k}"] = float(raw.loc[i, f"V{k}"])
    rec["_actual"] = int(y[i])  # true label from the dataset (1 = fraud)
    return rec


samples = {
    "fraud": [to_record(i) for i in fraud_idx],
    "borderline": [to_record(i) for i in borderline_idx],
    "safe": [to_record(i) for i in safe_idx],
    "mixed": [to_record(i) for i in mixed_idx],
}

out_dir = os.path.join(config.BASE_DIR, "..", "frontend", "src", "data")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.abspath(os.path.join(out_dir, "creditcardSamples.json"))

with open(out_path, "w") as f:
    json.dump(samples, f, indent=1)

print(f"Saved to: {out_path}")
for name, idx in [("fraud", fraud_idx), ("borderline", borderline_idx), ("safe", safe_idx), ("mixed", mixed_idx)]:
    print(f"{name}: {len(idx)} samples, scores = {[round(float(probs[i]), 3) for i in idx]}")
print(f"Mistakes in mixed pool: missed frauds = {len(missed_pick)}, false alarms = {len(alarm_pick)}")