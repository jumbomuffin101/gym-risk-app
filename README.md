# Gym Risk

**Status:** Active development - landing page complete, core features in progress

**Live Demo (Landing Page):** [https://gym-risk-app.vercel.app](https://gym-risk-app.vercel.app)

A training load monitoring platform for serious lifters and athletes. Gym Risk analyzes workout volume, intensity, RPE, and pain trends to surface injury risk signals before fatigue compounds into setbacks.

---

## What's Built

### Completed
- Professional landing page with product messaging
- User authentication system (NextAuth)
- Database schema design (Prisma + PostgreSQL)
- Workout logging data models
- Risk calculation algorithms (backend logic)
- Responsive UI components (Tailwind + Radix UI)

### In Progress
- Workout logging interface (users can sign up, but can't log workouts yet)
- Dashboard with risk scores and weekly load trends
- Historical data visualization
- Email notifications for risk alerts

### Planned
- Mobile app (React Native)
- Coach/athlete relationship features
- Export training data (CSV, PDF reports)
- Integration with wearables (Whoop, Garmin)

---

## Why I'm Building This

I wanted clearer feedback on training stress accumulation without paying for expensive coaching software or relying on generic fitness trackers. Existing solutions either:
- Cost $50-100/month for features I don't need
- Use proprietary "readiness scores" with no explanation
- Focus on motivation/gamification instead of decision support

Gym Risk is designed for athletes who want **explainable, actionable signals** based on established load management concepts from sports medicine.

---

## Technical Highlights

### Architecture
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (Vercel Postgres)
- **Auth:** NextAuth.js with email/password and OAuth
- **Deployment:** Vercel (CI/CD via GitHub)

### Database Design
Normalized relational schema with tables for:
- Users (authentication, preferences)
- WorkoutSessions (date, duration, notes)
- Exercises (name, muscle group, equipment type)
- Sets (weight, reps, RPE, pain level)

Key design decision: **Separate sets from exercises** to enable flexible tracking (same exercise, different load/RPE across sets).

### Risk Calculation Logic
Implements the **acute:chronic workload ratio (ACWR)** concept:
- **Acute load:** 7-day rolling average
- **Chronic load:** 28-day rolling average
- **Risk zones:** ACWR < 0.8 (undertraining), 0.8-1.3 (optimal), > 1.3 (overreaching)

Load is calculated as: `RPE × Duration × Volume` (session load units).

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (or use Vercel Postgres)

### Setup
```bash
# Clone the repo
git clone https://github.com/jumbomuffin101/gym-risk-app.git
cd gym-risk-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add DATABASE_URL and NEXTAUTH_SECRET

# Run database migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

---

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS for styling
- Radix UI for accessible components
- Recharts for data visualization (planned)

**Backend:**
- Next.js API Routes
- Prisma ORM for type-safe database queries
- NextAuth.js for authentication
- Zod for runtime validation

**Database:**
- PostgreSQL (Vercel Postgres)
- Prisma migrations for schema management

**DevOps:**
- Deployed on Vercel
- CI/CD via GitHub integration
- Environment-based configuration

---

## What I'm Learning

### Product Design
- How to communicate value without over-promising
- Balancing feature scope vs. time-to-launch
- Designing for clarity over motivation/gamification

### Engineering
- Next.js App Router patterns (server components, server actions)
- Type-safe database operations with Prisma
- Session management and authentication flows
- Responsive design with Tailwind utility classes

### Domain Knowledge
- Sports science concepts (ACWR, load management)
- How to make complex metrics explainable to users
- Balancing scientific rigor with practical usability

---

## Roadmap

**Phase 1 (Current):** Core workout logging and dashboard  
**Phase 2:** Risk alerts and trend analysis  
**Phase 3:** Advanced features (coach access, data export, mobile app)  
**Phase 4:** Community features (share workouts, compare with peers)

---

## Disclaimer

Gym Risk is a decision support tool, not medical advice. It is not a diagnostic system and should not replace professional judgment from coaches, physical therapists, or clinicians.

---

## License

MIT

---

## Contact

Built by Aryan Rawat  
