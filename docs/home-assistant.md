# Home Assistant OS app

Requires Home Assistant OS/Supervisor with apps (formerly add-ons), on AMD64 or ARM64. Home Assistant Container/Core alone does not provide this app installation system.

1. Open **Settings → Apps → Install app** (older versions: Add-on Store).
2. Open the store menu → **Repositories**, add:

   `https://github.com/funkoneinc/MeshTeam-PTT-Relay`

3. Find **MeshTeam PTT Relay** and install it. The first install builds the image locally and may take a few minutes.
4. Start it and open the web UI. Follow the built-in installation guide to configure a domain, HTTPS and router access.
5. Configure `public_origin` and, for built-in TLS, `tls_enabled: true`. Provide the certificate files `/ssl/meshteam-fullchain.pem` and `/ssl/meshteam-privkey.pem`, for example using the official Duck DNS app. Follow the certificate authority's terms and renewal setup. The relay does not register a DuckDNS account for you.
6. Map container `8443/tcp` to your chosen HA host port, then forward your public HTTPS port to it. Leave `8788/tcp` disabled unless using a separate trusted reverse proxy. Never expose admin port 8099 or HA port 8123 for relay users.
7. Create a group in the dashboard, scan the owner QR in MeshTeam PTT and invite other phones from that owner's app. Add more groups using **Create another group**. Each phone selects one active saved group at a time.

Read the [full app documentation](../meshteam_relay/DOCS.md). The dashboard is private HA ingress, with Danish, English and Romanian UI. The relay requests no Home Assistant API credentials. Membership persists in the app's private `/data` storage; audio queues do not survive restart.

## Existing local app installation

A repository-installed app has a different Supervisor slug from a manually installed `local_meshteam_relay` app. **Adding this repository does not automatically migrate your local app or its private data.** Keep the existing app running until a deliberate backup/migration is planned. Do not uninstall it or start a second app using the same host port. This first public release does not silently copy production groups.

For a fresh installation, create new groups. For continuity, back up the existing app and migrate its full registry plus `.groups` directory and revocation files through an administrator-controlled process while both relay processes are stopped. Restore the same origin and certificate configuration. Do not post the backup in a GitHub issue.
