## Purpose

How a developer runs the application locally: the development server entry point and the runtime it guarantees.

## ADDED Requirements

### Requirement: Development server runtime
ID: SWHR-R-0247

The project's development server entry point SHALL run the server-side route handlers under the Bun runtime regardless of whether Node.js is also installed, so that every route backed by the Bun SQLite driver responds normally in development.

#### Scenario: Database-backed route under the development server
ID: SWHR-R-0247.01

- **GIVEN** a clean checkout on a machine with both Bun and Node.js installed
- **WHEN** the development server is started through the project's dev entry point and the category list API is requested
- **THEN** the response is HTTP 200 with a JSON body containing a categories list, not an HTTP 500

#### Scenario: End-to-end suite uses the development entry point
ID: SWHR-R-0247.02

- **GIVEN** the end-to-end suite's web server configuration
- **WHEN** the suite starts its server
- **THEN** it starts through the same dev entry point developers use, so a database-backed end-to-end spec fails if that entry point stops running under Bun
