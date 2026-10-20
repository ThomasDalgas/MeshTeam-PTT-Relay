# Linux and Raspberry Pi

Use a supported 64-bit OS (ARM64 on Raspberry Pi, AMD64 on a typical PC), Docker Engine and the Compose plugin. A 32-bit Pi OS is not supported by the published HA architectures. Install Docker using its [official Linux instructions](https://docs.docker.com/engine/install/).

Download a release archive or clone this repository, then open its root directory. Follow [HTTPS and networking](networking.md) before starting Caddy. Caddy obtains and renews certificates automatically; review the certificate authority's terms before enabling issuance.

```sh
sh scripts/relay.sh init
```

On the first run this copies `.env.example` to `.env` and stops. Set `RELAY_DOMAIN` to your hostname, without `https://`, then rerun the command. Enter the matching full HTTPS origin, your group name and owner display name. The initializer refuses to overwrite an existing registry.

Keep the private owner QR visible, then start the server in another terminal:

```sh
sh scripts/relay.sh start
sh scripts/relay.sh status
```

Scan the owner QR in the Android app within 15 minutes. Invite the other phones from the owner's app. Both Docker services restart after a host reboot if Docker itself is enabled at boot. Sleep, power loss or shutdown interrupts voice and clears queued messages.

## Administration

There is no standalone web dashboard in this release; the dashboard belongs to the HA app.

```sh
docker compose exec relay node src/cli.mjs groups
docker compose exec relay node src/cli.mjs members --group GROUP_ID
docker compose exec relay node src/cli.mjs revoke --group GROUP_ID --id MEMBER_ID
```

To add a group, stop the relay process before editing its registries; leave Caddy running:

```sh
docker compose stop relay
docker compose run --rm relay node src/cli.mjs add-group --origin https://relay.example.com --name Team2 --owner Owner
docker compose up -d relay
```

Use the same HTTPS origin as the existing groups. The new group has its own owner invitation and phone-held audio key. Stopping the relay loses its temporary audio queues. Phone profiles remain saved; select one active group under Saved groups in the Android app.

## Update and backup

Back up the `relay_data` Docker volume securely while the relay is stopped. Include `relay.json`, `relay.json.groups/` and `.revoked` files. Never commit the backup. Replace the source with the new release, then:

```sh
docker compose build --pull relay
docker compose up -d
```

Do not use `docker compose down -v`: it deletes membership and certificate volumes. To stop without deleting data use `docker compose stop`. Review [security](../SECURITY.md).
