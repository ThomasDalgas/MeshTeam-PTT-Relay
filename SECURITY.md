# Security and data handling

Report suspected vulnerabilities privately to **funkoneinc@gmail.com**. Do not put working credentials, audio keys, private QR invitations or production registry files in public issues. This beta has not received an independent security audit.

Group phones share an audio key. The server receives authenticated ciphertext, not that key. Encryption does not hide metadata, and a relay operator with root access can copy RAM or ciphertext. It cannot guarantee deletion from an operator-controlled system. Swap, crash dumps, backups and reverse-proxy logs are separate operational concerns.

Only complete encrypted utterances lasting at most 30 seconds are retained for deferred delivery, for at most 15 minutes from their start. Longer live speech discards its stored prefix. Queues are RAM-only and cleared on restart; receipt is not proof of listening. Device names, group names, device public keys, membership and credential hashes persist in registry files. The public health endpoint does not expose them.

Use trusted HTTPS/WSS and keep the unencrypted 8788 upstream private. HA administration is restricted to ingress and must not be forwarded to the internet. Do not publish port 8099. Do not share HA administrator access to onboard phone users.

Private owner QR codes expire after 15 minutes. Phone-generated member invitations also include an audio key; treat them as credentials. Revocation prevents server access but cannot erase a key on a former member's phone. Create a new group with a fresh key when cryptographic exclusion is required. There is no automatic key rotation, owner-key recovery or ratchet.

Do not run multiple processes against a registry. The service is designed for small groups, not emergency communications or a guaranteed-availability public service.
