<p align="center">
  <img src="https://img.shields.io/badge/PlaySphere-AI%20Sports%20Copilot-06b6d4?style=for-the-badge&labelColor=0a0e1a&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJMMyAyMGgxOEwxMiAyeiIgZmlsbD0iIzA2YjZkNCIvPjwvc3ZnPg==" alt="PlaySphere Badge" />
</p>

<h1 align="center">🏟️ PlaySphere</h1>
<h3 align="center">Agentic AI Sports Infrastructure Discovery & Booking Platform</h3>

<p align="center">
  <strong>Your Intelligent Sports Copilot — Find, Compare & Book Courts Using Natural Language</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/AI_Agents-8B5CF6?style=flat-square&logo=openai&logoColor=white" />
</p>

<p align="center">
  <a href="#-problem-statement">Problem</a> •
  <a href="#-solution-overview">Solution</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-ai-agent-workflow">AI Agents</a> •
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-api-documentation">API Docs</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-demo-credentials">Demo</a>
</p>

---

## 🎯 Problem Statement

Organizing a game of football, badminton, or cricket is a **fragmented, frustrating experience**:

- 🔍 Players manually search across multiple platforms and messaging groups for available venues
- 📞 Coordination requires endless calls to venue managers to verify open slots
- 💰 No transparent pricing — players can't easily compare rates or find budget-friendly options
- 🗺️ No unified geographic search — discovering nearby facilities requires trial and error
- 📊 Venue owners lack data-driven tools to optimize pricing, track demand, or manage bookings efficiently

> **The sports infrastructure discovery and booking pipeline is broken — it needs an intelligent, agentic solution.**

---

## 💡 Solution Overview

**PlaySphere** is a full-stack, AI-powered sports venue discovery and booking platform that combines:

| Capability | Description |
| :--- | :--- |
| 🤖 **AI Sports Copilot** | A conversational agentic AI that parses natural language queries, searches venues, compares prices, and books courts autonomously |
| 🗺️ **Interactive Geo Map** | Real-time dark-themed Leaflet map with venue markers, area density overlays, and one-click booking popups |
| ⚡ **Real-Time Booking Engine** | Live slot availability with Socket.IO push updates, conflict detection, and instant confirmation |
| 📈 **Smart Pricing Agent** | Demand-aware dynamic pricing suggestions: peak hour surcharges, rainy day discounts, last-minute offers |
| 📊 **Venue Owner Dashboard** | Business intelligence portal with revenue charts, sport-wise analytics, AI booking share metrics, and customer reviews |
| 🔐 **Role-Based Access** | JWT-secured authentication with three roles: Player, Venue Owner, and Platform Admin |

### 🏆 What Makes PlaySphere Unique

```
User says: "Book badminton tomorrow 7 PM near Gomti Nagar under ₹500"

PlaySphere AI Copilot:
  ├── 🔍 Parses intent → Sport: badminton, Date: tomorrow, Time: 19:00, Area: Gomti Nagar, Budget: ₹500
  ├── 🏟️ Queries MongoDB with geospatial + sport + price filters
  ├── ⚡ Checks real-time slot availability across matching venues
  ├── ✅ Books the best available court automatically
  └── 📱 Returns confirmation with venue details, price, and time

Result: TRUE AGENTIC AI — from natural language to confirmed booking in one step
```

---

## 📐 Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph Client["🖥️ Frontend (React + Vite)"]
        UI[Premium Glassmorphism UI]
        MAP[Leaflet Dark Map Engine]
        CHAT[AI Chat Widget]
        BOOK[Booking Interface]
    end
    
    subgraph Server["⚙️ Backend (Express + Socket.IO)"]
        API[REST API Gateway]
        AUTH[JWT Auth Middleware]
        RT[Real-Time Engine]
    end
    
    subgraph Agents["🤖 AI Agent Layer"]
        NLP[NLP Intent Parser]
        REC[Recommendation Agent]
        PRICE[Dynamic Pricing Agent]
        DEMAND[Demand Prediction Agent]
    end
    
    subgraph Data["🗄️ Data Layer (MongoDB)"]
        USERS[(Users Collection)]
        VENUES[(Venues + GeoJSON Index)]
        BOOKINGS[(Bookings Collection)]
        REVIEWS[(Reviews Collection)]
    end
    
    Client -->|HTTP/WS| Server
    Server -->|Query/Mutate| Data
    Server -->|Invoke| Agents
    Agents -->|Read/Write| Data
    RT -->|Push Updates| Client
