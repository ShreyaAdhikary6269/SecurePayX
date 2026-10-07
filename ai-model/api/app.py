"""
app.py
------
Small Flask API that loads the trained fraud models and exposes
prediction endpoints. The Node.js backend calls this service internally -
it is never called directly by the browser.

Run with: python api/app.py
Runs on port 8000 by default.
"""

import io
import os
import sys
import json
import pickle

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
from flask import Flask, request, jsonify
import pandas as pd
from sklearn.metrics import confusion_matrix, f1_score, precision_score, recall_score

from src import config
from src.calibration import load_calibration, apply_calibration

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 6 * 1024 * 1024  # uploads up to 6 MB

# Fallback thresholds, used only when a dataset has no calibration files yet
OPTIMAL_THRESHOLDS = {
    "creditcard": 0.9634,
    "paysim": 0.9190,
    "banksim": 0.5,
}

LABELS = {
    "creditcard": "Credit / debit card",
    "paysim": "Mobile wallet / UPI",
    "banksim": "Banking",
}

MAX_BATCH_ROWS = 5000
VALID_PAYSIM_TYPES = ["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"]

# Column names that may hold the true answer, per dataset
LABEL_COLUMNS = {
    "creditcard": ["Class", "isFraud", "fraud", "label"],
    "paysim": ["isFraud", "fraud", "label", "Class"],
    "banksim": ["fraud", "isFraud", "label", "Class"],
}

_cache = {}
_calibration_cache = {}


@app.errorhandler(413)
def too_large(_err):
    return jsonify({"error": "The file is too large (maximum 5 MB)"}), 413


def load_artifacts(dataset_name):
    """Loads and caches a dataset's model + scaler so they're only read from disk once."""
    if dataset_name not in _cache:
        model_paths = config.get_model_paths(dataset_name)
        with open(model_paths["xgboost"], "rb") as f:
            model = pickle.load(f)
        with open(model_paths["scaler"], "rb") as f:
            scaler = pickle.load(f)
        _cache[dataset_name] = (model, scaler)
    return _cache[dataset_name]


def get_calibration(dataset_name):
    """Returns (calibrator, threshold) if calibrate_model.py has been run, else None."""
    if dataset_name not in _calibration_cache:
        loaded = load_calibration(dataset_name)
        if loaded is None:
            return None
        _calibration_cache[dataset_name] = loaded
    return _calibration_cache[dataset_name]


def num(payload, key, default=0.0):
    """Reads a number from the request; empty or missing values use the default."""
    value = payload.get(key, default)
    if value is None or value == "":
        return float(default)
    return float(value)


def scale_columns(df, scaler, default_cols):
    """Scales columns in the same order the scaler was fitted with."""
    cols = list(getattr(scaler, "feature_names_in_", default_cols))
    df[cols] = scaler.transform(df[cols])
    return df


def align_to_model(df, model):
    """Puts columns in exactly the order the model was trained on."""
    expected_cols = model.get_booster().feature_names
    if expected_cols:
        df = df.reindex(columns=expected_cols, fill_value=0)
    return df


def risk_level(p):
    if p is None:
        return None
    if p < 0.3:
        return "low"
    if p < 0.7:
        return "medium"
    return "high"


# ---------------------------------------------------------------------------
# Single transaction
# ---------------------------------------------------------------------------

def build_creditcard_row(payload, scaler, model):
    """
    Builds a single-row DataFrame for the credit card model.
    V1-V28 are read from the request when present (the sample buttons send
    them); otherwise they default to 0.
    """
    row = {f"V{i}": num(payload, f"V{i}", 0.0) for i in range(1, 29)}
    row["Amount"] = num(payload, "Amount", 0.0)
    row["Time"] = num(payload, "Time", 0.0)
    df = pd.DataFrame([row])
    df = scale_columns(df, scaler, ["Amount", "Time"])
    return align_to_model(df, model)


def build_paysim_row(payload, scaler, model):
    row = {
        "step": num(payload, "step", 1),
        "amount": num(payload, "amount", 0),
        "oldbalanceOrg": num(payload, "oldbalanceOrg", 0),
        "newbalanceOrig": num(payload, "newbalanceOrig", 0),
        "oldbalanceDest": num(payload, "oldbalanceDest", 0),
        "newbalanceDest": num(payload, "newbalanceDest", 0),
    }
    for t in VALID_PAYSIM_TYPES:
        row[f"type_{t}"] = 1 if payload.get("type") == t else 0

    df = pd.DataFrame([row])
    numeric_cols = ["step", "amount", "oldbalanceOrg", "newbalanceOrig", "oldbalanceDest", "newbalanceDest"]
    df = scale_columns(df, scaler, numeric_cols)
    return align_to_model(df, model)


