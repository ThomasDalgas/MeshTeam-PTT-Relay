# Native Node.js (advanced)

The relay core is portable Node.js and can run on Linux, macOS or Windows. This is a command-line process, not an installed OS service. Use Node.js 22 or newer and a trusted HTTPS reverse proxy capable of WebSocket upgrades.

From the repository root:

```sh
npm ci --omit=dev --ignore-scripts
npm run relay -- init --origin https://relay.example.com --name Team --owner Owner
npm start
```

Scan the printed owner QR within 15 minutes. The relay binds `127.0.0.1:8788` by default; point a local HTTPS reverse proxy to this address. Do not disable TLS validation on phones. The included Docker `Caddyfile` uses `relay:8788`, so for native deployment use a separate Caddy site with `reverse_proxy 127.0.0.1:8788`.

Optional environment variables: `HOST`, `PORT`, `RELAY_CONFIG`. On PowerShell set them with `$env:RELAY_CONFIG='C:\MeshTeamData\relay.json'`; on a POSIX shell use `export RELAY_CONFIG=/var/lib/meshteam-relay/relay.json`. Use a private directory writable only by the service user; on Windows set an appropriate NTFS ACL because POSIX file modes do not provide equivalent access control. Keep the whole registry directory and `.revoked` files together.

`npm run relay -- groups` lists IDs. Use `members --group GROUP_ID` and `revoke --group GROUP_ID --id MEMBER_ID` to manage a selected group. For `add-group`, stop the running process, run the command with the existing origin, then restart. Do not run multiple processes against the same data.

## Linux systemd example

After installing dependencies in `/opt/meshteam-relay`, create a dedicated `meshteam-relay` system user and writable data directory. Adjust the Node path for your installation. A suggested unit:

```ini
[Unit]
Description=MeshTeam PTT Relay
After=network-online.target
Wants=network-online.target

[Service]
User=meshteam-relay
Group=meshteam-relay
WorkingDirectory=/opt/meshteam-relay
Environment=HOST=127.0.0.1
Environment=PORT=8788
Environment=RELAY_CONFIG=/var/lib/meshteam-relay/relay.json
ExecStart=/usr/bin/node /opt/meshteam-relay/src/main.mjs
Restart=on-failure
UMask=0077
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/var/lib/meshteam-relay

[Install]
WantedBy=multi-user.target
```

Initialize the registry as that service user before starting the unit. Test with `node` in the foreground first. The repository does not automatically install a privileged service, alter the firewall or accept certificate-authority terms. Windows Task Scheduler and macOS launchd integration are not shipped/tested in this release.
