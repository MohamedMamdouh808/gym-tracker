# 🏋️ GymTracker Pro — Elite AI Fitness System

GymTracker Pro is a premium, high-performance fitness ecosystem designed for serious athletes. It combines ultra-fast AI coaching with precision data tracking, all wrapped in a sleek, customizable "Stone & Gold" glassmorphic interface.

## ✨ Pro Features

- **🚀 Ultra-Fast AI Coach**: Powered by **Groq (Llama 3.3 70B)** for near-instant personalized training and nutrition advice. (Fallback to Gemini 1.5 Pro).
- **📅 Date-Aware Meal Tracking**: Full historical tracking. Log and view meals for any date, with dynamic macro charts and water intake integration.
- **🎨 Multi-Theme Engine**: Choose your aesthetic—**Stone & Gold**, **Deep Ocean**, or **Midnight Purple**. Themes persist across sessions.
- **🔥 Gamified Progress**: Track your training streaks, earn achievements (Hydrated, PR King, Macro Pro), and visualize consistency with activity heatmaps.
- **📊 Advanced Analytics**: Interactive Chart.js visualizations for weight trends, caloric history, and macronutrient distribution.
- **🏋️ Training Utilities**: Built-in 1RM (One-Rep Max) calculator and integrated rest timers within workout logs.
- **🔒 Enterprise Security**: Fully secure authentication and data persistence powered by **Supabase**.
- **📱 Responsive Command Center**: A unified dashboard providing a "Today's Fuel" summary and recent activity at a glance.

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Chart.js 4, Supabase Auth UI |
| **Backend** | Node.js (Express), Serverless Functions (Vercel) |
| **Database** | Supabase (PostgreSQL) |
| **AI Engine** | Groq (Llama 3.3) & Google Gemini 1.5 Pro |
| **Styling** | Vanilla CSS, Glassmorphism, Multi-Theme Engine |
| **Fonts** | Bebas Neue (Display) & DM Sans (Body) |

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Supabase Account (with Google/GitHub OAuth enabled for Social Login)
- Groq API Key (Primary AI)
- Google AI (Gemini) API Key (Backup AI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MohamedMamdouh808/gym-tracker.git
   cd gym-tracker
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in `/backend`:
   ```env
   PORT=5000
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file in `/frontend`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:5000/api
   ```

### Running Locally

- **Start Backend**: `cd backend && npm run dev`
- **Start Frontend**: `cd frontend && npm run dev`

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | Aggregated Pro data including streaks and achievements |
| `GET` | `/api/weight` | Weight history with trend analysis |
| `GET` | `/api/meals` | Date-filtered meal history |
| `POST` | `/api/meals` | Log meal with automatic macro rounding |
| `GET` | `/api/water` | Daily hydration tracking |
| `POST` | `/api/ai/coach` | Ultra-fast Groq-powered coaching session |
| `GET` | `/api/prs` | Personal Records management |

## ☁️ Deployment

The project is optimized for **Vercel**.

1. **Backend**: Deploy the `backend/` folder. Ensure all environment variables (Groq/Supabase) are set in the Vercel dashboard.
2. **Frontend**: Deploy the `frontend/` folder.
3. **Environment**: Update `VITE_API_URL` to point to your live backend.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - **Build your legacy.**