def build_banksim_row(payload, scaler, model):
    row = {
        "step": 1.0,
        "age": num(payload, "age", 0),
        "amount": num(payload, "amount", 0),
    }
    df = pd.DataFrame([row])
    df = scale_columns(df, scaler, ["step", "age", "amount"])
    df = align_to_model(df, model)

    gender_col = f"gender_{payload.get('gender', 'M')}"
    if gender_col in df.columns:
        df[gender_col] = 1

    category_col = f"category_{payload.get('category', '')}"
    if category_col in df.columns:
        df[category_col] = 1

    return df


@app.route("/predict/<dataset_name>", methods=["POST"])
def predict(dataset_name):
    if dataset_name not in config.PAYMENT_TYPE_REGISTRY:
        return jsonify({"error": f"Unknown payment type '{dataset_name}'"}), 400

    payload = request.get_json(force=True) or {}

    try:
        model, scaler = load_artifacts(dataset_name)
    except FileNotFoundError:
        return jsonify({
            "error": f"Model for '{dataset_name}' has not been trained yet. Run main.py first."
        }), 500

    try:
        if dataset_name == "creditcard":
            df = build_creditcard_row(payload, scaler, model)
        elif dataset_name == "paysim":
            df = build_paysim_row(payload, scaler, model)
        elif dataset_name == "banksim":
            df = build_banksim_row(payload, scaler, model)
        else:
            return jsonify({"error": f"No input builder for '{dataset_name}'"}), 500
    except Exception as e:
        return jsonify({"error": f"Bad input: {str(e)}"}), 400

    try:
        raw_probability = float(model.predict_proba(df)[0, 1])
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

    calibration = get_calibration(dataset_name)
    if calibration is not None:
        calibrator, threshold = calibration
        fraud_probability = float(apply_calibration(calibrator, [raw_probability])[0])
    else:
        threshold = OPTIMAL_THRESHOLDS.get(dataset_name, config.DEFAULT_THRESHOLD)
        fraud_probability = raw_probability

    is_fraud = bool(fraud_probability >= threshold)

    return jsonify({
        "is_fraud": is_fraud,
        "fraud_probability": fraud_probability,
        "threshold_used": round(threshold, 4),
        "raw_probability": raw_probability,
        "calibrated": calibration is not None,
        "payment_type": dataset_name,
    })


# ---------------------------------------------------------------------------
# Batch file scoring
# ---------------------------------------------------------------------------

def py(value):
    """Turns numpy and missing values into plain Python values for JSON."""
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    if hasattr(value, "item"):
        return value.item()
    return value


def find_col(df, name):
    """Case-insensitive column lookup. Returns the real column name or None."""
    lookup = {str(c).lower(): c for c in df.columns}
    return lookup.get(name.lower())


def clean_text(series):
    return series.astype(str).str.strip().str.strip("'\"")


def read_table(upload):
    name = (upload.filename or "").lower()
    data = upload.stream.read()

    if name.endswith((".xlsx", ".xlsm")):
        return pd.read_excel(io.BytesIO(data), engine="openpyxl", nrows=MAX_BATCH_ROWS + 1)

    if name.endswith((".csv", ".txt", ".tsv")):
        for encoding in ("utf-8-sig", "latin-1"):
            try:
                return pd.read_csv(
                    io.BytesIO(data), sep=None, engine="python", encoding=encoding, nrows=MAX_BATCH_ROWS + 1
                )
            except UnicodeDecodeError:
                continue

    raise ValueError("Unsupported file type. Upload a .csv or .xlsx file")


def detect_dataset(df):
    cols = {str(c).lower() for c in df.columns}
    if {"v1", "v2", "v28", "amount"} <= cols:
        return "creditcard"
    if "oldbalanceorg" in cols and "amount" in cols:
        return "paysim"
    if {"category", "age", "amount"} <= cols:
        return "banksim"
    return None


def read_labels(df, dataset):
    """Returns the true labels (0/1) if the file has a usable label column, else None."""
    for name in LABEL_COLUMNS[dataset]:
        col = find_col(df, name)
        if col is None:
            continue
        values = pd.to_numeric(clean_text(df[col]), errors="coerce")
        if values.notna().all() and set(values.unique()) <= {0, 1}:
            return values.astype(int).to_numpy()
    return None


