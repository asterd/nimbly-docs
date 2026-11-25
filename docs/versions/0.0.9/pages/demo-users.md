# Users table

This is the deepest page in the navigation demo: four subsection levels below
the top section. Its schema and revision status are fictional sample data.

## Sample schema

```sql
CREATE TABLE demo_users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## What this page demonstrates

| Control | Expected result |
| --- | --- |
| Sidebar | All ancestors of Users table expand when you follow a direct link. Each level has its own indentation and collapse control. |
| Breadcrumbs | The full section path leads to this page. |
| Downloads | Current page Markdown, inherited project context and inherited SQL schema. |
| Revision information | The sample branch is `demo/review`; the source is `docs/downloads/demo-schema.sql`. The update date is inherited. |
| Badges | The branch and review status use explicit success tones; the sidebar SQL badge uses the info tone. |

Download this page's Markdown and check that its frontmatter uses the overridden
branch. Download the SQL attachment to get the complete sample file.

Return to [Database overview](./demo-database.md) or the
[feature walkthrough](./feature-tour.md).
