# Verification and support scope

Release preparation: 20 October 2026.

- Core relay: 44 automated tests cover enrollment, auth, real WebSocket traffic, isolated groups, deferred delivery, expiry, revocation, TLS and HA administration. Run `npm test` for current results.
- Home Assistant OS: the preceding 0.1.4 runtime was deployed on ARM64 and the existing group with two phones reconnected. A 44-second live-only transmission was observed on 0.1.3/Android71. The new repository-install mechanism is distinct from that existing local app and must not be treated as an automatic migration.
- macOS: native Node tests run during preparation. Docker CLI is installed on the preparation Mac, but Docker Desktop was not running; local Docker deployment is not claimed.
- GitHub Actions: Linux, macOS and Windows Node tests; HA source parity; Windows PowerShell syntax; Linux container builds for AMD64 and ARM64. See the Actions page for actual results, not merely the workflow file.
- Windows/macOS: no signed native graphical installer and no physical desktop sleep/startup/firewall acceptance test yet.
- Mobile-data handover and physical-phone switching between two relay groups remain field-test items. Protocol integration tests do not replace those tests.

Do not interpret beta status or passing CI as an independent cryptographic audit or guaranteed call availability.
