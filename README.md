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
  <img src="https://img.shields.io/badge/Firebase-DD2C00?style=flat-square&logo=firebase&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/AI_Agents-8B5CF6?style=flat-square&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/Hackathon-APL_2026-ec4899?style=flat-square&logo=hackthebox&logoColor=white" />
</p>

<p align="center">
  <a href="#-problem-statement">Problem</a> •
  <a href="#-solution-overview">Solution</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-ai-agent-workflow">AI Agents</a> •
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-database-design">Database</a> •
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

### The Gap We're Solving

```mermaid
graph LR
    subgraph BEFORE["❌ Current Experience"]
        B1[Search WhatsApp Groups] --> B2[Call 5+ Venues]
        B2 --> B3[Check Availability Manually]
        B3 --> B4[Negotiate Pricing]
        B4 --> B5[Hope for Confirmation]
    end

    subgraph AFTER["✅ With PlaySphere"]
        A1["'Book badminton 7 PM Gomti Nagar'"] --> A2["AI Parses → Searches → Books"]
        A2 --> A3["✅ Confirmed in Seconds"]
    end

    BEFORE -.->|"PlaySphere Replaces"| AFTER

    style BEFORE fill:#1a0000,stroke:#ef4444,color:#fca5a5
    style AFTER fill:#001a0e,stroke:#10b981,color:#6ee7b7
```

---

## 💡 Solution Overview

**PlaySphere** is a full-stack, AI-powered sports venue discovery and booking platform that combines:

| Capability | Description |
| :--- | :--- |
| 🤖 **AI Sports Copilot** | A conversational agentic AI that parses natural language queries, searches venues, compares prices, and books courts autonomously |
| 🗺️ **Interactive Geo Map** | Real-time dark-themed Leaflet map with venue markers, area density overlays, and one-click booking popups |
| ⚡ **Real-Time Booking Engine** | Live slot availability with Socket.IO push updates, conflict detection, and instant confirmation |
| 📈 **Smart Pricing Agent** | Demand-aware dynamic pricing suggestions: peak hour surcharges, rainy day discounts, last-minute offers |
| 📊 **Venue Owner Dashboard** | Business intelligence portal with SVG revenue charts, donut sport breakdowns, AI booking share metrics, sparkline trends, and customer reviews |
| 🔐 **Role-Based Access** | JWT-secured authentication with three roles: Player, Venue Owner, and Platform Admin |

### 🏆 What Makes PlaySphere Unique

```
User says: "Book badminton tomorrow 7 PM near Gomti Nagar under ₹500"

PlaySphere AI Copilot:
  ├── 🔍 Parses intent → Sport: badminton, Date: tomorrow, Time: 19:00, Area: Gomti Nagar, Budget: ₹500
  ├── 🏟️ Queries database with geospatial + sport + price filters
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
    subgraph Client["🖥️ Frontend — React 18 + Vite"]
        UI[Premium Glassmorphism UI]
        MAP[Leaflet Dark Map Engine]
        CHAT[AI Chat Widget]
        BOOK[Booking Interface]
        DASH[SVG Analytics Dashboard]
    end
    
    subgraph Server["⚙️ Backend — Express + Socket.IO"]
        API[REST API Gateway]
        AUTH[JWT Auth Middleware]
        RT[Real-Time Engine]
        ADAPT[Mongoose-Compatible Adapter]
    end
    
    subgraph Agents["🤖 AI Agent Layer"]
        NLP[NLP Intent Parser]
        REC[Recommendation Agent]
        PRICE[Dynamic Pricing Agent]
        DEMAND[Demand Prediction Agent]
    end
    
    subgraph Data["🗄️ Data Layer — Firebase / Local JSON"]
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

### Request Lifecycle — End-to-End Data Flow

```mermaid
flowchart LR
    A["🏃 User Action"] --> B["🌐 React Frontend"]
    B -->|Axios HTTP| C["⚙️ Express Router"]
    C --> D{"🔐 JWT Auth?"}
    D -->|Valid| E["📋 Route Handler"]
    D -->|Invalid| F["❌ 401 Unauthorized"]
    E --> G["🗄️ Database Adapter"]
    G -->|Firebase Set?| H["☁️ Firestore"]
    G -->|No Credentials| I["📁 localDb.json"]
    H --> J["📨 Response"]
    I --> J
    J -->|JSON| B
    E -->|Booking Created?| K["⚡ Socket.IO Emit"]
    K -->|Real-Time Push| B

    style A fill:#0d2137,stroke:#06b6d4,color:#67e8f9
    style H fill:#1a1040,stroke:#8b5cf6,color:#c4b5fd
    style I fill:#0a1628,stroke:#10b981,color:#6ee7b7
    style K fill:#1a0d28,stroke:#ec4899,color:#f9a8d4
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
    participant DB as 🗄️ Database
    participant Notify as ⚡ Socket.IO

    Player->>Chat: "Book badminton tomorrow 7 PM near Gomti Nagar"
    Chat->>NLP: POST /api/ai/chat

    rect rgb(15, 23, 42)
        Note over NLP: 🤖 AI Agent Processing Pipeline
        NLP->>NLP: Extract entities (sport, date, time, location, budget)
        NLP->>Search: Build geospatial + filter query
        Search->>DB: Find venues matching sport, area, price
        DB-->>Search: Return matched venues (sorted by rating)
        Search->>Search: Apply budget filter & rank results
    end

    alt ✅ Slot Available
        Search->>Book: Top venue selected, create booking
        Book->>DB: Create booking with status "confirmed"
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

