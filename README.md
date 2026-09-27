# Features & plans website

A static site (no build step) that presents the extension with animations and an interactive filter demo, explains the plans, and handles **sign-in (Google, via Supabase)** and **checkout (Stripe, via the Supabase functions)**. The extension's control panel and its "trial ended" offer link here (`#pricing`).

| File | What |
| --- | --- |
| `index.html` | the page |
| `styles.css` | styles and CSS animations |
| `app.js` | hero animation, gradient background, scroll reveals, filter lab, sign-in, pricing, checkout |
| `config.js` | **site URL**, add-on URL, Supabase URL + publishable key, plans, disclaimer |
| `demo.svg`, `icon.svg` | illustration and icon (made for the site: no Instagram content) |

Supabase can't serve this page itself: on the free project address it serves HTML as plain text (anti-phishing), unless you have the Pro plan and a custom domain. So the page is hosted elsewhere for free and only *talks* to Supabase.

## Preview locally

```
cd site
python -m http.server 8765
```

Open http://127.0.0.1:8765/ (add `?static` to see it without animations). Sign-in only works once the site is published at the address in `config.js`.

## Publish (pick one)

**A. GitHub Pages (a small public repo).** Your main repo is private, and Pages on a private repo needs a paid plan, so put only this folder in a public repo:

```
gh repo create instagram-fullscreen-viewer --public
# copy the contents of site/ into it, commit, push, then:
# GitHub → repo → Settings → Pages → Deploy from branch → main / (root)
```

The address becomes `https://lokeshvlogs.github.io/instagram-fullscreen-viewer/`, which is what `config.js` expects.

**B. Cloudflare Pages.** Connect the private repo, set the build output directory to `Firefox/Instagram/ImageViewer-FullScreen/site`, no build command. You get `https://<name>.pages.dev/`.

**C. Netlify.** Drag the `site` folder onto app.netlify.com/drop. You get `https://<name>.netlify.app/`.

## After publishing

1. **`site/config.js`:** set `SITE_URL` to the real address (with the trailing `/`). Set `ADDON_URL` once the add-on is listed.
2. **Extension, `src/config.js`:** set `IGFV_SITE_URL` to the same address, then rebuild the extension.
3. **Supabase → Authentication → URL Configuration → Redirect URLs:** add the site address, so Google sign-in can return to it.
4. **Supabase → Edge Functions → Secrets:** add `SITE_URL` with the same address. Checkout and the billing portal only return to this site.

Nothing changes in Google Cloud: sign-in still goes through Supabase's callback.
