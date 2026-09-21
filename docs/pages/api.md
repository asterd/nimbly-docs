# Component API

The public API is intentionally small. Application integrations should use DOM events and explicit methods rather than reach into the Shadow DOM.

## Methods

```ts
const docs = document.querySelector<NimblyDocsElement>("nimbly-docs")!;

docs.navigate("security", "deployment-posture");
docs.setTheme("midnight");
docs.openSearch();
await docs.reload();
```

| Method | Result |
| --- | --- |
| `navigate(id, anchor?)` | Updates the hash route |
| `reload()` | Fetches and revalidates the manifest |
| `setTheme(name)` | Applies and persists a valid theme; returns its applied name |
| `openSearch()` | Opens local full-text search |

## Events

```ts
docs.addEventListener("docs-ready", (event) => console.log(event.detail));
docs.addEventListener("docs-navigate", (event) => console.log(event.detail.id));
docs.addEventListener("docs-error", (event) => console.error(event.detail.code));
```

| Event | Detail |
| --- | --- |
| `docs-ready` | `{ title, version }` after manifest validation and shell render |
| `docs-navigate` | `{ id, url }` after a page is rendered |
| `docs-error` | `{ code, message, cause? }`; technical causes are for application handling/debug only |

## Local extensions

Extensions are application-owned JavaScript registered before the element connects. They are never downloaded or declared in a manifest.

```ts
import { NimblyDocsElement } from "./nimbly-docs.min.js";

NimblyDocsElement.use({
  name: "release-banner",
  setup({ manifest }) {
    console.info(`Loaded ${manifest.title}`);
  },
  transformHtml(html) {
    return html.replace("<!-- release -->", "");
  }
});
```

Use this API for narrowly scoped enhancements only. The sanitizer remains the security boundary after `transformHtml` returns.
