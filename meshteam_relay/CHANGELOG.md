## 0.1.5

- First standalone public MIT release and installable Home Assistant repository.
- Linux/Raspberry Pi, Windows and macOS installation guides and Docker helpers.
- Multi-group relay runtime from 0.1.4; existing group format remains compatible.

## 0.1.4

- Host up to eight isolated groups on one HTTPS address, with up to six phones per group.
- Group selector and creation in Danish, English and Romanian. Deleting one group preserves all others.
- Existing group, invitations and credentials are preserved; the same phone may enroll in several groups and select one active group in the Android app.
- Separate audio queues, authorization, connections, telemetry and live-voice negotiation per group.

## 0.1.3
- MeshTeam PTT branding and app logo; Danish, English and Romanian dashboard.
- Device names sync from Android version 71+.
- Confirmed group deletion and fresh enrollment.
- Extended live speech; only complete transmissions up to 30 seconds are deferred.
- Legacy connected clients retain the 30-second capture limit.

## 0.1.2

- Live speaking status, private connection telemetry and queue diagnostics.
- Guided DuckDNS/TLS and router setup using the configured address and user preferences.
- Clear distinction between network RTT, estimated codec and actual audio latency.

## 0.1.1

- Optional built-in HTTPS/WSS on 8443 using read-only DuckDNS certificates.
- Automatic validated certificate reload without interrupting active voice sockets.
- Root-only certificate copier; relay and ingress continue running unprivileged.

# Changelog

## 0.1.0

- Initial experimental Home Assistant OS app for the shared MeshTeam Relay v1 engine.
- Administrator ingress page for setup, private owner QR, status and revocation.
- Separate relay upstream for trusted HTTPS/WSS termination.
- Ciphertext-only deferred queue in RAM, expiring within 15 minutes.
