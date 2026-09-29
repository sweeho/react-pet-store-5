# PLAN — SWHR-T-0064: green stub-sentinel scan false-positives on config and prose

Change: `swhr-s-0006-bugfix-swhr-t-0023-swhr-t-00`. Read `openspec/changes/swhr-s-0006-bugfix-swhr-t-0023-swhr-t-00/design.md` §D3 first.

## Objective

The scanner lives in the platform, not in this repository. This ticket applies the repo-side mitigation so that no non-stub file in the repo contains the literal sentinel text. The durable scanner fix is follow-up F1 in the change's proposal.md.

## Steps

1. Re-encode the `testEvidence.stubSentinel` value in `.vortex/config.yaml` exactly as design.md §D3 specifies. Confirm with a YAML parser that it still decodes to the original value.
2. Reword every literal mention in `artifacts/**/tdd-test-result.md` to "the configured stub sentinel". Grep the whole repo, excluding `node_modules`, to confirm the only remaining occurrences are live stub call sites (none are expected on the base).
3. Append the agent note to `.vortex/agents-generated.md` (design.md §D3).
4. In this ticket's own artifacts and work log, refer to the sentinel only indirectly.

## File/module ownership

- `.vortex/config.yaml` (the `stubSentinel` line only)
- `artifacts/SWHR-S-0003/**/tdd-test-result.md`, `artifacts/SWHR-S-0004/**/tdd-test-result.md`, `artifacts/SWHR-S-0005/**/tdd-test-result.md` (reworded sentences only)
- `.vortex/agents-generated.md` (one appended line)

## Definition of Done

AC-1 through AC-4 on the ticket hold.