```

---

## 🤖 AI Agent Workflow

### Agentic Copilot — End-to-End Flow

```mermaid
sequenceDiagram
    actor Player as 🏃 Athlete
    participant Chat as 💬 Chat Widget
    participant NLP as 🧠 NLP Intent Parser
    participant Search as 🔍 Venue Search Agent
    participant Book as 📅 Booking Agent
    participant DB as 🗄️ MongoDB
    participant Notify as ⚡ Socket.IO

    Player->>Chat: "Book badminton tomorrow 7 PM near Gomti Nagar"
    Chat->>NLP: POST /api/ai/chat

    rect rgb(15, 23, 42)
        Note over NLP: 🤖 AI Agent Processing Pipeline
        NLP->>NLP: Extract entities (sport, date, time, location, budget)
        NLP->>Search: Build geospatial + filter query
        Search->>DB: db.venues.find({ sports.name: "badminton", area: /gomti nagar/i })
        DB-->>Search: Return matched venues (sorted by rating)
        Search->>Search: Apply budget filter & rank results
    end

    alt ✅ Slot Available
        Search->>Book: Top venue selected, create booking
        Book->>DB: db.bookings.create({ status: "confirmed" })
        DB-->>Book: Booking confirmed
        Book->>Notify: Emit "booking:new" event
        Notify-->>Player: Real-time confirmation
        Book-->>Chat: "✅ Booked at Gomti Nagar Sports Arena, 7:00 PM, ₹400"
    else ❌ No Slots
        Search-->>Chat: Return alternative venues with available times
        Chat-->>Player: Render inline venue suggestion cards
    end
```

### Multi-Agent System Architecture

```mermaid
graph LR
    subgraph Agents["🤖 PlaySphere AI Agents"]
        A1[🔍 Discovery Agent<br/>Venue search & filtering]
        A2[📅 Booking Agent<br/>Slot reservation & conflicts]
        A3[💰 Pricing Agent<br/>Dynamic pricing optimization]
        A4[⭐ Recommendation Agent<br/>Personalized suggestions]
        A5[📊 Demand Agent<br/>Trend prediction & analytics]
    end
    
    A1 --> A2
    A1 --> A4
    A3 --> A2
    A5 --> A3
    A5 --> A4
