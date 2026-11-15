# Component API

The element exposes a few methods and DOM events. Use these from your application rather than reaching into the Shadow DOM.

## Methods

```ts
const docs = document.querySelector<NimblyDocsElement>("nimbly-docs")!;

docs.navigate("security", "deployment-posture");
docs.setTheme("midnight");
docs.setVersion("0.0.5");
docs.openSearch();
await docs.reload();
```

| Method | Result |
| --- | --- |
| `navigate(id, anchor?)` | Opens a page, optionally at a heading |
| `reload()` | Loads and validates the manifest again |
| `setTheme(name)` | Applies a theme, saves the choice and returns the name applied |
| `setVersion(id)` | Switches documentation version, staying on the same page if it exists there |
| `openSearch()` | Opens the search dialog |

## Events

```ts
docs.addEventListener("docs-ready", (event) => console.log(event.detail));
docs.addEventListener("docs-navigate", (event) => console.log(event.detail.id));
docs.addEventListener("docs-error", (event) => console.error(event.detail.code));
```

| Event | Detail |
| --- | --- |
| `docs-ready` | `{ title, version }`, once the manifest is valid and the layout is shown |
| `docs-navigate` | `{ id, url, version }`, after a page is rendered. `url` is the Markdown file that was actually loaded. `version` is the active version id, or `null` if the site has no versions |
| `docs-error` | `{ code, message, cause? }`. `cause` holds technical detail for logging; don't show it to readers |

## Local extensions

An extension is JavaScript from your own application, registered before the element is added to the page. Extensions can't be declared in a manifest or downloaded.

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

Keep extensions small. The output of `transformHtml` still goes through the sanitizer.
