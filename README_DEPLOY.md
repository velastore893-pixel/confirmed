# CODFlow — GitHub + Vercel deployment

This project is prepared for GitHub and Vercel. The app uses Next.js, PostgreSQL and Drizzle ORM.

## 1. Create a PostgreSQL database

Use a hosted PostgreSQL database (for example Supabase, Neon or another provider). Copy the production connection string and make sure SSL is enabled if your provider requires it.

You will use it as `DATABASE_URL`.

## 2. Push this folder to GitHub

Create a new empty GitHub repository, then from this project folder run:

```bash
git init
git add .
git commit -m "Prepare CODFlow for production"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Do not commit `.env` or `.env.local`. They are ignored by `.gitignore`.

## 3. Configure the database schema

### Option A — GitHub (recommended if you do not want to run commands locally)

In the GitHub repository:

1. Open **Settings → Secrets and variables → Actions**.
2. Create a repository secret named `DATABASE_URL` containing the production PostgreSQL URL.
3. Open **Actions → Push database schema → Run workflow**.
4. Wait until the workflow finishes successfully.

This runs `npm run db:push` against the production database.

### Option B — locally

Create `.env.local` with your database URL, install dependencies and run:

```bash
npm install
npm run db:push
```

## 4. Import the GitHub repository into Vercel

1. In Vercel choose **Add New → Project**.
2. Import the GitHub repository.
3. Framework preset should be detected as **Next.js**.
4. Root directory must be the folder containing this `package.json`.
5. Keep the default build command: `npm run build`.

## 5. Add Vercel Environment Variables BEFORE deploying

Add these variables for Production (and Preview if you want preview deployments to work):

- `DATABASE_URL`
- `JWT_SECRET`
- `CREDENTIALS_ENCRYPTION_KEY`
- `SIFT_WEBHOOK_SECRET`
- `CRON_SECRET`
- `SHOPIFY_API_VERSION=2026-10`

Generate long, different random values for the three secret variables. Do not reuse a password or API token.

## 6. Deploy

Deploy from Vercel. After deployment verify:

- `https://YOUR_DOMAIN/api/health` returns `{ "ok": true }`
- `/login` opens correctly
- registration works
- Admin / Employee / Client permissions are isolated

## 7. Initial data / admin account

The project contains a one-time setup endpoint that only works while the `users` table is empty. After the schema exists, call:

```text
POST https://YOUR_DOMAIN/api/setup
```

It creates the initial system data and prints temporary account credentials in the Vercel function logs. Immediately sign in and change the temporary passwords.

Important: run this only once, immediately after deployment. Once users exist it refuses to run again.

## 8. SIFT Livraison webhook

After deployment, give SIFT support this URL (replace the values):

```text
https://YOUR_DOMAIN/api/webhooks/sift?secret=YOUR_SIFT_WEBHOOK_SECRET
```

Never publish the secret publicly.

## 9. Google Sheets automatic sync

The protected sync endpoint is:

```text
GET /api/sync/google-sheets
Authorization: Bearer YOUR_CRON_SECRET
```

You can call it from Vercel Cron or another scheduler. Configure the schedule only after the first deployment is stable so it matches your Vercel plan's cron limits.

## 10. GitHub → Vercel automatic deployments

After the repository is linked to Vercel:

- every push to `main` creates a Production deployment (depending on your Vercel Git settings)
- pull requests / other branches can create Preview deployments
- do not put production secrets in GitHub source files

## Production checklist

Before inviting real clients:

- [ ] database schema pushed successfully
- [ ] all Vercel environment variables added
- [ ] `/api/health` is OK
- [ ] one-time setup completed
- [ ] initial admin password changed
- [ ] Client / Employee / Admin access tested
- [ ] SIFT token stored through the app, not source code
- [ ] SIFT webhook registered with SIFT support
- [ ] Google Sheets sync tested on one store before scheduling it
- [ ] custom domain + HTTPS enabled
