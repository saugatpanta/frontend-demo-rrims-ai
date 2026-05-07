# RRIMS Frontend

Advanced React + Tailwind frontend for the RRIMS backend hosted at `https://pantasaugat.com.np`.

## Run

```bash
npm install
npm run dev
```

The API base URL is configured in `.env`:

```bash
VITE_API_BASE_URL=https://pantasaugat.com.np/api/v1
```

## Build

```bash
npm run build
```

## Deploy

For Vercel, set the project root to this `frontend` folder. The included
`vercel.json` rewrites React Router paths like `/login` and `/app/reports` to
`index.html`, preventing hosting-layer 404s on refresh or direct links.

For Netlify, `netlify.toml` and `public/_redirects` provide the same SPA
fallback.
# frontend-demo-rrims-ai
