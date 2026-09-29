## ADDED Requirements

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
