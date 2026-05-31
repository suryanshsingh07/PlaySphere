# PlaySphere AI - Technical Documentation

## 📋 Project Overview

PlaySphere AI is a premium sports venue discovery and booking platform for Lucknow built with **Next.js 16**, **React 19**, **Firebase Firestore**, and **Groq LLM** integration. This document provides technical specifications and development guidelines.

---

## 🏗️ Architecture Overview

### Frontend Stack
- **Framework**: Next.js 16 (App Router with Turbopack)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Maps**: Google Maps JS API
- **Icons**: Lucide React

### Backend Infrastructure
- **Database**: Firebase Firestore (Real-time document store)
- **Authentication**: Firebase Auth (Email + Google Sign-in)
- **API Routes**: Next.js API Routes (Serverless)
- **LLM Integration**: Groq API (Llama 3 model)

### Security & Validation
- **Rules Engine**: Firestore Security Rules (.rules file)
- **Access Control**: Role-based (player, owner, admin)
- **Type Safety**: Full TypeScript coverage

---

## 📦 Project Structure

```
playsphere-ai/
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # React components
│   │   └── contexts/         # Context providers
│   ├── public/               # Static assets
│   └── package.json
│
├── backend/
│   ├── ai/
│   │   └── concierge.ts      # LLM grounding & intent extraction
│   └── firebase/
│       └── index.ts          # Firestore operations
│
├── shared/
│   ├── types/                # Shared TypeScript types
│   ├── constants/            # Sports configs & neighborhoods
│   └── helpers/              # Utility functions
│
├── scratch/                  # Testing & scripts
├── docs/                     # Technical specifications
├── firestore.rules           # Security rules
├── next.config.js            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
├── .env.local.example        # Environment template
└── package.json              # Root dependencies
```

---

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- NPM 9+
- Firebase Project (Firestore + Auth)
- Groq API Key

### Installation

```bash
# 1. Clone & navigate
git clone <repo>
cd playsphere-ai

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Firebase & Groq credentials

# 4. Start development server
npm run dev

# 5. Open browser
open http://localhost:3000
```

### Environment Configuration

Create `.env.local` in project root:

```env
# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx

# Admin Emails (comma-separated)
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com

# Groq LLM (Backend)
LLM_API_KEY=xxx
LLM_API_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama3-8b-8192
```

---

## 🤖 AI Integration

### Grounded LLM Architecture

The AI Concierge implements a **retrieval-augmented generation (RAG)** pattern to prevent hallucinations:

```
User Query → Intent Extraction → Venue Ranking → LLM Grounding → Response
     ↓              ↓                ↓                ↓
Badminton      Sport + Area    Proximity Boost    Facts Prompt
Aliganj           Budget         Distance Calc     (Only Real Venues)
₹500/hr                                           → Llama 3 → JSON + Text
```

### Key Components

**1. Intent Extraction** (`backend/ai/concierge.ts`)
- Parses sport, area, budget, time from natural language
- Extracts discovery/booking/guidance intent type
- Supports patterns like "morning", "tomorrow", "₹500"

**2. Proximity Ranking**
- Calculates Haversine distance to user location
- Applies proximity boost to venue scores
- Ranks top 5 matches by combined score

**3. Facts Grounding**
- Constructs strict factual prompt from database venues
- Prevents LLM from inventing non-existent options
- Includes price, rating, distance in context

**4. Booking Prefill**
- LLM outputs JSON with venue, date, time, sport
- Frontend auto-populates booking drawer
- Single-click confirmation

### Usage Example

```typescript
import { processUserQuery } from '@/backend/ai/concierge';

const response = await processUserQuery('Find badminton in Aliganj under ₹500', {
  availableVenues: [...],
  userLocation: { latitude: 26.8, longitude: 80.9 }
});

console.log(response.text);           // AI recommendation
console.log(response.recommendations); // Ranked venues
console.log(response.bookingPrefill);  // Auto-fill data
```

---

## 🔐 Security & Authorization

### Firestore Security Rules

**Role-Based Access Control:**

| Resource | Player | Owner | Admin |
| :--- | :---: | :---: | :---: |
| Venues | Read | Read/Write | Full |
| Own Bookings | Read/Write | - | Full |
| Other Bookings | - | Read | Read |
| Verification Claims | Create | Own Only | Full |
| Reviews | Create | - | Delete |

### ID Token Verification

```typescript
import { verifyIdToken } from '@/backend/firebase';

const decodedToken = await verifyIdToken(authHeader.split(' ')[1]);
const isAdmin = decodedToken.admin === true;
```

### Environment Security

- Firebase config in `NEXT_PUBLIC_*` (safe for client)
- Groq API key in `LLM_API_KEY` (server-only)
- Admin emails in `NEXT_PUBLIC_ADMIN_EMAILS`