### NLP Intent Parsing Pipeline

```mermaid
flowchart TD
    INPUT["💬 User Message"] --> LOWER["🔡 Normalize & Lowercase"]
    LOWER --> S{"🏅 Sport\nDetected?"}
    S -->|Yes| SPORT["football / badminton / cricket..."]
    S -->|No| DEFAULT["Use user preferences"]
    
    LOWER --> L{"📍 Location\nDetected?"}
    L -->|Yes| LOC["Extract area name"]
    L -->|No| GEOLOC["Use GPS coordinates"]
    
    LOWER --> T{"🕐 Time\nDetected?"}
    T -->|Yes| TIME["Parse hour → HH:00"]
    T -->|No| NEXTSLOT["Find next available"]
    
    LOWER --> D{"📅 Date\nDetected?"}
    D -->|Yes| DATE["today / tomorrow / specific date"]
    D -->|No| TODAY["Default: today"]
    
    LOWER --> B{"💰 Budget\nDetected?"}
    B -->|Yes| BUDGET["Extract max price"]
    B -->|No| NOBUDGET["No price filter"]
    
    SPORT --> INTENT["🎯 Structured Intent"]
    DEFAULT --> INTENT
    LOC --> INTENT
    GEOLOC --> INTENT
    TIME --> INTENT
    NEXTSLOT --> INTENT
    DATE --> INTENT
    TODAY --> INTENT
    BUDGET --> INTENT
    NOBUDGET --> INTENT
    
    INTENT --> CLASSIFY{"🤖 Intent\nClassification"}
    CLASSIFY -->|book / find| SEARCH["🔍 Search + Book"]
    CLASSIFY -->|recommend| RECOMMEND["⭐ Recommendations"]
    CLASSIFY -->|demand / trends| ANALYTICS["📊 Demand Insights"]
    CLASSIFY -->|schedule| SCHEDULE["📅 My Bookings"]
    CLASSIFY -->|help / greeting| HELP["💡 Help Response"]

    style INPUT fill:#0d2137,stroke:#06b6d4,color:#67e8f9
    style INTENT fill:#1a1040,stroke:#8b5cf6,color:#c4b5fd
    style CLASSIFY fill:#0a1628,stroke:#f59e0b,color:#fcd34d
```

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
| 💡 **AI Recommendations** | Personalized venue suggestions based on preferred sports and play history |
| 🏷️ **Price Comparison** | View and compare prices across multiple venues at a glance |

### 🏢 For Venue Owners

