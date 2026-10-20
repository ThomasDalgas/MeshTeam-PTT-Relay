# Windows PC

This release runs as a server using **Docker Desktop in Linux-container mode**. It is not an MSI/EXE desktop app. See Docker's [supported Windows versions and WSL requirements](https://docs.docker.com/desktop/setup/install/windows-install/). Docker Desktop has separate licensing terms; the relay's MIT license does not change them.

1. Install and start Docker Desktop. Complete its own WSL setup if required.
2. Download and extract a relay release into a local folder, preferably outside OneDrive.
3. Open PowerShell in the extracted folder and run:

```powershell
.\scripts\relay.ps1 init
```

The first run creates `.env` and stops. Edit `RELAY_DOMAIN` to your public DNS hostname, then rerun `init`. Supply the matching full HTTPS origin, group name and owner name. Keep the private QR visible and run in a second PowerShell window:

```powershell
.\scripts\relay.ps1 start
.\scripts\relay.ps1 status
```

Scan the QR in MeshTeam PTT within 15 minutes. If local policy prevents running `.ps1`, do not disable system-wide execution policy: use the equivalent `docker compose` commands in the [Linux guide](linux.md). For the initial `.env`, use `Copy-Item .env.example .env`.

Follow [networking](networking.md), including Windows Firewall rules for the chosen public HTTP/HTTPS ports. Do not expose 8788 or 8099. Docker Desktop and the PC must remain running; a sleeping or powered-off PC cannot relay voice. Check Docker startup after reboot rather than assuming it runs before sign-in.

Use the same administration, backup and update commands as the Linux guide. Native Node.js is an [advanced alternative](native-node.md). CI tests the Node runtime and PowerShell syntax on Windows; this does not constitute a physical Windows/Docker Desktop/router test.