---

## 📊 Database Schema

### Collections Overview

**users**
```typescript
{
  email: string;
  displayName: string;
  role: 'player' | 'venue_owner' | 'admin';
  phoneNumber?: string;
  createdAt: Timestamp;
}
```

**venues**
```typescript
{
  name: string;
  area: string;
  coordinates: { latitude, longitude };
  sports: [{ name, courts, pricePerHour }];
  ownerId?: string;
  ownerLinked: boolean;
  bookable: boolean;
  rating: number;
  source: 'osm_discovered' | 'user_created' | 'enriched';
}
```

**bookings**
```typescript
{
  ticketCode: string;  // PS-XXXX-XXXX
  userId: string;
  venueId: string;
  sport: string;
  date: Timestamp;
  startTime: string;
  totalPrice: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  isAIBooked: boolean;
}
```

**verification_claims**
```typescript
{
  userId: string;
  venueId: string;
  status: 'pending' | 'approved' | 'rejected';
  verificationDocuments: {
    upiId?: string;
    utrRecords?: string[];
  };
}
```

---

## 🧪 Testing & Validation

### E2E Verification Test

Run the full verification suite:

```bash
node scratch/test-phase10-final.js
```

Tests include:
- ✅ Server health check (port 3000)
- ✅ Firebase connection
- ✅ AI Concierge API
- ✅ Admin ingestion API
- ✅ Venue search endpoint
- ✅ TypeScript compilation
- ✅ Environment variables
- ✅ Shared utilities

### Type Checking

```bash
npm run type-check              # Full project
npm run type-check:frontend     # Frontend only
```

---

## 🛠️ API Routes

### Admin Endpoints

**`GET /api/admin/health`**
- Verify Firebase connection
- Response: `{ status: 'ok', db: boolean }`

**`GET /api/admin/discover-infrastructure`**
- Trigger OSM crawler for Lucknow
- Requires: Admin role
- Params: `?enrichWithGoogle=true`

**`GET /api/admin/verification-claims?status=pending`**
- List owner verification requests
- Requires: Admin role

**`POST /api/admin/approve-claim`**
- Approve venue ownership claim
- Requires: Admin role

### AI Concierge Endpoints

**`POST /api/concierge/chat`**
- Chat with AI about venues
- Body: `{ message: string }`
- Response: `{ text, recommendations, bookingPrefill }`

---

## 📈 Deployment Guide

### Local Development

```bash
npm install
npm run dev
# Opens http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

### Environment Variables for Deployment

1. **Firebase**: Project ID, API key, Auth domain
2. **Google Maps**: JavaScript SDK key
3. **Groq API**: LLM API key
4. **Admin Emails**: Comma-separated whitelist

---

## 📚 Key Technologies Explained

### Next.js 16 (App Router)

- **File-based routing**: Pages auto-mapped from file structure
- **API routes**: Serverless functions at `/app/api/*`
- **Server components**: Default RSC for data fetching
- **Turbopack**: Lightning-fast bundler

### TypeScript Full Coverage

- Strict mode enabled
- Path aliases (`@/` for imports)
- Shared types across backend/frontend
- Type-safe database operations

### Tailwind CSS v4

- Dynamic theme variables
- Dark/Light mode support
- Semantic color mapping
- Zero-runtime CSS

### Firebase Firestore

- Real-time subscriptions
- Automatic synchronization
- Security rules enforcement
- Scalable to millions of documents

### Groq LLM API

- Low-latency inference (10-100ms)
- Llama 3 8B model
- Grounded context for accuracy
- Cost-effective ($0.05/M tokens)

---

## 🔄 Development Workflow

1. **Feature Branch**: `git checkout -b feature/venue-search`
2. **Type Check**: `npm run type-check`
3. **Local Testing**: `npm run dev`
4. **E2E Test**: `node scratch/test-phase10-final.js`
5. **Build Check**: `npm run build`
6. **Commit**: `git add . && git commit -m "feat: venue search"`

---

## ⚠️ Known Limitations

- **Geographic Scope**: Optimized for Lucknow only
- **Simulated Payments**: No real UPI integration
- **Rate Limits**: Google Places API capped at 5 searches/scan
- **Real-time**: Firestore listener limit ~100 concurrent connections

---

## 🚀 Future Enhancements

- [ ] Live occupancy tracking with IoT sensors
- [ ] Dynamic pricing based on weather
- [ ] Player matchmaking for team sports
- [ ] WhatsApp Bot integration
- [ ] Voice-based booking
- [ ] Multi-city expansion

---

**Last Updated**: May 2026
**Team**: DeepStack (APL Finals 2026)
