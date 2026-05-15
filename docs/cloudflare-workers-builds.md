# Cloudflare Workers Builds Settings

If Cloudflare is connected directly to the GitHub repository, use Workers Builds with static assets.

This repository deploys to the Cloudflare Worker named `stock`, which serves `https://stock.jo139988.workers.dev/`.

Use these commands in the Cloudflare dashboard:

```text
Build command: npm run build
Deploy command: npx wrangler deploy
```

`next.config.mjs` uses `output: "export"`, so `npm run build` creates the `out` directory. `wrangler.jsonc` serves that directory through the `ASSETS` binding, while `worker/index.ts` handles `/api/snapshot`.
