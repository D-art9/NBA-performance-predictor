# NBA Performance Predictor - Frontend

React-based web application for NBA player performance prediction with interactive charts and analytics.

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 16+ and npm
- Backend server running on port 8000 (see `../backend/README.md`)

### Setup & Run

#### Windows (PowerShell) or Mac/Linux

```bash
# 1. Navigate to frontend directory
cd nba-frontend

# 2. Install dependencies (first time only)
npm install

# 3. Copy environment file (already done for you!)
# cp .env.example .env

# 4. Verify .env file contains:
# REACT_APP_API_BASE_URL=http://localhost:8000

# 5. Start the development server
npm start
```

The app will automatically open at http://localhost:3000

### Verify It's Working

1. Browser should open automatically to http://localhost:3000
2. Open console (F12) - should see: `API BASE URL = http://localhost:8000`
3. Player dropdown should populate with names
4. Select a player and click "Predict" - should show prediction

---

## 📁 Project Structure

```
nba-frontend/
├── public/
│   ├── index.html          # HTML template
│   └── ...                 # Static assets
├── src/
│   ├── App.js              # Main dashboard component
│   ├── Home.jsx            # Landing page
│   ├── About.jsx           # About page
│   ├── Results.jsx         # Results page
│   ├── DataFlow.jsx        # Data flow visualization
│   ├── index.js            # App entry point
│   ├── index.css           # Global styles
│   └── data/
│       └── team_map.js     # Team metadata
├── package.json            # Dependencies & scripts
├── .env.example           # Environment template
└── .env                   # Your local config (git ignored)
```

---

## 🔧 Environment Variables

The `.env` file should contain:

```bash
# For local development (backend running on port 8000)
REACT_APP_API_BASE_URL=http://localhost:8000

# For production (deployed backend)
# REACT_APP_API_BASE_URL=https://nba-performance-predictor.onrender.com
```

**Important**:
- Variable MUST start with `REACT_APP_` (Create React App requirement)
- Changes to `.env` require restarting `npm start`
- Never commit `.env` file (already in `.gitignore`)

---

## 🎯 Available Scripts

### `npm start`

Runs the app in development mode.
- Opens http://localhost:3000
- Hot-reloads on file changes
- Shows lint errors in console

### `npm run build`

Builds the app for production to the `build/` folder.
- Optimizes for best performance
- Minifies code
- Creates production-ready bundle

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run eject`

⚠️ **One-way operation!** Ejects from Create React App.
- Exposes all configuration files
- You'll be responsible for maintaining config
- Generally not recommended unless you need full control

---

## 🐛 Troubleshooting

### Issue: `API BASE URL = undefined` in console

**Solution**: Environment variable not loaded

```bash
# 1. Check .env file exists
ls .env  # or dir .env on Windows

# 2. Verify it contains
cat .env  # or type .env on Windows
# Should show: REACT_APP_API_BASE_URL=http://localhost:8000

# 3. Restart the dev server
# Stop with Ctrl+C, then:
npm start
```

### Issue: Player dropdown is empty

**Solution**: Backend not running or wrong URL

```bash
# 1. Check backend is running
# Open http://localhost:8000 in browser
# Should see: {"status":"NBA prediction backend running"}

# 2. Check .env has correct URL
cat .env
# Should be: REACT_APP_API_BASE_URL=http://localhost:8000

# 3. Check browser console for errors (F12)
```

### Issue: CORS errors in console

**Solution**: Backend CORS not configured for localhost

```bash
# Backend main.py already includes localhost origins, so this shouldn't happen
# If it does, check backend is actually running on port 8000
```

### Issue: `npm install` fails

**Solution**: Clear cache and retry

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json  # or manual delete on Windows

# Reinstall
npm install
```

### Issue: Port 3000 already in use

**Solution**: Use a different port

```bash
# Windows PowerShell
$env:PORT=3001; npm start

# Mac/Linux
PORT=3001 npm start
```

---

## 🌐 Features

1. **Player Selection & Prediction**
   - Dropdown with 200+ NBA players
   - AI-powered scoring predictions
   - Confidence bands and accuracy metrics

2. **Interactive Charts**
   - Points trend over last 5 games
   - Minutes played breakdown
   - Shooting consistency (rolling average)

3. **Head-to-Head Comparison**
   - Compare two players side-by-side
   - See predicted performance difference

4. **Performance Insights**
   - Recent form analysis
   - Team context
   - Trend indicators

5. **Responsive Design**
   - Works on desktop and mobile
   - Modern UI with animations
   - Dark theme optimized for readability

---

## 🚀 Production Deployment (Vercel)

### Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd nba-frontend
vercel

# Follow prompts, then set environment variable in Vercel dashboard
```

### Deploy via Vercel Dashboard

1. Connect GitHub repo to Vercel
2. Select `nba-frontend` as root directory
3. Set environment variable:
   ```
   REACT_APP_API_BASE_URL=https://nba-performance-predictor.onrender.com
   ```
4. Deploy!

### Build Settings (Vercel)

- **Framework Preset**: Create React App
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

---

## 📦 Dependencies

See `package.json`:
- `react` & `react-dom` - UI framework
- `react-router-dom` - Navigation
- `recharts` - Interactive charts
- `react-scripts` - Build tooling

---

## 🎨 Customization

### Changing Colors

Edit color values in `src/App.js`:
```javascript
const styles = {
  page: { background: "..." },
  // etc.
}
```

### Adding New Pages

1. Create new component in `src/YourPage.jsx`
2. Add route in `src/index.js`:
```javascript
<Route path="/your-page" element={<YourPage />} />
```

### Modifying API Calls

All API calls are in `src/App.js`. Look for `fetch()` calls:
- Line 144: Fetch players
- Line 188: Fetch recent games
- Line 244: Fetch predictions

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

---

## 🔗 API Integration

The frontend expects these backend endpoints:

- `GET /players` - List of players
- `GET /player/:id/recent-games` - Last 5 games
- `POST /predict/player/:id` - Prediction data
- `GET /standings` - League standings

All requests include proper error handling and loading states.

---

## 📚 Additional Documentation

- **Backend Setup**: `../backend/README.md`
- **Deployment Guide**: `../DEPLOYMENT_GUIDE.md`
- **Quick Fix**: `../QUICK_FIX_GUIDE.md`
- **Full Checklist**: `../DEPLOYMENT_CHECKLIST.md`

---

## 🏃‍♂️ Quick Command Reference

```bash
# First time setup
cd nba-frontend
npm install
cp .env.example .env
# (Edit .env if needed)
npm start

# Daily development
npm start              # Start dev server
# (Make changes, see them live)
Ctrl+C                # Stop server

# Before deployment
npm run build         # Test production build
npm test              # Run tests
```

---

## 🤝 Contributing

When making changes:

1. Keep `.env` file local (never commit)
2. Update `.env.example` if adding new variables
3. Test locally before deploying
4. Use meaningful commit messages
5. Keep components modular and reusable

---

## 💡 Tips

- **Fast Refresh**: Changes auto-reload, no need to manually refresh browser
- **Console Warnings**: Fix them to avoid issues in production
- **Performance**: Use React DevTools to identify slow components
- **Debugging**: Browser DevTools (F12) are your friend
- **State Management**: All state is in App.js, consider React Context for larger apps

---

**Need help?** Check the troubleshooting section or the main project documentation!
