**Live:** https://gym-risk-app.vercel.app/

# Gym Risk

Gym Risk is a training load monitoring web app designed for serious lifters and athletes who want clearer feedback on how their training stress accumulates over time.

Rather than generic fitness tracking, Gym Risk focuses on measurable inputs such as volume, intensity, RPE, and pain. These metrics are compared across short and long time windows to help identify patterns that may increase injury risk.

The project is informed by established load management concepts commonly used in sports medicine and performance coaching.

---

## What it does

- Log training sessions with sets, reps, RPE, and pain
- Track training volume and intensity trends over time
- Compare 7 day vs 28 day load to detect rapid changes
- Surface explainable signals when risk increases, such as volume spikes in specific muscle groups
- Provide a calm, focused interface designed for decision support rather than motivation or gamification

---

## What it is not

- Not a medical device
- Not a diagnostic system
- Not a replacement for a coach, physical therapist, or clinician
- Gym Risk is intended to support better training decisions, not to replace professional judgment.

---

## Tech stack

- Next.js (App Router)
- TypeScript
- Prisma with PostgreSQL
- NextAuth
- Tailwind CSS
- Resend for email workflows
- Deployed on Vercel.

---

## Project status

Gym Risk is under active development. Core logging, authentication, and trend analysis are in place, with continued refinement of risk modeling, onboarding, and UI clarity.