```

| Agent | Role | Input | Output |
| :--- | :--- | :--- | :--- |
| **Discovery Agent** | Searches venues by sport, location, price, and amenities | User query + filters | Ranked venue list |
| **Booking Agent** | Handles slot availability, conflict detection, and reservation | Venue + time + user | Confirmed booking |
| **Pricing Agent** | Generates peak/off-peak/weekend pricing recommendations | Venue bookings data | Pricing matrix |
| **Recommendation Agent** | Scores venues based on user preferences and play history | User profile + venues | Scored recommendations |
| **Demand Agent** | Predicts trending sports, peak hours, and busiest days | Aggregate booking data | Demand insights |

---

## ✨ Features

### 🏃 For Athletes (Players)

| Feature | Description |
| :--- | :--- |
| 🤖 **AI Sports Copilot** | Natural language chat to find and book venues — *"Find football turf for 8 players under ₹1200 near Chinhat"* |
| 🗺️ **Live Venue Map** | Dark-themed interactive Leaflet map with custom markers, area popups, and venue density visualization |
| 🔍 **Smart Filters** | Filter by sport, area, rating, price range, and sort by popularity or distance |
| 📅 **Instant Slot Booking** | Interactive time grid showing real-time availability with one-click reservation |
| ⭐ **Venue Reviews** | Rate and review venues with star ratings and written feedback |
| 📋 **Booking History** | Track upcoming games and past reservations with cancel/refund support |

### 🏢 For Venue Owners

| Feature | Description |
| :--- | :--- |
| 📊 **Analytics Dashboard** | Revenue charts, booking stats, sport-wise breakdown, and AI booking share metrics |
| 💰 **AI Dynamic Pricing** | Automated pricing recommendations for peak hours, weekends, rainy days, and last-minute slots |
| 📈 **Demand Prediction** | Trending sports, peak hours analysis, and day-wise demand forecasting |
| 👥 **Customer Management** | View all bookings, user details, and booking sources (manual vs AI-booked) |

### 🛡️ Platform Features

| Feature | Description |
| :--- | :--- |
| 🔐 **JWT Authentication** | Secure token-based auth with role-based access control (Player / Owner / Admin) |
| ⚡ **Real-Time Updates** | Socket.IO powered live booking notifications and slot status changes |
| 🌍 **GeoJSON Queries** | MongoDB 2dsphere indexes for proximity-based venue search (`$near` operator) |
| 🎨 **Premium Dark UI** | Glassmorphism design with 12+ custom animations, gradient accents, and responsive layouts |
| 📱 **Mobile Responsive** | Fully responsive across desktop, tablet, and mobile devices |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Component-based SPA with hot module replacement |
| **Routing** | React Router DOM v6 | Client-side navigation with protected routes |
| **Maps** | Leaflet + React Leaflet | Interactive dark-themed map with CartoDB tiles |
| **Icons** | Lucide React | Premium icon library (350+ icons) |
| **HTTP Client** | Axios | API communication with interceptors |
| **Styling** | Vanilla CSS | Custom design system with CSS variables, glassmorphism, animations |
| **Backend** | Node.js + Express | RESTful API server with middleware architecture |
| **Database** | MongoDB + Mongoose | Document-based storage with GeoJSON and text indexes |
| **Auth** | JWT + bcryptjs | Stateless authentication with password hashing |
| **Real-Time** | Socket.IO | Bidirectional WebSocket communication |
| **AI Engine** | Custom NLP Parser | Rule-based intent extraction for sports queries |

---

## 📂 Project Structure

```
PlaySphere/
│
├── backend/                          # ⚙️ Express API Server
│   ├── config/
│   │   └── db.js                     # MongoDB connection with graceful fallback
│   ├── middleware/
│   │   └── authMiddleware.js         # JWT verification + role authorization
│   ├── models/
│   │   ├── User.js                   # User schema (bcrypt hashing, roles, preferences)
│   │   ├── Venue.js                  # Venue schema (GeoJSON, sports config, amenities)
│   │   ├── Booking.js                # Booking schema (conflict detection, pricing)
│   │   └── Review.js                 # Review schema (star ratings, comments)
│   ├── routes/
│   │   ├── authRoutes.js             # Register, Login, Profile endpoints
│   │   ├── venueRoutes.js            # CRUD + geospatial search + slot availability
│   │   ├── bookingRoutes.js          # Create, list, cancel bookings
│   │   ├── aiRoutes.js               # 🤖 AI Copilot chat + recommendations + pricing
│   │   └── analyticsRoutes.js        # Dashboard stats, heatmap data, platform metrics
│   ├── seed/
│   │   └── seedData.js               # 15 Lucknow venues, 5 users, 30 bookings, reviews
│   ├── server.js                     # App bootstrap, Socket.IO, middleware, error handling
│   ├── .env.example                  # Environment variable template
│   └── package.json
│
├── frontend/                         # 🖥️ React + Vite Client
│   ├── public/
│   │   └── favicon.svg               # PlaySphere gradient favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Glassmorphism header with mobile drawer
│   │   │   ├── MapView.jsx           # Leaflet dark map with custom DivIcon markers
│   │   │   ├── VenueCard.jsx         # Glass card with sports tags, ratings, pricing
│   │   │   ├── BookingModal.jsx      # Slot grid picker, date selector, price calculator
│   │   │   ├── AIChatbot.jsx         # 🤖 Floating AI chat with suggestion prompts
│   │   │   ├── StatsCard.jsx         # Animated counter with gradient values
│   │   │   └── FeatureCard.jsx       # Feature showcase with hover glow effects
│   │   ├── pages/
│   │   │   ├── Home.jsx              # Hero section, stats, features, CTA
│   │   │   ├── Explore.jsx           # Split layout: filters + map + venue grid
│   │   │   ├── VenueDetail.jsx       # Sport tabs, amenities, reviews, mini-map
│   │   │   ├── Bookings.jsx          # Upcoming/past tabs with cancel actions
│   │   │   ├── Dashboard.jsx         # Revenue charts, AI pricing, booking table
│   │   │   └── Auth.jsx              # Login/Register with role selection
│   │   ├── App.jsx                   # Route definitions + AuthContext provider
│   │   ├── index.css                 # 🎨 Complete design system (600+ lines)
│   │   └── main.jsx                  # React root with BrowserRouter
│   ├── index.html                    # SEO tags, Google Fonts, Leaflet CSS
│   ├── vite.config.js                # API proxy to backend
│   └── package.json
│
├── .gitignore
└── README.md                         # 📖 This file
```

---

## 📋 API Documentation

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | Create new account (Player or Venue Owner) |
| `POST` | `/login` | Public | Authenticate and receive JWT token |
| `GET` | `/me` | Private | Get current user profile |

### 🏟️ Venues (`/api/venues`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | List venues with filters (`sport`, `area`, `minPrice`, `maxPrice`, `minRating`, `sort`) |
| `GET` | `/nearby?lat=&lng=&radius=` | Public | Geospatial proximity search |
| `GET` | `/:id` | Public | Venue detail with reviews |
| `GET` | `/:id/slots?date=&sport=` | Public | Available time slots for a specific date |
| `POST` | `/` | Owner | Create new venue |
| `PUT` | `/:id` | Owner | Update venue details |
| `POST` | `/:id/reviews` | Private | Submit star rating and comment |

### 📅 Bookings (`/api/bookings`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Private | Reserve a court slot (conflict detection included) |
| `GET` | `/my` | Private | Get user's booking history |
| `PUT` | `/:id/cancel` | Private | Cancel booking and trigger refund |
| `GET` | `/venue/:venueId` | Owner | View bookings for owned venue |

### 🤖 AI Agents (`/api/ai`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/chat` | Private | **AI Sports Copilot** — natural language venue search + booking |
| `GET` | `/recommendations` | Private | Personalized venue suggestions based on user preferences |
| `GET` | `/demand-prediction` | Public | Trending sports, peak hours, busiest days |
| `GET` | `/dynamic-pricing/:venueId` | Owner | AI pricing matrix (peak, off-peak, weekend, rainy day) |

