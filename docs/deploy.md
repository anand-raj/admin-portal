# Deploying Admin Portal to Cloudflare Pages

## First-time setup

### 1. Create the Cloudflare Pages project

Run once locally (requires being logged in via `npx wrangler login`):

```bash
npx wrangler pages project create admin-portal --production-branch=main
```

Note the assigned URL — it will look like `https://admin-portal-93k.pages.dev`.

### 2. Update ADMIN_URL in both workers

In `cms-backend/cloudflare-membership-worker/wrangler.toml` and `cloudflare-books-worker/wrangler.toml`:

```toml
ADMIN_URL = "https://admin-portal-93k.pages.dev"
```

Redeploy both workers:

```bash
cd cloudflare-membership-worker && npx wrangler deploy
cd ../cloudflare-books-worker && npx wrangler deploy
```

### 3. Create a Cloudflare API token

Cloudflare dashboard → My Profile → API Tokens → Create Token → **Custom Token**:

| Permission | Resource | Level |
|---|---|---|
| Cloudflare Pages | Account | Edit |
| User Details | User | Read |

Set Account Resources to your account. Leave Zone Resources as default.

> Do not paste the token anywhere — copy it directly into GitHub secrets.

### 4. Add GitHub repository secrets

`github.com/anand-raj/admin-portal` → Settings → Secrets and variables → Actions → New repository secret:

| Secret name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Token from step 3 |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID (visible in the Cloudflare dashboard URL or Workers & Pages sidebar) |

Use **repository secrets** (not environment secrets).

---

## Ongoing deployments

Every `git push` to `main` triggers `.github/workflows/deploy.yml` which:

1. Installs dependencies — `npm ci`
2. Builds — `npm run build` → outputs to `dist/`
3. Deploys `dist/` to Cloudflare Pages via `wrangler pages deploy`

Monitor runs at `github.com/anand-raj/admin-portal/actions`.

---

## Local development

```bash
npm install
npm run dev   # http://localhost:5173
```