def batch_creditcard(df, scaler, model):
    names = [f"V{i}" for i in range(1, 29)] + ["Amount", "Time"]
    found, missing = {}, []
    for name in names:
        real = find_col(df, name)
        if real is None:
            missing.append(name)
        else:
            found[name] = pd.to_numeric(df[real], errors="coerce")
    if missing:
        raise ValueError(
            "Credit card files need the columns Time, V1 to V28 and Amount. Missing: "
            + ", ".join(missing[:6])
            + ("..." if len(missing) > 6 else "")
        )

    feats = pd.DataFrame(found)
    invalid = feats.isna().any(axis=1).to_numpy()
    display = feats[["Amount", "Time"]].copy()
    feats = scale_columns(feats.fillna(0.0), scaler, ["Amount", "Time"])
    return align_to_model(feats, model), invalid, display


def batch_paysim(df, scaler, model):
    numeric_names = ["amount", "oldbalanceOrg", "newbalanceOrig", "oldbalanceDest", "newbalanceDest"]
    found, missing = {}, []
    for name in numeric_names:
        real = find_col(df, name)
        if real is None:
            missing.append(name)
        else:
            found[name] = pd.to_numeric(df[real], errors="coerce")
    type_col = find_col(df, "type")
    if type_col is None:
        missing.append("type")
    if missing:
        raise ValueError("Wallet files need the columns: type, amount, oldbalanceOrg, newbalanceOrig, "
                         "oldbalanceDest, newbalanceDest. Missing: " + ", ".join(missing))

    step_col = find_col(df, "step")
    step = pd.to_numeric(df[step_col], errors="coerce") if step_col else pd.Series(1.0, index=df.index)
    types = clean_text(df[type_col]).str.upper()

    feats = pd.DataFrame({"step": step, **found})
    invalid = (feats.isna().any(axis=1) | ~types.isin(VALID_PAYSIM_TYPES)).to_numpy()

    display = pd.DataFrame({"type": types, **found})
    display = display[["type"] + numeric_names]

    for t in VALID_PAYSIM_TYPES:
        feats[f"type_{t}"] = (types == t).astype(int)

    numeric_cols = ["step"] + numeric_names
    feats = scale_columns(feats.fillna(0.0), scaler, numeric_cols)
    return align_to_model(feats, model), invalid, display


def batch_banksim(df, scaler, model):
    age_col = find_col(df, "age")
    amount_col = find_col(df, "amount")
    category_col = find_col(df, "category")
    if age_col is None or amount_col is None or category_col is None:
        raise ValueError("Banking files need the columns: age, gender, category, amount "
                         "(gender is optional).")

    gender_col = find_col(df, "gender")
    step_col = find_col(df, "step")

    age_text = clean_text(df[age_col])
    age_num = pd.to_numeric(age_text, errors="coerce")
    age_unknown = age_num.isna().astype(int)
    age = age_num.fillna(3.0)  # unknown ages use a middle bracket, as in training
    amount = pd.to_numeric(df[amount_col], errors="coerce")
    category = clean_text(df[category_col])
    gender = clean_text(df[gender_col]).str.upper() if gender_col else pd.Series("M", index=df.index)
    step = pd.to_numeric(df[step_col], errors="coerce").fillna(1.0) if step_col else pd.Series(1.0, index=df.index)

    invalid = (amount.isna() | category.isin(["", "nan"])).to_numpy()

    feats = pd.DataFrame({"step": step, "age": age, "amount": amount.fillna(0.0)})
    feats = scale_columns(feats, scaler, ["step", "age", "amount"])
    feats = align_to_model(feats, model).reset_index(drop=True)

    columns = list(feats.columns)
    for i in range(len(feats)):
        for prefix, value in (("gender_", gender.iloc[i]), ("category_", category.iloc[i])):
            name = f"{prefix}{value}"
            if name in columns:
                feats.iat[i, columns.index(name)] = 1
    if "age_unknown" in columns:
        feats["age_unknown"] = age_unknown.to_numpy()

    display = pd.DataFrame({"age": age_text, "gender": gender, "category": category, "amount": amount})
    return feats, invalid, display


BATCH_BUILDERS = {
    "creditcard": batch_creditcard,
    "paysim": batch_paysim,
    "banksim": batch_banksim,
}