### 📊 Analytics (`/api/analytics`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard` | Owner | Revenue, bookings, ratings, AI booking share, monthly trends |
| `GET` | `/heatmap` | Public | Venue coordinates with crowd density for map overlay |
| `GET` | `/stats` | Public | Platform-wide aggregate statistics |

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v18+) — [Download](https://nodejs.org/)
- **MongoDB** (v6+) — [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/PlaySphere.git
cd PlaySphere
```

### Step 2: Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your MongoDB connection string:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/playsphere    # Local MongoDB
# MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/playsphere   # Atlas
JWT_SECRET=your_secure_secret_key
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
```

### Step 3: Install & Seed Backend

```bash
npm install
npm run seed        # Seeds 15 Lucknow venues, 5 users, 30 bookings, reviews
npm run dev         # Starts Express server on port 5000
```

Expected seed output:
```
✅ MongoDB Connected: localhost
🌱 Starting PlaySphere database seed...
🗑️  Cleared existing data
✅ Created 5 users
✅ Created 15 venues in Lucknow
✅ Created 12 reviews
✅ Created 30 sample bookings

═══════════════════════════════════════════
🎉 PlaySphere seed complete!

📋 Demo Credentials:
   Admin:       admin@playsphere.in       / admin123
   Venue Owner: rahul@playsphere.in       / password123
   Player:      arjun@playsphere.in       / password123
═══════════════════════════════════════════
```

### Step 4: Install & Run Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev         # Starts Vite dev server on port 5173
```

### Step 5: Open in Browser

Navigate to **[http://localhost:5173](http://localhost:5173)** 🚀

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| 🏃 **Player** | `arjun@playsphere.in` | `password123` | Explore, Book, AI Chat, Reviews |
| 🏢 **Venue Owner** | `rahul@playsphere.in` | `password123` | Dashboard, Analytics, Pricing |
| 🛡️ **Admin** | `admin@playsphere.in` | `admin123` | Full platform access |

---

## 🗺️ Seeded Venues (Lucknow)

The database ships with **15 premium sports venues** across Lucknow:

| # | Venue | Area | Sports | Rating |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Gomti Nagar Sports Arena | Gomti Nagar | Badminton, Table Tennis, Squash | ⭐ 4.7 |
| 2 | Hazratganj Cricket Ground | Hazratganj | Cricket | ⭐ 4.5 |
| 3 | Indira Nagar Football Hub | Indira Nagar | Football, Volleyball | ⭐ 4.8 |
| 4 | Aliganj Aquatic Centre | Aliganj | Swimming | ⭐ 4.6 |
| 5 | Chinhat Tennis Club | Chinhat | Tennis, Badminton | ⭐ 4.4 |
| 6 | Jankipuram Fitness Hub | Jankipuram | Gym, Basketball | ⭐ 4.3 |
| 7 | Mahanagar Multi-Sports | Mahanagar | Badminton, TT, Volleyball | ⭐ 4.5 |
| 8 | Rajajipuram Cricket Academy | Rajajipuram | Cricket | ⭐ 4.6 |
| 9 | Eldeco Badminton Academy | Eldeco | Badminton | ⭐ 4.9 |
| 10 | Vikas Nagar Arena | Vikas Nagar | Football, Basketball | ⭐ 4.2 |
| 11 | Sahara Sports Village | Sahara | Cricket, Football, Squash, Tennis | ⭐ 4.7 |
| 12 | Kapoorthala Racket Club | Kapoorthala | Squash, TT, Badminton | ⭐ 4.4 |
| 13 | Aashiana Swimming & Wellness | Aashiana | Swimming, Gym | ⭐ 4.5 |
| 14 | Aminabad Basketball Court | Aminabad | Basketball | ⭐ 4.1 |
| 15 | Cantt Sports Ground | Cantt | Cricket, Football | ⭐ 4.6 |

---

## 🔮 Future Scope

| Feature | Description |
| :--- | :--- |
| 📱 **React Native App** | Cross-platform mobile app with push notifications |
| 💳 **Razorpay Payments** | Integrated payment gateway with auto-refunds |
| 🤖 **LLM Integration** | OpenAI/Gemini-powered natural language understanding |
| 👥 **AI Matchmaking** | Find nearby players for team sports |
| 🏆 **Tournament Engine** | Auto-generate brackets, fixtures, and leaderboards |
| 📊 **Advanced Analytics** | Predictive demand modeling with ML pipelines |
| 💬 **WhatsApp Bot** | Book venues via WhatsApp conversational interface |
| 🔊 **Voice Assistant** | Speech-to-text venue search and booking |
| 🌦️ **Weather Integration** | Auto-apply rainy day discounts using live weather APIs |
| 📍 **Multi-City Expansion** | Scale beyond Lucknow to Delhi, Bangalore, Mumbai |

---

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/ai-matchmaking`)
3. Commit changes (`git commit -m 'Add AI matchmaking agent'`)
4. Push to the branch (`git push origin feature/ai-matchmaking`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<p align="center">
  <strong>Built with ❤️ for the Agentic Premier League Hackathon</strong><br/>
  <sub>PlaySphere — Where AI Meets the Arena 🏟️</sub>
</p>
