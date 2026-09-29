# TDD result — SWHR-T-0121

## Notes

Platform-recorded runs (linked cases SWHR-C-0306, -0307, -0308).

- Red run id: 7c220ac2-9359-4363-896f-48c9ab30e765 (all three cases fail on the stub).
- Green run id: e4a71a35-767e-4a63-8ec0-f5fc829c5f05 (all three pass).
- The test file was edited once after red: the supplier PO assertions changed from parsing with `readSupplierOrder` (the payload is the partner format, so the parse threw) to content checks. Assertions were not weakened.