@app.route("/predict-file", methods=["POST"])
def predict_file():
    upload = request.files.get("file")
    if upload is None or not upload.filename:
        return jsonify({"error": "No file uploaded"}), 400

    requested = (request.form.get("payment_type") or "auto").strip().lower()

    try:
        df = read_table(upload)
        df.columns = [str(c).strip().strip("'\"") for c in df.columns]
        df = df.reset_index(drop=True)

        if df.empty:
            raise ValueError("The file has no rows")
        if len(df) > MAX_BATCH_ROWS:
            raise ValueError(f"This file has more than {MAX_BATCH_ROWS} rows. Split it into smaller files.")

        if requested in BATCH_BUILDERS:
            dataset = requested
        else:
            dataset = detect_dataset(df)
            if dataset is None:
                raise ValueError(
                    "Could not tell what kind of file this is. Expected columns: "
                    "credit card = Time, V1 to V28, Amount; wallet = type, amount, oldbalanceOrg, newbalanceOrig, "
                    "oldbalanceDest, newbalanceDest; banking = age, gender, category, amount."
                )

        try:
            model, scaler = load_artifacts(dataset)
        except FileNotFoundError:
            raise ValueError(f"The {LABELS[dataset]} model has not been trained yet.")

        feats, invalid, display = BATCH_BUILDERS[dataset](df, scaler, model)
        labels = read_labels(df, dataset)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        return jsonify({"error": f"Could not read this file: {err}"}), 400

    try:
        raw = model.predict_proba(feats)[:, 1]
    except Exception as err:
        return jsonify({"error": f"Prediction failed: {err}"}), 500

    calibration = get_calibration(dataset)
    if calibration is not None:
        calibrator, threshold = calibration
        probs = apply_calibration(calibrator, raw)
    else:
        threshold = OPTIMAL_THRESHOLDS.get(dataset, config.DEFAULT_THRESHOLD)
        probs = raw

    flags = probs >= threshold
    valid = ~invalid
    n_valid = int(valid.sum())
    if n_valid == 0:
        return jsonify({"error": "None of the rows could be read. Check that the number columns contain numbers."}), 400

    records = display.astype(object).where(pd.notna(display), None).to_dict("records")
    rows = []
    for i in range(len(df)):
        ok = bool(valid[i])
        p = float(probs[i]) if ok else None
        rows.append({
            "row": i + 2,  # row number in the file (row 1 is the header)
            "valid": ok,
            "probability": p,
            "isFraud": bool(flags[i]) if ok else False,
            "risk": risk_level(p),
            "actual": int(labels[i]) if labels is not None else None,
            "fields": {k: py(v) for k, v in records[i].items()},
        })

    summary = {
        "totalRows": int(len(df)),
        "validRows": n_valid,
        "invalidRows": int(len(df) - n_valid),
        "flagged": int(flags[valid].sum()),
        "flagRate": round(float(flags[valid].mean()) * 100, 2),
        "avgProbability": round(float(probs[valid].mean()), 4),
        "threshold": round(float(threshold), 4),
        "calibrated": calibration is not None,
        "metrics": None,
    }

    if labels is not None:
        y_true = labels[valid]
        y_pred = flags[valid].astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
        summary["metrics"] = {
            "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
            "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
            "f1": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp),
        }

    return jsonify({
        "dataset": dataset,
        "label": LABELS[dataset],
        "summary": summary,
        "rows": rows,
    })


# ---------------------------------------------------------------------------
# Status
# ---------------------------------------------------------------------------

@app.route("/model-info", methods=["GET"])
def model_info():
    """Status of every model plus the saved metrics. Used by the admin dashboard."""
    metrics = {}
    generated_at = None
    metrics_path = os.path.join(config.OUTPUTS_DIR, "metrics_summary.json")
    if os.path.exists(metrics_path):
        with open(metrics_path) as f:
            data = json.load(f)
        metrics = data.get("models", {})
        generated_at = data.get("generated_at")

    models = {}
    for name in config.ACTIVE_DATASETS:
        paths = config.get_model_paths(name)
        trained = os.path.exists(paths["xgboost"]) and os.path.exists(paths["scaler"])
        calibration = get_calibration(name) if trained else None
        if calibration is not None:
            threshold = calibration[1]
        else:
            threshold = OPTIMAL_THRESHOLDS.get(name, config.DEFAULT_THRESHOLD)
        models[name] = {
            "trained": trained,
            "calibrated": calibration is not None,
            "threshold": round(threshold, 4),
            "metrics": metrics.get(name),
        }

    return jsonify({
        "status": "running",
        "metrics_generated_at": generated_at,
        "models": models,
    })


@app.route("/", methods=["GET"])
def health():
    return jsonify({
        "status": "AI model service running",
        "active_datasets": config.ACTIVE_DATASETS,
        "calibrated": {name: get_calibration(name) is not None for name in config.ACTIVE_DATASETS},
    })


if __name__ == "__main__":
    app.run(port=8000, debug=True)