# SecurePayX

**AI-powered fraud detection for digital payments.** SecurePayX scores every simulated transaction in real time with machine-learning models, classifies it as low / medium / high risk, and triggers the right response — approve, warn, or step-up verification — while giving users and admins a full analytics dashboard.

> Academic / hackathon project. No real payments are processed and no real financial data is collected.

---

## 🌍 Sustainable Development Goals

| SDG | Target | How SecurePayX contributes |
|-----|--------|----------------------------|
| **SDG 16 – Peace, Justice and Strong Institutions** | **16.4** – significantly reduce illicit financial flows | Flags suspicious transactions *before* they settle, with explainable risk scores and an auditable alert trail. |
| **SDG 9 – Industry, Innovation and Infrastructure** | **9.5** – enhance technological capabilities | Applies calibrated gradient-boosted models across three payment channels as reusable, API-driven fraud infrastructure. |
| **SDG 8 – Decent Work and Economic Growth** *(supporting)* | **8.10** – expand access to financial services | Trustworthy fraud prevention is a prerequisite for safely extending digital payments to more people. |

---

## Features

- **Real-time risk scoring** across three channels: credit/debit card, mobile wallet/UPI (PaySim) and banking (BankSim)
- **Risk tiers** (low / medium / high) with tuned decision thresholds and probability calibration
- **Analytics dashboard**: KPIs, risk donut, channel breakdown, detection trend, time-of-day fraud chart
- **Fraud alerts** with in-app notification bell and live toasts
- **Human-in-the-loop feedback**: users mark predictions as correct / not fraud
- **Transactions & alerts** pages with search, date/amount filters and CSV export
- **Reports** with PDF export
- **Batch upload** of transaction files for bulk scoring
- **Admin area** with role-based access and an audit log
- **Security**: hashed passwords with a password policy, JWT sessions with expiry handling, rate limiting
- **Chat assistant** widget inside the dashboard

---

## Architecture

```
┌────────────┐   REST + JWT   ┌──────────────────┐   HTTP    ┌────────────────────┐
│  Frontend  │ ─────────────► │  Backend (Node)  │ ────────► │  AI model (Flask)  │
│ React/Vite │ ◄───────────── │ Express/MongoDB  │ ◄──────── │ XGBoost, 3 models  │
└────────────┘                └──────────────────┘           └────────────────────┘
   :5173                           :5000                           :8000
```

The browser never talks to the model service directly — the backend authenticates the user, calls the AI service, and stores the result.

## Tech stack

| Layer | Stack |
|-------|-------|
| Frontend | React, Vite, React Router, Tailwind CSS |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT, multer, rate limiting |
| AI model | Python, Flask, XGBoost, scikit-learn, pandas |

## Repository structure

```
SecurePayX/
├── frontend/
│   └── src/
│       ├── components/      # NotificationBell, TimeOfDayChart, RiskGauge, filters, export, chat widget, admin UI
│       ├── pages/           # Home, Login, Register, Dashboard, Transactions, FraudAlerts,
│       │                    # Reports, Feedback, UploadTransaction, CheckTransaction, Profile, admin/
│       ├── App.jsx
│       └── main.jsx
├── backend/
│   ├── config/db.js
│   ├── controllers/         # admin, chat, dashboard, fraud, transaction, upload
│   ├── middleware/          # auth, admin, rateLimiters
│   ├── models/              # User, Transaction, Feedback, AuditLog
│   ├── routes/              # auth, transactions, dashboard, alerts, feedback, fraud, upload, chat, admin
│   ├── utils/passwordPolicy.js
│   ├── seedAdmin.js
│   └── server.js
└── ai-model/
    ├── api/app.py           # Flask prediction API
    ├── data/                # raw + processed datasets (creditcard, paysim, banksim)
    ├── models/              # trained model + scaler artifacts
    ├── outputs/             # evaluation reports
    ├── src/                 # preprocessing, resampling, training, calibration, threshold tuning, evaluation
    ├── main.py              # full training pipeline
    └── requirements.txt
```

---

## Getting started

### Prerequisites
Node.js 18+, Python 3.10+, and a running MongoDB instance.

### 1. AI model service

```bash
cd ai-model
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python main.py                 # preprocess → train → evaluate (first run only)
python api/app.py              # serves on http://localhost:8000
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env           # then fill in values
node seedAdmin.js              # optional: create an admin account
npm run dev                    # serves on http://localhost:5000
```

Typical `.env` values: `PORT`, `MONGO_URI`, `JWT_SECRET`, `AI_MODEL_URL=http://localhost:8000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

Start the services in this order: **AI model → backend → frontend**.

---

## How a transaction is scored

1. User submits a transaction (single check or batch upload).
2. Backend validates the JWT, applies rate limits, and forwards the payload to the AI service.
3. The AI service builds the feature row, scales it, and returns a fraud probability from the channel's model.
4. The probability is compared with that channel's tuned threshold and mapped to **LOW / MEDIUM / HIGH**.
5. The result is stored, alerts are raised for flagged transactions, and the dashboard updates.

## Model notes

- One XGBoost model + scaler per payment channel, with per-channel decision thresholds.
- Class imbalance handled in `resampling.py`; probabilities calibrated in `calibration.py`.
- Re-run `threshold_tuning.py` (and update the thresholds in `api/app.py` / `src/predict.py`) after any retrain.

---

## Disclaimer

SecurePayX is an educational simulation built to demonstrate applied machine learning for financial security. It is not a production fraud-prevention system.