| Feature | Description |
| :--- | :--- |
| 📊 **Analytics Dashboard** | SVG-rendered revenue bar charts, donut sport breakdown, sparkline trends, and KPI stat cards |
| 💰 **AI Dynamic Pricing** | Automated pricing recommendations for peak hours, weekends, rainy days, and last-minute slots |
| 📈 **Demand Prediction** | Trending sports, peak hours analysis, and day-wise demand forecasting |
| 👥 **Customer Management** | View all bookings, user details, and booking sources (manual vs AI-booked) |
| 🧠 **AI Insights Panel** | Actionable business intelligence — weekend surge alerts, off-peak opportunity tips, adoption metrics |
| 📉 **Revenue Breakdown** | Month-over-month comparison tables with per-booking averages and share percentages |
| 🏆 **Sport Performance** | Ranked sport leaderboard with booking counts, revenue, and progress bars |
| 🔄 **Real-Time Updates** | Live booking feed with instant status changes and source tracking |

### 🛡️ Platform Features

| Feature | Description |
| :--- | :--- |
| 🔐 **JWT Authentication** | Secure token-based auth with role-based access control (Player / Owner / Admin) |
| ⚡ **Real-Time Updates** | Socket.IO powered live booking notifications and slot status changes |
| 🌍 **Geospatial Queries** | Haversine distance calculation for proximity-based venue search |
| 🎨 **Premium Dark UI** | Glassmorphism design with 12+ custom animations, gradient accents, and responsive layouts |
| 📱 **Mobile Responsive** | Fully responsive across desktop, tablet, and mobile devices |
| 🦶 **Professional Footer** | Multi-column footer with brand info, sport tags, platform links, social icons, and feature badges |
| 🔥 **Firebase-Ready** | Firestore integration with graceful local JSON fallback for zero-dependency demos |
| 📊 **Inline SVG Charts** | Zero-dependency bar charts, donut charts, and sparkline trends rendered as pure SVG |

---

## 🗄️ Database Design

### Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ BOOKING : "creates"
    USER ||--o{ REVIEW : "writes"
    USER ||--o{ VENUE : "owns"
    VENUE ||--o{ BOOKING : "hosts"
    VENUE ||--o{ REVIEW : "receives"
    VENUE }|--|| SPORT_CONFIG : "offers"

    USER {
        string _id PK
        string username UK
        string email UK
        string password
        string role "user | venue_owner | admin"
        string phone
        object location "GeoJSON Point"
        array preferredSports
        string skillLevel
    }

    VENUE {
        string _id PK
        string name
        string description
        string address
        string area
        string city
        object location "GeoJSON Point"
        array sports "SportConfig[]"
        array amenities
        ref owner FK "→ User"
        float rating "0–5"
        int totalReviews
        object operatingHours
        boolean isActive
    }

    BOOKING {
        string _id PK
        ref user FK "→ User"
        ref venue FK "→ Venue"
        string sport
        int court
        date date
        string startTime
        string endTime
        float totalPrice
        string status "pending | confirmed | cancelled | completed"
        string paymentStatus
        boolean isAgentBooked
    }

    REVIEW {
        string _id PK
        ref user FK "→ User"
        ref venue FK "→ Venue"
        int rating "1–5"
        string comment
    }

    SPORT_CONFIG {
        string name
        int courts
        float pricePerHour
        int maxPlayers
    }
```

### Database Adapter Architecture

PlaySphere uses a **Mongoose-compatible adapter** (`mongooseMock.js`) that provides a unified interface for both **Firebase Firestore** and a **local JSON database**:

```mermaid
flowchart TB
    subgraph Models["📦 Mongoose-Style Models"]
        U[User.js]
        V[Venue.js]
        B[Booking.js]
        R[Review.js]
    end

    subgraph Adapter["🔄 Database Adapter — mongooseMock.js"]
        SCHEMA["Schema Definition<br/>fields, hooks, methods, statics"]
        QE["Query Engine<br/>find, findOne, aggregate, populate"]
        FILTER["In-Memory Filter<br/>$regex, $gte, $lte, $in, $or, $near, $text"]
        HOOKS["Lifecycle Hooks<br/>pre/post save, deleteOne"]
    end

    subgraph Storage["💾 Storage Backend"]
        FB["☁️ Firebase Firestore<br/>(if credentials provided)"]
        LJ["📁 localDb.json<br/>(zero-dependency fallback)"]
    end

    Models -->|"require('./mongooseMock')"| Adapter
    Adapter -->|"FIREBASE_PROJECT_ID set?"| FB
    Adapter -->|"No credentials"| LJ

    style Adapter fill:#1a1040,stroke:#8b5cf6,color:#c4b5fd
    style FB fill:#1a0d00,stroke:#f59e0b,color:#fcd34d
    style LJ fill:#001a0e,stroke:#10b981,color:#6ee7b7
```

**Supported Query Operators:**

| Operator | Description | Example |
| :--- | :--- | :--- |
| `$regex` | Pattern matching with flags | `{ area: { $regex: 'gomti', $options: 'i' } }` |
| `$gte` / `$lte` | Range comparisons | `{ rating: { $gte: 4.0 } }` |
| `$in` | Match any value in array | `{ status: { $in: ['confirmed', 'completed'] } }` |
| `$or` | Logical OR across conditions | `{ $or: [{ area: /gomti/i }, { name: /gomti/i }] }` |
| `$near` | Geospatial proximity (Haversine) | `{ location: { $near: { $geometry: { coordinates: [80.9, 26.8] } } } }` |
| `$text` | Full-text search across fields | `{ $text: { $search: 'badminton court' } }` |
| `$sum` / `$avg` | Aggregation operators | `{ $group: { _id: '$sport', total: { $sum: '$totalPrice' } } }` |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Component-based SPA with hot module replacement |
| **Routing** | React Router DOM v6 | Client-side navigation with protected routes |
| **Maps** | Leaflet + React Leaflet | Interactive dark-themed map with CartoDB tiles |
| **Charts** | Inline SVG | Zero-dependency bar charts, donut charts, sparkline trends |
| **Icons** | Lucide React | Premium icon library (350+ icons) |
| **HTTP Client** | Axios | API communication with interceptors |
| **Styling** | Vanilla CSS | Custom design system with CSS variables, glassmorphism, animations |
| **Backend** | Node.js + Express | RESTful API server with middleware architecture |
| **Database** | Firebase Firestore / Local JSON | Cloud-native document storage with local fallback |
| **DB Adapter** | Custom Mongoose Mock | Mongoose-compatible API for seamless model usage |
| **Auth** | JWT + bcryptjs | Stateless authentication with password hashing |
| **Real-Time** | Socket.IO | Bidirectional WebSocket communication |
| **AI Engine** | Custom NLP Parser | Rule-based intent extraction for sports queries |

### Tech Stack Visualization

```mermaid
graph TB
    subgraph FE["🎨 Frontend Stack"]
        REACT["⚛️ React 18"]
        VITE["⚡ Vite"]
        LEAFLET["🗺️ Leaflet Maps"]
        SVG["📊 SVG Charts"]
        CSS["🎨 Glassmorphism CSS"]
        LUCIDE["✨ Lucide Icons"]
        AXIOS["📡 Axios"]
    end

    subgraph BE["⚙️ Backend Stack"]
        NODE["💚 Node.js"]
        EXPRESS["🚂 Express"]
        SOCKETIO["⚡ Socket.IO"]
        JWT["🔐 JWT"]
        BCRYPT["🔒 bcryptjs"]
    end

    subgraph DB["🗄️ Data Stack"]
        FIREBASE["🔥 Firebase Firestore"]
        LOCALJSON["📁 Local JSON"]
        ADAPTER["🔄 Mongoose Adapter"]
    end

    subgraph AI["🤖 AI Stack"]
        NLP_["🧠 NLP Parser"]
        PRICING_["💰 Pricing Agent"]
        DEMAND_["📊 Demand Agent"]
        REC_["⭐ Rec Agent"]
    end

    FE <-->|REST API| BE
    BE <-->|Read/Write| DB
    BE --> AI
    BE <-->|WebSocket| FE

    style FE fill:#0d2137,stroke:#06b6d4,color:#67e8f9
    style BE fill:#0a1628,stroke:#10b981,color:#6ee7b7
    style DB fill:#1a0d00,stroke:#f59e0b,color:#fcd34d
    style AI fill:#1a1040,stroke:#8b5cf6,color:#c4b5fd
```

---

## 📂 Project Structure

```
PlaySphere/
│
├── backend/                          # ⚙️ Express API Server
│   ├── config/
│   │   ├── db.js                     # Database connection initializer
│   │   └── mongooseMock.js           # 🔥 Mongoose→Firebase/JSON adapter (800+ lines)
│   ├── middleware/
│   │   └── authMiddleware.js         # JWT verification + role authorization
│   ├── models/
│   │   ├── User.js                   # User schema (bcrypt hashing, roles, preferences)
│   │   ├── Venue.js                  # Venue schema (GeoJSON, sports config, amenities)
│   │   ├── Booking.js                # Booking schema (conflict detection, pricing)
│   │   └── Review.js                 # Review schema (star ratings, auto avg calculation)
│   ├── routes/
│   │   ├── authRoutes.js             # Register, Login, Profile endpoints
│   │   ├── venueRoutes.js            # CRUD + geospatial search + slot availability
│   │   ├── bookingRoutes.js          # Create, list, cancel bookings
│   │   ├── aiRoutes.js               # 🤖 AI Copilot chat + recommendations + pricing
│   │   └── analyticsRoutes.js        # Dashboard stats, heatmap data, platform metrics
│   ├── seed/
│   │   └── seedData.js               # 15 Lucknow venues, 5 users, 30 bookings, reviews
│   ├── localDb.json                  # 📁 Auto-generated local database (fallback)
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
│   │   │   ├── Footer.jsx            # 🦶 Multi-column footer with social & feature badges
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
│   │   │   ├── Dashboard.jsx         # 📊 Enhanced: SVG charts, donut, sparklines, AI insights
│   │   │   └── Auth.jsx              # Login/Register with role selection + demo buttons
│   │   ├── App.jsx                   # Route definitions + AuthContext + Footer
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

### API Request Flow

```mermaid
sequenceDiagram
    participant C as 🖥️ Client
    participant A as 🔐 Auth Middleware
    participant R as 📋 Router
    participant D as 🗄️ Database
    participant S as ⚡ Socket.IO

    C->>R: POST /api/bookings
    R->>A: Verify JWT Token
    A-->>R: ✅ User Authenticated
    R->>D: Check slot availability
    D-->>R: Slot is free
    R->>D: Create booking document
    D-->>R: Booking saved
    R->>S: Emit 'booking:new'
    S-->>C: Real-time notification
    R-->>C: 201 { success: true, booking }
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v18+) — [Download](https://nodejs.org/)
- **Firebase** (optional) — [Firebase Console](https://console.firebase.google.com/)
  - The app works **without Firebase** using a local JSON database fallback

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

Edit `.env` with your configuration:

```env
PORT=5000
JWT_SECRET=your_secure_secret_key
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173

# Firebase Configuration (leave blank to use local JSON database)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

> 💡 **No Firebase?** That's fine! Leave the Firebase fields blank and PlaySphere will use `localDb.json` automatically.

### Step 3: Install & Seed Backend

```bash
npm install
npm run seed        # Seeds 15 Lucknow venues, 5 users, 30 bookings, reviews
npm run dev         # Starts Express server on port 5000
```

Expected seed output:
```
⚠️  Firebase credentials not provided. Falling back to local JSON Database
✨ PlaySphere Database Adapter Loaded (Firebase Firestore / Local Fallback Active)
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

### Venue Coverage Map

```mermaid
graph TD
    subgraph LUCKNOW["🗺️ Lucknow — 15 Venues Across 15 Areas"]
        GN["Gomti Nagar<br/>🏸🏓💪"]
        HG["Hazratganj<br/>🏏"]
        IN["Indira Nagar<br/>⚽🏐"]
        AL["Aliganj<br/>🏊"]
        CH["Chinhat<br/>🎾🏸"]
        JK["Jankipuram<br/>🏋️🏀"]
        MH["Mahanagar<br/>🏸🏓🏐"]
        RJ["Rajajipuram<br/>🏏"]
        EL["Eldeco<br/>🏸"]
        VN["Vikas Nagar<br/>⚽🏀"]
        SH["Sahara<br/>🏏⚽💪🎾"]
        KP["Kapoorthala<br/>💪🏓🏸"]
        AA["Aashiana<br/>🏊🏋️"]
        AM["Aminabad<br/>🏀"]
        CT["Cantt<br/>🏏⚽"]
    end

    style LUCKNOW fill:#0d2137,stroke:#06b6d4,color:#67e8f9
```

---

## 📊 Dashboard Features

The **Owner Dashboard** provides comprehensive business intelligence through interactive visualizations:

```mermaid
graph LR
    subgraph Dashboard["📊 Dashboard Components"]
        KPI["📈 KPI Cards<br/>6 metrics with sparklines"]
        BAR["📊 SVG Bar Chart<br/>Monthly revenue trend"]
        DONUT["🍩 Donut Chart<br/>Sport distribution"]
        TABLE["📋 Booking Table<br/>Recent activity feed"]
        AI_INS["🤖 AI Insights<br/>Actionable recommendations"]
        PRICING["💰 Pricing Matrix<br/>Peak/off-peak/weekend"]
    end

    KPI --> BAR
    KPI --> DONUT
    BAR --> TABLE
    DONUT --> AI_INS
    AI_INS --> PRICING

    style Dashboard fill:#1a1040,stroke:#8b5cf6,color:#c4b5fd
```

| Component | Description |
| :--- | :--- |
| **KPI Stat Cards** | My Arenas, Total Revenue (with sparkline), Total Bookings, AI Booked %, Avg Rating, Today's Bookings |
| **SVG Bar Chart** | Gradient bars with grid lines, value labels, month labels, booking counts — zero external dependencies |
| **Donut Chart** | Sport-wise booking distribution with colored segments, glow filters, legend with counts and percentages |
| **Tab Navigation** | Overview / Revenue / Sports / AI Pricing — organized content sections |
| **AI Insights** | Weekend surge alerts, peak hour warnings, off-peak opportunities, AI adoption gap tracking |
| **Revenue Breakdown** | Monthly table with per-booking averages, revenue share bars, MoM growth indicators |
| **Booking Feed** | Recent bookings with user info, venue, sport badge, date/time, status, amount, and AI/Manual source badge |

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

## 👨‍💻 Team — PlaySphere

<table>
  <tr>
    <td align="center" width="250">
      <a href="https://github.com/suryanshsingh07">
        <img src="https://img.shields.io/badge/suryanshsingh07-181717?style=for-the-badge&logo=github&logoColor=white" />
      </a>
      <br />
      <strong>Suryansh Singh</strong>
      <br />
      <sub>🏆 Team Leader · Full-Stack · Architecture</sub>
      <br />
      <sub>Project vision, system design, AI agent pipeline, database architecture, and integration lead</sub>
    </td>
    <td align="center" width="250">
      <a href="https://github.com/shivam5802">
        <img src="https://img.shields.io/badge/shivam5802-181717?style=for-the-badge&logo=github&logoColor=white" />
      </a>
      <br />
      <strong>Shivam Jaiswal</strong>
      <br />
      <sub>⚙️ Backend Developer</sub>
      <br />
      <sub>Express API routes, JWT auth middleware, Socket.IO real-time engine, booking conflict logic</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="250">
      <a href="https://github.com/suyashverma0">
        <img src="https://img.shields.io/badge/suyashverma0-181717?style=for-the-badge&logo=github&logoColor=white" />
      </a>
      <br />
      <strong>Suyash Verma</strong>
      <br />
      <sub>🎨 Frontend Developer</sub>
      <br />
      <sub>React UI components, glassmorphism design system, Leaflet map integration, responsive layouts</sub>
    </td>
    <td align="center" width="250">
      <a href="https://github.com/devvikax">
        <img src="https://img.shields.io/badge/devvikax-181717?style=for-the-badge&logo=github&logoColor=white" />
      </a>
      <br />
      <strong>Vikas Patel</strong>
      <br />
      <sub>🤖 AI/ML Engineer</sub>
      <br />
      <sub>NLP intent parser, recommendation agent, dynamic pricing engine, demand prediction algorithms</sub>
    </td>
  </tr>
</table>

### Team Workflow

```mermaid
graph LR
    subgraph Team["👨‍💻 PlaySphere Team"]
        SS["🏆 Suryansh Singh<br/>Team Lead · Architecture"]
        SJ["⚙️ Shivam Jaiswal<br/>Backend"]
        SV["🎨 Suyash Verma<br/>Frontend"]
        VP["🤖 Vikas Patel<br/>AI/ML"]
    end

    SS -->|"System Design"| SJ
    SS -->|"UI/UX Direction"| SV
    SS -->|"AI Pipeline"| VP
    SJ -->|"REST APIs"| SV
    VP -->|"Agent Routes"| SJ

    style SS fill:#0d2137,stroke:#06b6d4,color:#67e8f9
    style SJ fill:#001a0e,stroke:#10b981,color:#6ee7b7
    style SV fill:#1a1040,stroke:#8b5cf6,color:#c4b5fd
    style VP fill:#1a0d00,stroke:#f59e0b,color:#fcd34d
```

---

## 🌐 Deployment Guide

### Frontend — Vercel / Netlify

The React frontend can be deployed to **Vercel** or **Netlify** with SPA routing support:

```bash
cd frontend
npm run build          # Produces dist/ folder
```

**Vercel**: Connect your GitHub repo → Set root directory to `frontend` → Framework: Vite → Deploy.

**Netlify**: Connect your GitHub repo → Set build directory to `frontend/dist` → Build command: `cd frontend && npm run build`.

> ⚠️ Set the environment variable `VITE_API_URL` to your Render backend URL (e.g. `https://playsphere-api.onrender.com`).

### Backend — Render

Deploy the Express API server to **Render**:

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Set **Root Directory** to `backend`
4. Set **Build Command** to `npm install`
5. Set **Start Command** to `node server.js`
6. Add Environment Variables:

```env
PORT=5000
JWT_SECRET=your_secure_secret_key
JWT_EXPIRE=30d
CLIENT_URL=https://your-frontend-url.vercel.app
FIREBASE_PROJECT_ID=        # Optional
FIREBASE_CLIENT_EMAIL=      # Optional
FIREBASE_PRIVATE_KEY=       # Optional
```

### Deployment Architecture

```mermaid
graph TB
    subgraph Production["🌐 Production Deployment"]
        subgraph FE_HOST["Frontend Host"]
            VERCEL["▲ Vercel / Netlify<br/>React + Vite SPA"]
        end
        
        subgraph BE_HOST["Backend Host"]
            RENDER["🚀 Render<br/>Express + Socket.IO"]
        end
        
        subgraph DB_HOST["Database"]
            FIRE["🔥 Firebase Firestore<br/>Cloud NoSQL"]
            LOCAL["📁 localDb.json<br/>Dev Fallback"]
        end
    end
    
    VERCEL -->|"HTTPS API Calls"| RENDER
    VERCEL -->|"WebSocket"| RENDER
    RENDER -->|"Firebase Admin SDK"| FIRE
    RENDER -.->|"If no credentials"| LOCAL

    style VERCEL fill:#0d2137,stroke:#06b6d4,color:#67e8f9
    style RENDER fill:#001a0e,stroke:#10b981,color:#6ee7b7
    style FIRE fill:#1a0d00,stroke:#f59e0b,color:#fcd34d
    style LOCAL fill:#1a1040,stroke:#8b5cf6,color:#c4b5fd
```

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
  <img src="https://img.shields.io/badge/Built_for-Agentic_Premier_League-06b6d4?style=for-the-badge&labelColor=0a0e1a" />
  <img src="https://img.shields.io/badge/Hackathon-2026-ec4899?style=for-the-badge&labelColor=0a0e1a" />
  <img src="https://img.shields.io/badge/Made_with-❤️_in_India-f59e0b?style=for-the-badge&labelColor=0a0e1a" />
</p>

<p align="center">
  <strong>🏟️ PlaySphere — Where AI Meets the Arena</strong>
</p>

<p align="center">
  <sub>
    Built with ❤️ by <strong>Team PlaySphere</strong> for the <strong>Agentic Premier League Hackathon 2026</strong><br/>
    <a href="https://github.com/suryanshsingh07">Suryansh Singh</a> · <a href="https://github.com/shivam5802">Shivam Jaiswal</a> · <a href="https://github.com/suyashverma0">Suyash Verma</a> · <a href="https://github.com/devvikax">Vikas Patel</a><br/><br/>
    React 18 · Node.js · Firebase · Socket.IO · Custom AI Agents · SVG Charts · Glassmorphism UI
  </sub>
</p>

<p align="center">
  <sub>
    ⭐ Star this repo if you find it useful! ⭐
  </sub>
</p>
