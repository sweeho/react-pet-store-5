## ADDED Requirements

### Requirement: End-to-end browser matches the pinned test runner

The project's pinned Playwright test runner SHALL expect the Chromium revision shipped in the standard QA/agent container (revision 1223), so that the end-to-end suite runs there without downloading a browser.

#### Scenario: Browser preflight passes in the standard container

- **GIVEN** the standard QA/agent container, whose Playwright browser directory holds only Chromium revision 1223
- **WHEN** the end-to-end browser preflight runs
- **THEN** it exits successfully

#### Scenario: End-to-end suite runs against real Chromium

- **GIVEN** the standard QA/agent container
- **WHEN** the full end-to-end suite runs
- **THEN** every spec under `e2e/` executes in Chromium and passes

### Requirement: End-to-end tests produce test evidence

The project's configured test-evidence command SHALL run the end-to-end suite as well as the unit and integration suites, and SHALL write one JUnit report at the configured report path that holds the results of every tier that ran. Each end-to-end result MUST name its spec by repository path.

#### Scenario: End-to-end results appear in the evidence report

- **GIVEN** an environment with the Playwright browser installed
- **WHEN** the test-evidence command runs
- **THEN** the report at the configured JUnit path holds a result for every end-to-end test, each attributed to its `e2e/…spec.ts` repository path, alongside every unit and integration result

#### Scenario: A failing unit test does not hide end-to-end results

- **GIVEN** a failing unit test and a passing end-to-end suite
- **WHEN** the test-evidence command runs
- **THEN** the command exits non-zero and the report still holds the end-to-end results

#### Scenario: A failing end-to-end test fails the evidence run

- **GIVEN** passing unit tests and one failing end-to-end test
- **WHEN** the test-evidence command runs
- **THEN** the command exits non-zero and the report records that end-to-end test as a failure

#### Scenario: No browser installed

- **GIVEN** an environment without the Playwright browser
- **WHEN** the test-evidence command runs
- **THEN** the report holds the unit and integration results, the output states that the end-to-end tier was skipped, and the exit status reflects the unit and integration results only
