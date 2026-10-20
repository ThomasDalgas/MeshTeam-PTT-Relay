# MeshTeam PTT Relay

![MeshTeam PTT](ha/static/logo.svg)

A self-hosted voice relay for the **MeshTeam PTT Android app**. Run it on your own server when phones need to communicate over the internet, including networks that isolate Wi-Fi clients.

**Beta 0.1.5 · MIT licensed · Android 71 or newer recommended.**

| Platform | Installation | Interface |
| --- | --- | --- |
| Home Assistant OS | [Install as an app](docs/home-assistant.md) | Private dashboard inside HA |
| Linux / Raspberry Pi OS 64-bit | [Docker Compose](docs/linux.md) | Command line |
| Windows PC | [Docker Desktop with Linux containers](docs/windows.md) | PowerShell / command line |
| macOS, Apple silicon or Intel | [Docker Desktop](docs/macos.md) | Terminal |
| Existing Node.js server | [Native Node.js](docs/native-node.md) | Command line and your HTTPS proxy |

Windows and macOS are server deployments, **not signed graphical desktop installers**. The dashboard is currently provided by the Home Assistant app. See [verification and limitations](docs/verification.md) for what has actually been tested.

## Features

- Up to **8 separate groups**, with up to **6 phones per group**.
- The same phone can belong to multiple groups; Android selects **one active group at a time**.
- Private QR enrollment and owner-controlled participant invitations.
- End-to-end encrypted voice: audio keys stay on group phones, not on the relay.
- Complete messages of at most **30 seconds** can be delivered later for up to **15 minutes from the start of speech**.
- Longer live speech continues with compatible phones. Its entire retained prefix is discarded; long transmissions are live-only.
- Home Assistant dashboard: speaking participants, synced phone names, online status, RTT, estimated codec and queue/traffic statistics. Danish, English and Romanian.

This is an HTTPS/WebSocket relay, **not a VPN**, and does not automatically bridge Nearby groups to the internet. It supports open group conversation, not directed/private recipients or classic turn arbitration. A connected older phone keeps the legacy 30-second cap for that group's new transmissions.

## What you need

- A server that stays powered on and a reachable hostname with a valid HTTPS certificate.
- For the supplied Caddy deployment: DNS pointing to the server and inbound TCP 80/443. Existing trusted reverse proxies or DNS-validated certificates are alternatives.
- If your ISP uses CGNAT, ordinary router port forwarding may not work. Arrange a reachable host or your own VPN solution. Never bypass certificate checks.
- The Android app's **Full Access** on each participating phone. This repository's MIT license covers the relay only; it does not unlock or relicense the Android app. No hosted service is included.

## First installation

Choose the platform guide above. Home Assistant users can add this repository:

```text
https://github.com/ThomasDalgas/MeshTeam-PTT-Relay
```

[Add repository to Home Assistant](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2FThomasDalgas%2FMeshTeam-PTT-Relay)

The standalone Docker setup uses the same relay core. It creates a persistent membership volume and prints a private owner QR. Never publish invitation links or QR images. The owner joins first, then generates invitations for other phones from the app.

## Privacy and operations

The relay cannot decrypt audio with the information it receives. It can observe membership, device names, connection IP addresses, timing, frame sizes and encrypted traffic. See [security and data handling](SECURITY.md) and [the protocol](PROTOCOL.md).

Deferred audio is RAM-only and is lost when the process restarts. Membership and token hashes persist. Back up registries, including the `.groups` directory and revocation files; backups do not include phone-held audio keys. Each group has a 16 MiB ciphertext queue limit. Eight groups can therefore retain up to 128 MiB of encoded ciphertext, plus runtime overhead. Do not run multiple relay processes against the same registry.

## Development

Node.js 22 or newer and OpenSSL for TLS tests:

```sh
npm ci --ignore-scripts
npm test
node scripts/package-ha.mjs --check
```

Edit `src/` and `ha/` as the canonical source. Edit HA metadata in `packaging/ha/`, then run `node scripts/package-ha.mjs` to regenerate `meshteam_relay/`. CI checks parity so the installable HA package cannot silently drift from the main source.

[Changelog](CHANGELOG.md) · [Danish introduction](docs/README-da.md) · Support: funkoneinc@gmail.com
