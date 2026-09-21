# Security model

Nimbly Docs treats documentation as untrusted data. The viewer is intentionally useful without treating Markdown or manifest values as executable configuration.

## Rendering pipeline

```text
Markdown → raw HTML disabled parser → allow-list sanitizer → DOM fragment → atomic render
```

The parser escapes raw HTML. The sanitizer independently removes unsafe elements and attributes before mounting the fragment.

## Explicit protections

- `script`, `style`, `iframe`, `object`, `embed`, forms, inline SVG, event-handler attributes, and inline styles are removed.
- `javascript:`, `data:`, `vbscript:`, `file:`, and `blob:` resource URLs are rejected.
- Images are lazy-loaded, decoded asynchronously, and accept only relative or HTTPS URLs by default.
- Code blocks are text, never executable code.
- The manifest does not load plugins, CSS, scripts, fonts, or arbitrary HTML.
- Source URLs cannot contain embedded credentials or token-like authentication query parameters.
- Content is prepared in a `DocumentFragment` and replaced atomically.

## Deployment posture

Prefer same-origin hosting. An OpenShift route, Nginx location, Apache vhost, CDN bucket, or GitHub Pages site is sufficient.

```text
Cache-Control: public, max-age=31536000, immutable    # hashed JS bundle
Cache-Control: max-age=300, must-revalidate           # manifest and Markdown
```

Start from a restrictive CSP and only add actual required origins:

```text
 default-src 'self'; script-src 'self'; style-src 'self';
 img-src 'self' https:; connect-src 'self'; object-src 'none';
 base-uri 'self'; frame-ancestors 'self';
```

## Trust boundary

Authentication belongs to your application and reverse proxy, not the manifest. Do not put access tokens in `source` query strings. If you must use a cross-origin manifest, configure an explicit CORS allow-list on that origin and pin the viewer with SRI.
