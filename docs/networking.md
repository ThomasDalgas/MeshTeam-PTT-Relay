# Domain, HTTPS and networking

Phone connections are outbound HTTPS/WebSocket connections to the relay. Phones need internet access; they do not need direct LAN access to one another.

For the supplied standalone Compose setup:

- Point your DNS hostname at the server's reachable public IP.
- Set `RELAY_DOMAIN=relay.example.com` in `.env` and initialize groups with the same `https://relay.example.com` origin.
- Forward TCP 80 and 443 to the Docker host and allow them in the host firewall. Caddy uses public certificate validation and handles HTTPS renewal. Review [Caddy's automatic HTTPS documentation](https://caddyserver.com/docs/automatic-https) and the applicable certificate-authority terms before enabling it.
- If 80/443 are occupied, do not overwrite another service's rules. Use your existing HTTPS proxy instead. DNS validation is another option but requires separate DNS-provider configuration; the sample Compose file does not set that up.
- Keep 8788 private. HA built-in TLS instead uses its configured 8443 host mapping and can use DNS-issued certificates without public port 80.

Check `https://YOUR-HOST/health` from a phone with Wi-Fi switched off. It should return `{"status":"ok","protocol":3}` with no certificate warning. Then test two-way voice. A working health response on your home LAN does not prove mobile access or audio delivery.

CGNAT/double NAT, blocked outbound networks, router hairpin NAT and local DNS can affect connectivity. Do not solve this by disabling authentication or TLS. If the host sleeps, stops or loses connectivity, the relay is unavailable. Switching Wi-Fi/mobile networks may require reconnection; uninterrupted handover is not guaranteed.
