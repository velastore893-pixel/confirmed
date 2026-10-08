# Vercel quick checklist

1. Push project to GitHub.
2. Create hosted PostgreSQL database.
3. Add GitHub Actions secret: `DATABASE_URL`.
4. Run **Push database schema** workflow once.
5. Import repository into Vercel.
6. Add all variables from `.env.example` in Vercel.
7. Deploy.
8. Visit `/api/health`.
9. POST `/api/setup` once if database has zero users.
10. Change the generated admin password.
11. Register the SIFT webhook URL.
