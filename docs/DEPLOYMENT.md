# PlaySphere AI - Deployment Guide

This guide covers deploying PlaySphere AI (Next.js 16 + Firebase) to production.

---

## 🚀 Quick Start (Local)

```bash
# Install
npm install

# Configure environment
cp .env.local.example .env.local
# Edit with Firebase & Groq credentials

# Run development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ Deployment Options

### Option 1: Vercel (Recommended)

**Benefits**: Optimized for Next.js, auto-scaling, zero-config

1. **Create Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)

2. **Connect Repository**
   - Import your GitHub repo
   - Select `playsphere-ai` as project

3. **Set Environment Variables**
   - Go to Settings → Environment Variables
   - Add all variables from `.env.local`
   - Ensure `LLM_API_KEY` is set

4. **Deploy**
   - Auto-deploys on push to main
   - Production URL generated

**Configuration** (`vercel.json` if needed):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_FIREBASE_API_KEY": "@firebase_api_key",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "@firebase_project_id",
    "LLM_API_KEY": "@llm_api_key"
  }
}
```

### Option 2: Netlify

**Benefits**: Alternative platform, same performance

1. **Create Netlify Account**
   - Sign up at [netlify.com](https://netlify.com)

2. **Connect Repository**
   - Click "New site from Git"
   - Select GitHub repo

3. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

4. **Environment Variables**
   - Add all `.env.local` variables

5. **Deploy**
   - Netlify auto-builds and deploys

### Option 3: Self-Hosted (Docker)

**Benefits**: Full control, custom domain

1. **Create Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

2. **Build & Run**
```bash
docker build -t playsphere-ai .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx \
  -e LLM_API_KEY=xxx \
  playsphere-ai
```

3. **Deploy to Cloud**
   - AWS ECS/Fargate
   - Google Cloud Run
   - Azure Container Instances
   - DigitalOcean App Platform

---

## 🔧 Environment Variables

### Frontend (Public - `NEXT_PUBLIC_*`)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDxxx...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=playsphere-apl.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=playsphere-apl
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=playsphere-apl.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDxxx...
NEXT_PUBLIC_ADMIN_EMAILS=admin@playsphere.in,admin2@playsphere.in
```

### Backend (Private)
```env
LLM_API_KEY=gsk_xxx...
LLM_API_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama3-8b-8192
```

---

## 🔒 Security Checklist

- [ ] Firebase Security Rules deployed (`firestore.rules`)
- [ ] Environment variables secured (not in code)
- [ ] Admin emails whitelisted
- [ ] Firebase Auth domains configured
- [ ] API rate limiting enabled (Groq)
- [ ] CORS headers configured for frontend domain
- [ ] Database backups enabled
- [ ] Firestore indexes optimized

---

## 📊 Firebase Setup

### 1. Create Firebase Project
```bash
# Go to Firebase Console
# Create new project > PlaySphere AI
# Enable Firestore and Authentication
```

### 2. Configure Authentication
- Enable Email/Password
- Enable Google Sign-In
- Set authorized redirect URIs:
  ```
  http://localhost:3000
  https://yourdomain.vercel.app
  https://yourdomain.example.com
  ```

### 3. Deploy Firestore Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

### 4. Create Firestore Collections
- `users` - User profiles
- `venues` - Sports venues
- `bookings` - Reservations
- `reviews` - Venue ratings
- `verification_claims` - Owner approvals

---

## 🚢 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy PlaySphere AI

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 📈 Performance Optimization

### Next.js Optimization
- Image optimization: `<Image>` component
- Code splitting: Automatic route-based
- CSS optimization: Tailwind v4 purging
- Font optimization: Google Fonts preload

### Database Optimization
- **Indexes**: Create on `venue.area`, `booking.userId`
- **Caching**: Browser cache with `next/cache`
- **Lazy loading**: Firestore pagination

### API Optimization
- **Response compression**: gzip enabled
- **Caching headers**: Set max-age for static
- **Rate limiting**: Groq API quota

---

## 🐛 Monitoring & Debugging

### Logs

**Vercel**: Dashboard → Logs → Function logs / Build output

**Local**: `npm run dev` → Terminal output

### Error Tracking

Consider integrating:
- **Sentry**: Error monitoring (`@sentry/nextjs`)
- **LogRocket**: Session replay
- **DataDog**: Infrastructure monitoring

### Performance Monitoring

```bash
# Lighthouse audit
npm run build
npm start
# Open Chrome DevTools → Lighthouse
```

---

## 🔄 Rollback Procedures

### Vercel
1. Navigate to Deployments
2. Click "Promote" on previous stable version
3. Or via CLI: `vercel rollback`

### Firebase
```bash
# Rollback Firestore security rules
firebase deploy --only firestore:rules --force
```

---

## 📞 Support & Troubleshooting

### Common Issues

**"Firebase credentials not found"**
- Ensure `.env.local` has all Firebase variables
- Check `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

**"Groq API key invalid"**
- Verify `LLM_API_KEY` in environment
- Check key hasn't expired in Groq dashboard

**"Port 3000 already in use"**
```bash
# Kill process
lsof -ti:3000 | xargs kill -9
# Or use different port
npm run dev -- -p 3001
```

**"TypeScript compilation errors"**
```bash
npm run type-check
# Fix errors shown in output
```

---

## 📋 Pre-Production Checklist

- [ ] All tests passing: `node scratch/test-phase10-final.js`
- [ ] TypeScript strict mode: `npm run type-check`
- [ ] Build successful: `npm run build`
- [ ] Environment variables set
- [ ] Firebase Security Rules deployed
- [ ] Firestore backups enabled
- [ ] Admin emails configured
- [ ] Domain/DNS configured
- [ ] SSL certificate (auto for Vercel/Netlify)
- [ ] Monitoring setup complete

---

## 🎯 Post-Deployment

1. **Verify Functionality**
   - Test login flow
   - Search venues
   - Create booking
   - Admin approval flow

2. **Monitor Performance**
   - Check Lighthouse scores
   - Monitor API latency
   - Track error rates

3. **User Communications**
   - Announce deployment
   - Share live URL
   - Gather feedback

---

**Deployment URL Format**
```
Production: https://playsphere-ai.vercel.app
Staging: https://playsphere-ai-staging.vercel.app
```

**Support Email**: team@playsphere.in  
**Status Page**: https://status.playsphere.ai
