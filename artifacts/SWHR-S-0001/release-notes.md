---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0001
idea: SWHR-I-0002
branch: vortex/sprint/swhr-s-0001-144fcba5
upstream: [artifacts/SWHR-S-0001/qa-test-report.md]
---

# Release notes — SWHR-S-0001

## Added

- Opening the store now shows a Pet Store home page. It has a hero, a "Shop by pet" grid for Birds, Cats, Dogs, Fish and Reptiles, and entry points to your account and to staff areas (order administration, supplier inventory). (SWHR-T-0005)
- Every page shares one header, with the store logo (which always leads home), a search box, Account, Cart, Sign in and the English / 日本語 / 中文 labels. Every page also shares the Pets navigation and one footer. (SWHR-T-0006)
- On narrow screens the navigation folds behind a menu button and opens as a panel with the same entries. (SWHR-T-0006)
- Pages that have nothing to show, pages that fail to load and pages that are still loading now look the same everywhere. A failed page offers **Try again** and a link home. A missing page shows "Page not found" in the same frame. (SWHR-T-0007)

## Changed

- The store is branded "Pet Store" throughout, including the browser tab title. It now uses the Preline colours and the Inter / Noto Sans JP / Noto Sans SC fonts. (SWHR-T-0004)
- The starter template's marketing home page and its About and Users demo pages are gone. (SWHR-T-0004, SWHR-T-0005)

## Not included

- Search, Cart, Checkout, Account, Sign in, the pet category pages, order administration and supplier inventory lead to "Coming soon" placeholder pages. Each starts working when its own capability ships.
- The language labels are visible but do not switch the language yet. That arrives with the localization capability.
- The persistent Pets sidebar drawn in the mockups was not built. The same categories appear in the header navigation instead.

## Verification

Verified at integration QA (PASS, 0 defects). See `artifacts/SWHR-S-0001/qa-test-report.md`.

## Compliance / Control Evidence

| Control                      | Evidence        | Location                                  | Status    | Exception |
| ---------------------------- | --------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded    | this file       | `artifacts/SWHR-S-0001/release-notes.md`  | Satisfied | —         |
| Release verified before land | QA PASS verdict | `artifacts/SWHR-S-0001/qa-test-report.md` | Satisfied | —         |
