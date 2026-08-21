# Cloudflare deployment

This Next.js application deploys to Cloudflare Workers through the OpenNext adapter.

## Required build variables

Configure these values in Cloudflare under **Workers & Pages → your Worker → Settings → Variables and Secrets** (and in **Build Variables and secrets** when using Workers Builds):

```text
NEXT_PUBLIC_APP_URL=https://your-domain.example
NEXT_PUBLIC_AUTH_BASE_URL=https://your-api.example/api/v1/auth
NEXT_PUBLIC_API_BASE_URL=https://your-api.example
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

`NEXT_PUBLIC_*` values are embedded into the browser bundle during the build, so they must be available to the build environment. Do not commit production values to `.env` files.

## Local verification

```bash
pnpm build
pnpm preview
```

`pnpm preview` builds with OpenNext and runs the result in Cloudflare's local Workers runtime.

## Deploy from a local machine

Authenticate once, then deploy:

```bash
pnpm wrangler login
pnpm deploy
```

Wrangler prints the resulting `workers.dev` URL. Set `NEXT_PUBLIC_APP_URL` to the final URL or custom domain and rebuild before the production deployment.

## Deploy from Cloudflare Workers Builds

Connect the Git repository in the Cloudflare dashboard and use:

```text
Build command: pnpm build
Deploy command: pnpm deploy
```

Add the required build variables above in the Cloudflare dashboard. The repository should use the `fix/cloudflare-deployment` branch until these changes are merged into `main`.
