# Try the new features in 0.0.8

This page activates the new controls with real downloadable files. Start with
**Downloads** and **Version and sources** above this article.

:::note Sample metadata
The `demo/catalog` and `demo/review` branches, dates and review statuses in this
section are fictional examples configured in the manifest. They do not report
the repository's Git state. The attachments are working sample files.
:::

## 1. Download this page and its attachments

Expand **Downloads**. This page has three files in separate groups:

| Group | File | What to try |
| --- | --- | --- |
| This page | Current Markdown page | Download it and inspect the YAML frontmatter: title, page id, sample branch and update date. The original Markdown is preserved below it. |
| Project | Demo project context | An attachment inherited from this section, also available on the nested database pages. |
| Review | Review checklist | A page-specific attachment you can use while trying the demo. |

The files show their format, size and, where supplied, a description. The page
download is generated in your browser; the other files are hosted with the demo.

## 2. Inspect revision information and semantic badges

Expand **Version and sources** above. The section supplies the branch, date
and status; this page adds its own source path. Notice the amber branch badge,
blue demo status and green `0.0.8` badge in the sidebar.

Open [Users table](./demo-users.md): it overrides the branch and status with
green badges, while inheriting the update date and shared attachments.

## 3. Explore four nested subsection levels

In the sidebar, expand this path:

```text
What’s new in 0.0.8
└─ Sample workspace
   └─ Data platform
      └─ PostgreSQL
         └─ Tables
            └─ Users table
```

Each section collapses independently. PostgreSQL and Tables initially start
collapsed. Following the [Users table link](./demo-users.md) opens the active
page's ancestors automatically. [Database overview](./demo-database.md) sits
higher in the same tree, so you can compare the indentation and breadcrumbs.

## 4. Try palettes on desktop and mobile

Use the palette selector in the header, then change the light/dark appearance.
Check the badges, download panel and revision controls in both appearances.
Use Tab to focus the palette selector and open it with Enter; use the arrow
keys to move between palettes, Enter to choose and Escape to close.

On a narrow window or mobile viewport, open the navigation drawer and try its
palette selector. The selected theme is saved locally.

## Configure your own site

See [Downloads and document information](./downloads.md) for attachment,
revision and styling options, or [Manifest reference](./manifest.md) for the
complete navigation contract. All examples here use static manifest data.
