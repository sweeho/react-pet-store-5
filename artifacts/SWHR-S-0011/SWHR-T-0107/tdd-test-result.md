# TDD result — SWHR-T-0107

## Test cases

- SWHR-C-0280: duplicate counter name rejected, one row remains.
- SWHR-C-0281: stored total is 5150 (51.50) while lines sum to 40.00.
- SWHR-C-0282: stored shipping city stays "Palo Alto" after the profile city changes.
- Extra: persisting the same order id twice is a no-op.

## Notes

- Red run id: c1c0432d-412b-4626-bcfe-942063725124 (all three cases assertion failures).
- Green run id: 0bb8bcab-9297-4922-9c0a-77db1aa14b84 (all three pass).
- The first red attempts were refused: tests that imported missing tables errored, and committing the schema first counts as production code before red. The tests now read the tables through a namespace import and assert they exist, so a missing table fails an assertion.
- Full gate `bun run verify`: exit 0, 157 files, 777 tests passed.
