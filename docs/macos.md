# macOS

Use [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/), selecting the download for Apple silicon or Intel. Docker's system requirements and licensing apply separately. This release is not a signed/notarized `.app` or `.dmg`.

1. Start Docker Desktop.
2. Extract the release into a local directory such as `~/Projects/MeshTeam-PTT-Relay`. Avoid iCloud-synced Desktop/Documents for dependency and build data.
3. In Terminal, change to that directory and run:

```sh
sh scripts/relay.sh init
```

The first run creates `.env`. Set `RELAY_DOMAIN` to your DNS hostname and rerun `init`. Enter the matching HTTPS origin, group and owner display name. Keep the QR private. In another Terminal window:

```sh
sh scripts/relay.sh start
sh scripts/relay.sh status
```

Scan within 15 minutes in MeshTeam PTT. Follow [networking](networking.md) and the [Linux guide](linux.md) for group administration, updates and backups. Never delete Docker volumes as part of a routine update.

The Mac and Docker must stay running. Sleep and shutdown interrupt voice. Configure sleep/startup deliberately if you want continuous service. A dedicated Pi/Linux server is generally better for unattended operation. The [native Node.js alternative](native-node.md) avoids Docker but requires your own HTTPS proxy and process supervision.
