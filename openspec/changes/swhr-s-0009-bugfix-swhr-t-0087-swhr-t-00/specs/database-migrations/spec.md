## Purpose

How the application's SQLite database schema is brought to the current version when the app opens it, on a fresh database or on one already holding data.

## ADDED Requirements

### Requirement: Schema upgrade preserves existing data
ID: SWHR-R-0249

When the application opens a database, it SHALL apply every pending migration without losing or altering existing rows, even when a migration rebuilds a table that other tables reference. Foreign-key enforcement MUST be ON once migration finishes. The application MUST NOT start on a database that holds a reference to a missing parent row.

#### Scenario: Upgrading a populated catalogue database
ID: SWHR-R-0249.01

- **GIVEN** a database file migrated only through migration 0004 that holds categories, products and items with their locale details
- **WHEN** the application opens it
- **THEN** every migration through the latest is applied, and each catalogue table holds the same number of rows with the same values as before

#### Scenario: Foreign keys are enforced after an upgrade
ID: SWHR-R-0249.02

- **GIVEN** a populated database that has just been upgraded
- **WHEN** a product referencing a category that does not exist is inserted
- **THEN** the insert is rejected with a foreign-key error

#### Scenario: Length constraints survive the table rebuild
ID: SWHR-R-0249.03

- **GIVEN** a populated database that has just been upgraded
- **WHEN** a category with an eleven-character id is inserted
- **THEN** the insert is rejected by the category id length check

#### Scenario: A dangling reference stops startup
ID: SWHR-R-0249.04

- **GIVEN** a database migrated through 0004 holding a product whose category row does not exist
- **WHEN** the application opens it
- **THEN** opening fails with an error naming the product table, and foreign-key enforcement is ON on that connection

#### Scenario: A fresh database is created and seeded
ID: SWHR-R-0249.05

- **GIVEN** no database file at the configured path
- **WHEN** the application opens it
- **THEN** every migration is applied and the catalogue seed data is present
