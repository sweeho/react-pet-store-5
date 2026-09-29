## 1. Shell area labels follow the session locale

- [ ] 1.1 Resolve Global navigation area labels from the shell screen by area id and add the `checkout` shell key in en_US/ja_JP/zh_CN (SWHR-T-0023)
- [ ] 1.2 Drop the display-only `label`/`sampleBreeds` fields from the navigation constants and update their unit-test consumers (SWHR-T-0023)
- [ ] 1.3 Add regression coverage for ja_JP/zh_CN area labels, the ja_JP Pets menu and the ja_JP category heading (SWHR-T-0023)

## 2. Development server runs under Bun

- [x] 2.1 Make the dev script force the Bun runtime (SWHR-T-0050)
- [x] 2.2 Start the Playwright web server through the dev script so DB-backed E2E specs cover it (SWHR-T-0050)

## 3. Stub-sentinel false positives (repo-side mitigation)

- [x] 3.1 Declare the stub sentinel in config without its literal text and reword literal mentions in historical test-result artifacts (SWHR-T-0064)
- [x] 3.2 Add the "do not quote the sentinel literally" note for agents (SWHR-T-0064)
