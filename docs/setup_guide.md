# PlaySphere AI — Developer Setup & Run Guide

Follow these steps to set up and run PlaySphere AI locally on your machine.

---

## 📋 Prerequisites
Ensure you have the following installed:
* **Node.js**: v20 or later
* **npm**: v10 or later
* **Firebase Project**: An active Firebase project with Firestore and Authentication enabled.
* **Hosted LLM API Key**: An active API key from an OpenAI-compatible provider (e.g. Groq, Ollama).

---

## ⚙️ 1. Environment Configurations

Create a `.env.local` file in the `playsphere-ai/` root directory. Add the following configurations (replacing placeholders with your active keys):

```env
# AI Configuration (Hosted LLM via Groq/Ollama)
LLM_API_URL=https://api.groq.com/openai/v1
LLM_API_KEY=your_llm_api_key_here
LLM_MODEL=llama-3.1-8b-instant

# Firebase Client SDK Configuration Settings
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Maps Javascript SDK Configuration Settings
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

*(Note: These variables are exposed to the client bundle via the `NEXT_PUBLIC_` prefix so they can initialize the Maps and Firebase libraries inside the browser environment).*

---

## 📦 2. Dependencies Installation

Run the package installer at the root directory:
```bash
npm install
```

---

## 🌱 3. Database Seeding

To seed your Firestore database with default Lucknow venue documents:
1. Make sure your Firebase environment variables are loaded in `.env.local`.
2. Start the dev server and go to `/api/seed` in your browser:
   ```bash
   http://localhost:3000/api/seed
   ```
This will clear/initialize the `venues` collection in Firestore with the default mock venues from Gomti Nagar, Aliganj, Hazratganj, and other locations.

---

## 🏃 4. Running the Development Server

To run the application locally in development mode:
```bash
npm run dev
```

The server runs on [http://localhost:3000](http://localhost:3000). Next.js will serve files from the `frontend/` directory, while proxying and mapping aliases using the root packages.

---

## 🧪 5. Validation and Production Builds

Before deploying changes, verify the workspace compiles cleanly:

```bash
# 1. Run ESLint checks (must report 0 errors)
npm run lint

# 2. Run TypeScript compiler checks
npx tsc --noEmit --project frontend/tsconfig.json

# 3. Create a production build
npm run build
```
