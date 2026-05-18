# Gym-Risk

Gym-Risk is a training load analytics platform built for lifters who want more than a workout tracker.

Instead of only logging exercises and sets, Gym-Risk turns workout data into workload signals, baseline comparisons, and risk metrics that help users understand how training volume and intensity change over time.

The goal is not to predict injuries. The goal is to provide interpretable training signals that help users manage fatigue and identify potentially risky workload patterns.

---

## Features

### Training Load Analytics
- Computes session load from logged workouts
- Tracks rolling 7-day workload
- Builds user baselines from historical data
- Calculates workload change relative to prior training

### Risk Signals
- Formula-based risk scoring using:
  - training load trends
  - acute vs chronic workload behavior
  - high RPE exposure
  - pain reporting
- Provides risk states:
  - Stable
  - Monitor
  - High

### Muscle Heatmap
- Interactive front and back muscle maps
- Maps exercises to muscle regions
- Distributes exercise workload across involved regions
- Highlights areas receiving elevated exposure

### Workout Logging
- Create reusable workout templates
- Log completed workouts
- Duplicate exercises and sets
- Track:
  - reps
  - weight
  - RPE
  - pain signals
  - workout date

### Workout History
- View logged workouts
- Rename workouts
- Delete workouts
- Edit workout information

---

## Risk Model

Gym-Risk uses deterministic calculations rather than black-box predictions.

Examples of signals used:

**Session load**

```text
Session Load = Σ(weight × reps)
```

**Rolling workload**

```text
7-Day Load = Total session load over previous 7 days
```

**Baseline readiness**

Baseline becomes available when:

- At least 3 logged workouts exist
- Workouts span at least 7 days

**Risk signal inputs**

- Weekly workload changes
- High RPE exposure
- Pain entries
- Acute versus chronic workload behavior

Risk signals are intended to provide training context and are not medical predictions.

---

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Next.js Server Actions
- Prisma ORM
- PostgreSQL

### Authentication
- NextAuth

### Infrastructure
- Vercel deployment

---

## Project Structure

```text
src/
├── app/
│   ├── dashboard/
│   ├── exercises/
│   ├── log/
│   ├── workouts/
│   └── api/
│
├── lib/
│   ├── metrics/
│   ├── data/
│   └── auth/
│
prisma/
```

---

## Local Setup

Clone the repository:

```bash
git clone <repo-url>
cd gym-risk-app
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
DATABASE_URL=

NEXTAUTH_URL=

NEXTAUTH_SECRET=
```

Run Prisma:

```bash
npx prisma generate
npx prisma db push
npm run seed
```

Start development:

```bash
npm run dev
```

---

## Future Improvements

- Exercise-specific workload weighting
- Expanded recovery metrics
- Personalized adaptation models
- Wearable integrations
- Exportable analytics reports
- Long-term progression dashboards

---

## Disclaimer

Gym-Risk provides training workload signals for informational purposes only.

It is not intended to diagnose, treat, or predict medical conditions or injuries.