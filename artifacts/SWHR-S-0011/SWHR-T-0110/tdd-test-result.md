# TDD result — SWHR-T-0110

## Test cases

- SWHR-C-0271: an order enqueued in a rolled-back transaction is never delivered; a committed one sent alongside is stored, the rolled-back one is not.
- SWHR-C-0272: `enqueue` stubbed to throw inside a unit of work; the error reaches the caller, nothing from that unit persists, and a following unit of work commits and delivers.
- Extra: a committed order is stored once and a redelivery is a no-op; a malformed payload is not marked delivered; the plugin registers the consumer.

## Notes

- Red run id: 27f74b08-f7e4-45b9-bfd5-aac12c217058 (both cases assertion failures against the stub handler).
- Green run id: 7af14e92-d806-4463-b2eb-d0ed8edba08d (both pass).
- Full gate `bun run verify`: exit 0, 163 files, 807 tests passed.
