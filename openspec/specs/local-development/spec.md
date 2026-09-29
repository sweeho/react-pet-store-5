# local-development Specification

## Purpose

How a developer runs the application locally: the development server entry point and the runtime it guarantees.

## Requirements

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

### Requirement: Stub sentinel confined to live stubs

ID: SWHR-R-0248

The repository SHALL NOT contain the literal text of the configured stub sentinel in any documentation or configuration file: everything under `artifacts/`, `openspec/` and `.vortex/`, and the repository-root Markdown files. The configuration SHALL still declare a value that decodes to the stub sentinel, so a live stub remains detectable. Source and test files MAY contain the literal only at live stub call sites.

#### Scenario: Configuration declares the sentinel without its literal text

ID: SWHR-R-0248.01

- **GIVEN** the repository's `.vortex/config.yaml`
- **WHEN** its raw text is read and its `stubSentinel` value is decoded as a YAML double-quoted scalar
- **THEN** the raw text does not contain the literal sentinel, and the decoded value equals the stub sentinel

#### Scenario: Historical and generated documentation carries no literal sentinel

ID: SWHR-R-0248.02

- **GIVEN** every file under `artifacts/`, `openspec/` and `.vortex/`, plus the repository-root Markdown files, including closed sprints' platform-generated `SPRINT-PLAN.md` indexes
- **WHEN** each file is scanned for the literal sentinel
- **THEN** no file contains it

#### Scenario: A documentation file that quotes the sentinel is caught

ID: SWHR-R-0248.03

- **GIVEN** a Markdown file under `artifacts/` whose name is not `tdd-test-result.md` and whose text quotes the literal sentinel
- **WHEN** the repository's unit suite runs
- **THEN** the sentinel hygiene test fails and names that file

#### Scenario: The hygiene guard does not reintroduce the literal

ID: SWHR-R-0248.04

- **GIVEN** the source of the sentinel hygiene regression test
- **WHEN** it is scanned for the literal sentinel
- **THEN** it does not contain it, and the test still asserts against the decoded 20-character sentinel value

### Requirement: End-to-end browser matches the pinned test runner

ID: SWHR-R-0250

The project's pinned Playwright test runner SHALL expect the Chromium revision shipped in the standard QA/agent container (revision 1223), so that the end-to-end suite runs there without downloading a browser.

#### Scenario: Browser preflight passes in the standard container

ID: SWHR-R-0250.01

- **GIVEN** the standard QA/agent container, whose Playwright browser directory holds only Chromium revision 1223
- **WHEN** the end-to-end browser preflight runs
- **THEN** it exits successfully

#### Scenario: End-to-end suite runs against real Chromium

ID: SWHR-R-0250.02

- **GIVEN** the standard QA/agent container
- **WHEN** the full end-to-end suite runs
- **THEN** every spec under `e2e/` executes in Chromium and passes

### Requirement: End-to-end tests produce test evidence

ID: SWHR-R-0251

The project's configured test-evidence command SHALL run the end-to-end suite as well as the unit and integration suites, and SHALL write one JUnit report at the configured report path that holds the results of every tier that ran. Each end-to-end result MUST name its spec by repository path.

#### Scenario: End-to-end results appear in the evidence report

ID: SWHR-R-0251.01

- **GIVEN** an environment with the Playwright browser installed
- **WHEN** the test-evidence command runs
- **THEN** the report at the configured JUnit path holds a result for every end-to-end test, each attributed to its `e2e/…spec.ts` repository path, alongside every unit and integration result

#### Scenario: A failing unit test does not hide end-to-end results

ID: SWHR-R-0251.02

- **GIVEN** a failing unit test and a passing end-to-end suite
- **WHEN** the test-evidence command runs
- **THEN** the command exits non-zero and the report still holds the end-to-end results

#### Scenario: A failing end-to-end test fails the evidence run

ID: SWHR-R-0251.03

- **GIVEN** passing unit tests and one failing end-to-end test
- **WHEN** the test-evidence command runs
- **THEN** the command exits non-zero and the report records that end-to-end test as a failure

#### Scenario: No browser installed

ID: SWHR-R-0251.04

- **GIVEN** an environment without the Playwright browser
- **WHEN** the test-evidence command runs
- **THEN** the report holds the unit and integration results, the output states that the end-to-end tier was skipped, and the exit status reflects the unit and integration results only
