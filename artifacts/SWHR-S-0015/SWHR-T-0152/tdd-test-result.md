# TDD result — SWHR-T-0152

## Test cases

- Unit: `src/pages/supplier/index.test.tsx` (SWHR-C-0404, logout), `inventory.test.tsx` (SWHR-C-0407, 0409, 0410, submit posts every row, 400/500 error, gate cases), `updated.test.tsx` (SWHR-C-0411).
- E2E: `e2e/supplier-inventory.spec.ts` (SWHR-C-0405, 0406, 0408, 0412).

## Red run

Run id 9c11e482-457b-4a71-8b49-e2bd7a40d5f8: unit cases failed on the stub, e2e cases on assertions.

## Green run

Run id 6cac4a92-ec2e-45cf-9e87-94e257bd2f7e: all nine cases pass. `bun run verify` exit 0 (194 files, 1001 tests); `bun run test:e2e` exit 0 (74 passed).

## Notes

Two edits followed the red run, both reported as modified_after_red: a type-only fix to the fetch mock signature in `index.test.tsx` (tsc rejected it), and `test.describe.configure({ mode: "serial" })` in the e2e spec because its tests share one stock table and raced when parallel. No assertion was changed.
