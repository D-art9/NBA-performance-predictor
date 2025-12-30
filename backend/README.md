# NBA Performance Predictor - Backend

FastAPI-based prediction API using LSTM neural network for NBA player performance prediction.

## 🚀 Quick Start (Local Development)

### Prerequisites

- Python 3.9+ (you have Python 3.13.1 ✅)
- pip

### Setup & Run

#### Windows (PowerShell)

```powershell
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment (recommended)
python -m venv venv

# 3. Activate virtual environment
.\venv\Scripts\Activate.ps1
# If you get execution policy error, run:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 4. Install dependencies
pip install -r requirements.txt

# 5. Copy environment file (already done for you!)
# cp .env.example .env

# 6. Run the server
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

#### Mac/Linux (Bash)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment (recommended)
python3 -m venv venv

# 3. Activate virtual environment
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Copy environment file
cp .env.example .env

# 6. Run the server
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Verify It's Working

1. Open your browser to: http://localhost:8000
2. You should see: `{"status":"NBA prediction backend running"}`
3. Test players endpoint: http://localhost:8000/players

---

## 📁 Project Structure

```
backend/
├── main.py                 # Main FastAPI application
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── .env                   # Your local environment variables (git ignored)
├── start.sh               # Render deployment script (ignore for local dev)
├── models/
│   ├── lstm_points_model.h5    # Trained LSTM model
│   └── minmax_scaler.pkl       # Feature scaler
├── routers/               # API route handlers
├── services/              # Business logic
├── utils/                 # Helper functions
└── raw_nba_dataset.csv    # Training dataset
```

---

## 🔧 Environment Variables

The `.env` file should contain:

```bash
# Leave empty for local development
FRONTEND_URL=

# Optional: For AI insights
GEMINI_API_KEY=
```

**For local development**, you don't need to set `FRONTEND_URL`. The CORS is already configured for localhost.

---

## 🌐 API Endpoints

### Core Endpoints

- `GET /` - Health check
- `GET /players` - List all players
- `GET /standings` - Current NBA standings
- `GET /player/{player_id}/recent-games` - Get last 5 games
- `POST /predict/player/{player_id}` - Get prediction for player
- `POST /insights/player/{player_id}` - Get AI insights (requires Gemini API key)

### Example Request

```bash
# Get prediction for player ID 203507 (Giannis Antetokounmpo)
curl -X POST http://localhost:8000/predict/player/203507
```

---

## 🐛 Troubleshooting

### Issue: `uvicorn: command not found`

**Solution**: Make sure virtual environment is activated and dependencies installed

```powershell
# Windows
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Then run with python -m
python -m uvicorn main:app --reload
```

### Issue: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**: Install dependencies

```powershell
pip install -r requirements.txt
```

### Issue: `FileNotFoundError: models/lstm_points_model.h5`

**Solution**: Make sure model files exist in the `models/` directory. They should be committed in the repo.

### Issue: Port 8000 already in use

**Solution**: Use a different port

```powershell
python -m uvicorn main:app --reload --port 8001
```

**Don't forget to update frontend `.env` file**:
```
REACT_APP_API_BASE_URL=http://localhost:8001
```

---

## 📦 Dependencies

See `requirements.txt`:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `nba_api` - NBA stats API wrapper
- `pandas` - Data manipulation
- `numpy` - Numerical operations
- `tensorflow-cpu` - Machine learning (LSTM model)
- `joblib` - Model serialization
- `scikit-learn` - Data preprocessing

---

## 🚀 Production Deployment (Render)

For deployment to Render, use these settings:

**Build Command**:
```bash
pip install -r requirements.txt
```

**Start Command**:
```bash
bash start.sh
```

**Environment Variables** (set in Render dashboard):
```
FRONTEND_URL=https://nba-performance-predictor.vercel.app
```

The `start.sh` script handles the `PORT` variable automatically provided by Render.

---

## 🧪 Testing

```bash
# Run with reload for development
python -m uvicorn main:app --reload

# Test health endpoint
curl http://localhost:8000

# Test players endpoint
curl http://localhost:8000/players

# Test prediction
curl -X POST http://localhost:8000/predict/player/203507
```

---

## 📚 Additional Documentation

- **Deployment Guide**: `../DEPLOYMENT_GUIDE.md`
- **Quick Fix Guide**: `../QUICK_FIX_GUIDE.md`
- **Deployment Checklist**: `../DEPLOYMENT_CHECKLIST.md`

---

## ⚙️ How It Works

1. **Load Model**: Loads pre-trained LSTM model and scaler on startup
2. **Load Data**: Loads historical NBA dataset for player lookup
3. **API Request**: Receives player ID via API
4. **Feature Engineering**: Computes rolling averages, trends, etc.
5. **Prediction**: Feeds features to LSTM model
6. **Blending**: Combines model prediction with recent form
7. **Response**: Returns prediction with confidence bands and insights

---

## 🤝 Contributing

When making changes:

1. Keep environment variables in `.env` (not committed)
2. Update `.env.example` if adding new variables
3. Test locally before deploying
4. Follow existing code structure

---

**Need help?** Check the troubleshooting section above or the main project documentation!
