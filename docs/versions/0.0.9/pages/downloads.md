# Downloads and document information

Nimbly Docs renders static file attachments from the manifest. Files are hosted
beside the documentation or at an approved HTTP(S) URL. No API, server-side
rendering or runtime extension is needed.

## Reusable catalog and inheritance

```json
{
  "version": "1.0",
  "title": "Product documentation",
  "chooseThemes": true,
  "features": { "sourceDownload": true },
  "attachments": [
    {
      "id": "project-context",
      "label": "Project context",
      "description": "Architecture, contracts and domain rules for AI tools.",
      "url": "./downloads/context.md",
      "group": "Project",
      "mediaType": "text/markdown",
      "bytes": 18432,
      "download": "project-context.md"
    }
  ],
  "sections": [
    {
      "id": "product",
      "title": "Product",
      "attachments": ["project-context"],
      "revision": {
        "branch": "feature/catalog",
        "branchTone": "warning",
        "commit": "abc1234",
        "updatedAt": "2026-11-13",
        "source": "src/catalog",
        "status": { "label": "Review required", "tone": "warning" }
      },
      "sections": [
        {
          "id": "data",
          "title": "Database",
          "collapsed": true,
          "pages": [
            {
              "id": "users",
              "title": "Users",
              "source": "./pages/users.md",
              "badge": { "label": "PostgreSQL", "tone": "info" },
              "attachments": [
                {
                  "label": "Schema",
                  "url": "./downloads/schema.sql",
                  "group": "Database",
                  "mediaType": "application/sql"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

The `bytes` value above is illustrative; provide the actual file size or omit it.
Descriptions, labels and groups also accept locale maps.

Sections inherit attachments from their ancestors. Page attachments append to
that list. Entries with the same resolved URL are deduplicated, with the more
specific declaration winning. Unknown catalog ids fail manifest validation.

The download panel groups files and shows their descriptions, format and
optional size. When `sourceDownload` is enabled, the current Markdown source is
offered in its own group. The download preserves the loaded Markdown and diagram source, and adds a YAML frontmatter block containing the page title, id and available revision metadata. It is created locally in the browser; the source URL remains the fallback link.

## File descriptor

| Field | Meaning |
| --- | --- |
| `id` | Required and unique in the root catalog; optional inline |
| `label` | Required display label or locale map |
| `url` | Required HTTP(S) or manifest-relative URL |
| `description` | Optional description or locale map |
| `group` | Optional download group or locale map |
| `mediaType` | Optional MIME type |
| `bytes` | Optional non-negative integer size |
| `download` | Defaults to download; false opens normally, a string specifies the filename |

Credentials, authentication query parameters and executable URL schemes are
rejected. Filenames cannot contain path separators or control characters.
Cross-origin downloads remain subject to the browser's download policy.

## Revision information

The optional `revision` object is inherited and merged field by field. A page can
override its source or commit without repeating the entire parent object.

Branch and status tones use `neutral`, `success`, `warning`, `danger` or `info`.
The library does not infer whether a branch is a release branch: the manifest
sets the tone explicitly.

Revision information opens from the "Version and sources" toggle in the document toolbar. Nimbly displays
this data; checking Git history remains a separate build or maintenance task.

## Styling

The viewer exposes `::part(page-tools)`, `::part(downloads)`,
`::part(download-link)`, `::part(theme-picker)` and `::part(theme-menu)`.
The `--dv-sidebar-width` token controls desktop navigation width. Features use
the selected palette's semantic colours in both light and dark appearance.
