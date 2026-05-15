# Cloudflare Workers Builds Settings

If Cloudflare is connected directly to the GitHub repository, use Workers Builds with OpenNext.

Use these commands in the Cloudflare dashboard:

```text
Build command: npx @opennextjs/cloudflare build
Deploy command: npx @opennextjs/cloudflare deploy
```

Do not use this pair for this project:

```text
Build command: npm run build
Deploy command: npx wrangler deploy
```

`npm run build` only creates the standard `.next` folder. The Worker deployment needs the OpenNext-generated `.open-next` output, which is created by `npx @opennextjs/cloudflare build`.

The normal `build` script in `package.json` should stay as `next build`, because OpenNext calls that script internally before adapting the output for Cloudflare Workers.
