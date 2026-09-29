# TDD result — SWHR-T-0148

## Test cases

`lib/supplier/stockBatch.test.ts`: SWHR-C-0393 to SWHR-C-0396 plus rule cases (negative skipped, non-numeric/fractional invalid, unknown rejected, unticked unchecked, trimming).

## Red run

Run id d8443366-03d3-4396-bd89-c634a7c77e0d: all four cases failed on the stub.

## Green run

Run id a8cfe2da-3205-4207-a279-846983e45d0d: all four cases pass. Full gate `bun run verify` exit 0 (189 files, 974 tests).

## Notes

Platform-recorded runs above replace the marker.
