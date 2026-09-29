# SWHR-T-0148 summary

Added pure `planStockBatch` (P2) in `lib/supplier/stockBatch.ts`: ticked, non-blank rows only; negatives skipped; non-numeric/fractional rows and unknown items reject the whole batch; zero is an update.

Files: `lib/supplier/stockBatch.ts`, `lib/supplier/stockBatch.test.ts`.

AC coverage: AC-1..4 by SWHR-C-0393..0396; AC-5 by the interface and rule tests. No UI in this ticket.

Verification: `bun run verify` passed (lint, typecheck, 974 tests).
