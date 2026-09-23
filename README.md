# Photon — Real-Time WebSocket Stock Dashboard

Photon is a sleek, live-updating stock trading dashboard. It features real-time price streaming over WebSockets, dynamic candlestick charts, and a responsive interface built for speed.

## Features

- **Real-Time Data**: Integrates with the [Finnhub API](https://finnhub.io/) to stream live market trades via WebSockets (with a built-in mock data fallback for offline testing).
- **Interactive Charts**: Embeds [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) to visualize historical and live candlestick data instantly.
- **Dynamic UI**: 
  - Ticker cards flash green (uptick) or red (downtick) in real-time.
  - A modern, responsive CSS Grid layout with dark-mode styling.
  - Live search functionality to find and subscribe to new tickers.
- **Dual Frontends**: Includes both a lightweight Vanilla JS frontend and a fully-featured React implementation.

---

## Project Structure

```text
photon/
├── backend/
│   ├── main.py            # FastAPI WebSocket server & Finnhub integration
│   ├── requirements.txt
│   └── .env               # API Keys
├── react-frontend/        # Modern React UI (Vite)
│   ├── src/
│   │   ├── components/    # TickerGrid, TradingView, Header, etc.
│   │   ├── hooks/         # Custom useWebSocket hook
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── frontend/              # Lightweight Vanilla JS fallback
    ├── index.html
    ├── style.css
    └── app.js
```

## Getting Started

### 1. Set up the Backend (FastAPI)

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
```
*Note: The backend runs on `http://localhost:8000`. By default, it uses mock data. To use live data, create a `.env` file in the `backend` folder with `DATA_SOURCE=finnhub` and `FINNHUB_API_KEY=your_key`.*

### 2. Run the React Frontend (Recommended)

Open a new terminal window:
```bash
cd react-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*The React app will be available at `http://localhost:5173/`.*

### 3. Or use the Vanilla JS Frontend
If you prefer not to use Node.js, simply open `frontend/index.html` in your browser or run a simple local server:
```bash
cd frontend
python3 -m http.server 8081
```
*Available at `http://localhost:8081/`.*
