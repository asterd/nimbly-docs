# Security model

Nimbly Docs treats Markdown and the manifest as untrusted input. Neither can run code in the page.

## Rendering pipeline

```text
Markdown → raw HTML disabled parser → allow-list sanitizer → DOM fragment → atomic render
```

The parser escapes raw HTML. The sanitizer then checks the output again and removes any element or attribute not on its allow-list before the page is shown.

## Protections

- `script`, `style`, `iframe`, `object`, `embed`, forms, inline SVG, event-handler attributes and inline styles are removed. The only form control kept is the disabled checkbox of a task list, which is rebuilt from scratch.
- `javascript:`, `data:`, `vbscript:`, `file:` and `blob:` URLs are rejected.
- Images load lazily and accept only relative or HTTPS URLs by default.
- Code blocks are shown as text and never run.
- The manifest can't load plugins, CSS, scripts, fonts or HTML.
- Source URLs can't contain credentials or token-like query parameters.
- Each page is built in a `DocumentFragment` and swapped in at once.

## Deployment posture

Serve the docs from the same origin as your app when you can. Any static host works: an Nginx location, an Apache vhost, an OpenShift route, a CDN bucket or GitHub Pages.

```text
Cache-Control: public, max-age=31536000, immutable    # hashed JS bundle
Cache-Control: max-age=300, must-revalidate           # manifest and Markdown
```

Start with a strict Content Security Policy and add only the origins you actually need:

```text
 default-src 'self'; script-src 'self'; style-src 'self';
 img-src 'self' https:; connect-src 'self'; object-src 'none';
 base-uri 'self'; frame-ancestors 'self';
```

## Trust boundary

Authentication is handled by your application or reverse proxy, not by the manifest. Don't put access tokens in `source` query strings. If the manifest must come from another origin, allow your site explicitly in that origin's CORS settings and pin the viewer with SRI.
