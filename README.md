# 🏀 NBA Performance Predictor

AI-powered NBA player performance prediction using LSTM neural networks. Get next-game scoring predictions with confidence bands, form analysis, and head-to-head comparisons.

## 🚀 Quick Start

### Local Development

#### 1. Backend Setup (5 minutes)

```powershell
# Windows PowerShell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

```bash
# Mac/Linux
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Verify**: Open http://localhost:8000 → Should see `{"status":"NBA prediction backend running"}`

#### 2. Frontend Setup (3 minutes)

```bash
# New terminal window
cd nba-frontend
npm install
npm start
```

**Verify**: Browser opens to http://localhost:3000 → Console shows `API BASE URL = http://localhost:8000`

### Test the App

1. Select a player from dropdown
2. Click "Predict"
3. See prediction, charts, and insights!

---

## 📁 Project Structure

```
NBA-performance-predictor/
├── backend/                    # FastAPI backend
│   ├── main.py                # Main API application
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment config (local)
│   ├── .env.example          # Environment template
│   ├── start.sh              # Render deployment script
│   ├── models/               # LSTM model files
│   └── README.md             # Backend documentation
│
├── nba-frontend/              # React frontend
│   ├── src/                  # Source code
│   ├── public/               # Static files
│   ├── package.json          # Node dependencies
│   ├── .env                  # Environment config (local)
│   ├── .env.example         # Environment template
│   └── README.md            # Frontend documentation
│
├── DEPLOYMENT_GUIDE.md       # Production deployment guide
└── README.md                 # This file
```

---

## 🌐 Production Deployment

### Backend (Render)

1. **Create Web Service** on https://render.com
2. **Connect your GitHub repo**
3. **Configure**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `bash start.sh`
4. **Add Environment Variable**:
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
5. **Deploy!**

### Frontend (Vercel)

1. **Import project** on https://vercel.com
2. **Select `nba-frontend` directory**
3. **Add Environment Variable**:
   ```
   REACT_APP_API_BASE_URL=https://your-backend.onrender.com
   ```
4. **Deploy!**

**See `DEPLOYMENT_GUIDE.md` for detailed instructions.**

---

## 🔧 Environment Variables

### Backend (`.env`)
```bash
# Production only - leave empty for local dev
FRONTEND_URL=

# Optional - for AI insights
GEMINI_API_KEY=
```

### Frontend (`.env`)
```bash
# Local development
REACT_APP_API_BASE_URL=http://localhost:8000

# Production (set in Vercel)
# REACT_APP_API_BASE_URL=https://your-backend.onrender.com
```

---

## ✨ Features

### Predictions
- AI-powered scoring predictions using LSTM
- Confidence bands showing prediction range
- Recent form adjustments
- Model accuracy metrics

### Analytics
- Interactive charts (points, minutes, shooting %)
- 5-game performance trends
- Player form analysis
- Team context and metadata

### Comparisons
- Head-to-head player comparisons
- Side-by-side prediction analysis
- Performance differential insights

### Data
- 200+ NBA players
- Real-time NBA standings
- Historical game data
- Team metadata and logos

---

## 🛠️ Tech Stack

**Backend**
- FastAPI - Web framework
- TensorFlow/Keras - LSTM model
- NBA API - Live NBA data
- pandas/numpy - Data processing

**Frontend**
- React - UI framework
- Recharts - Interactive charts
- React Router - Navigation
- Create React App - Build tooling

---

## 🐛 Troubleshooting

### Backend won't start

**Issue**: `uvicorn: command not found`

**Fix**: Activate virtual environment first
```powershell
# Windows
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload
```

### Frontend shows "API BASE URL = undefined"

**Fix**: Check `.env` file exists in `nba-frontend/` with:
```
REACT_APP_API_BASE_URL=http://localhost:8000
```
Then restart `npm start`

### CORS errors in browser

**Fix**: Make sure backend is running on port 8000. Backend already allows localhost origins.

### Player dropdown empty

**Fix**:
1. Check backend is running: http://localhost:8000
2. Check browser console for errors (F12)
3. Verify `.env` files are configured correctly

---

## 📚 Documentation

- **Backend**: See `backend/README.md`
- **Frontend**: See `nba-frontend/README.md`
- **Deployment**: See `DEPLOYMENT_GUIDE.md`

---

## 🎯 API Endpoints

- `GET /` - Health check
- `GET /players` - List all players
- `GET /player/{id}/recent-games` - Last 5 games
- `POST /predict/player/{id}` - Get prediction
- `GET /standings` - NBA standings

**Full API docs**: http://localhost:8000/docs (when backend running)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

---

## 📄 License

This project is for educational purposes.

---

## 🙏 Acknowledgments

- NBA API for player data
- TensorFlow for ML framework
- Recharts for visualizations
- Create React App for React tooling

---

**Built by Devan Aswani** | [LinkedIn](https://www.linkedin.com/in/devang-aswani-847535300/) | [GitHub](https://github.com/D-art9)

---

## 🏃‍♂️ Quick Commands

```bash
# Backend (Windows PowerShell)
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload

# Frontend
cd nba-frontend
npm start

# Build for production
npm run build
```

**Need help?** Check the README files in `backend/` and `nba-frontend/` directories!
