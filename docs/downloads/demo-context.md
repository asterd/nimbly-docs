# Sample workspace

This is a fictional project used to demonstrate Nimbly Docs 0.0.8.
Revision labels in the demo manifest are sample data, not Git provenance.

## Architecture

- PostgreSQL stores the sample users table.
- The schema is available as a separate SQL attachment.
- Documentation, attachments and revision labels are static files.

## Documentation contract

Workspace pages inherit this file from their parent section. Database pages
also inherit the SQL schema. Individual pages can add attachments or override
revision fields without repeating the parent configuration.
