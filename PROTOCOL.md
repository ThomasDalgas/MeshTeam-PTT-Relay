# Relay v3 wire contract

All production requests use HTTPS/WSS with trusted certificates. JSON responses use `Cache-Control: no-store`. Native-client endpoints reject browser Origin headers. Authentication is `Authorization: Bearer <43-character base64url random32 token>`. Tokens, invite secrets and retry nonces are SHA-256 hashed at rest. Public keys are canonical base64 DER P-256 SubjectPublicKeyInfo; membership ID is the first16hex of SHA-256 of decoded DER. There is no public-key proof-of-possession protocol in v1; enrollment requires the secret invitation and requests thereafter require the bearer.

## Enrollment

`POST /v1/enroll`, JSON `{invite, deviceKey, enrollmentNonce}`. `enrollmentNonce` is a client-generated random32byte base64url43 secret persisted before the first request; never include it in a shared invitation. The first redemption binds its hash and device key. Retries require exactly that pair before the invitation's original expiry and return a new token, invalidating the previous token. Different devices/nonces, expired or revoked redemption records reject. Return:

```json
{"token":"...","id":"16hex","owner":true,"groupId":"16hex","groupName":"Workshop","participants":[{"id":"16hex","name":"Thomas"}]}
```

`POST /v1/invites` bearer owner only, JSON `{name}` (nonempty max64, no control characters). Return `{invite,expiresAt}` (Unix milliseconds; 15 minutes). No key is accepted or returned. Six active members maximum, invitations reserve available capacity.

`GET /v1/profile` bearer returns enrollment metadata without token. `GET /health` unauthenticated returns `{status:"ok",protocol:3}`.

Bootstrap QR: `meshteam://relay?v=1&server=<percent-encoded https origin>&invite=<secret>`. Owner creates a random32byte group audio key locally. Subsequent member QR appends `#key=<base64url32 audio key>` on the owner phone. Never send this fragment/key to HTTP endpoints. Enrollment HTTP bodies are limited to2048bytes.

## WebSocket

`/ptt`, bearer and `X-PTT-Protocol: 3`. One socket per member. Server hello:

```json
{"type":"hello","protocol":3,"id":"16hex","groupId":"16hex","groupName":"Workshop","mode":"free","members":["connected IDs"],"participants":[{"id":"16hex","name":"Thomas"}]}
```

`members` updates contain connected IDs plus all active enrolled participants. Sender `begin {id}` requires `<13-digit Unix milliseconds>-<lowercase UUID>` generated immediately before transmission. Stale (>15minutes), future (>120seconds) and repeated IDs reject. Any nonempty or malformed `recipients` field rejects. Server returns `grant {id,sender,order,mode:"free"}` then broadcasts `start {id,sender,order,mode:"free",delivery,nextSeq:0}`. Use grant metadata unchanged as AES-GCM AAD. IDs are unique until expiry; order increases within the process and may reset on restart.

Sender `frame {id,seq,data}`: seq starts0 and increases exactly1; data is canonical base64 of352bytes (324byte ADPCM +12nonce +16GCMtag) or1308bytes (1280PCM +28envelope). Server adds sender/order unchanged. Sender `end {id,seq,data}`: seq equals framecount>=1, data is canonical base64 of28bytes, authenticated empty payload. Server sends `accepted {id}` to sender and `end {id,sender,order,seq,data}` to live recipients. Legacy capture is limited to750frames and32seconds. Updated Android sends `X-PTT-Extended-Live: 1`; when all currently connected peers support it, `grant.maxFrames` is1000000000 instead of750. Clients default to750 with older servers. Above750frames or30seconds elapsed, the relay deletes the entire retained prefix, sends `live_only {id}`, and forwards subsequent frames without retaining ciphertext. Only complete messages <=750frames and <=30seconds are deferred. Inactivity5seconds still aborts; long active streams are separate from the expiring message queue. `accepted.liveOnly` indicates no deferred copy. Receivers discard local replay capture on `live_only` or frame750. `cancel` discards sender's active utterance. `abort/rejected {id,reason}` identify failures; generic errors use `{type:"error",reason}`. Socket max incoming4096bytes.

Existing Android crypto format: nonce12bytes || ciphertext || GCMtag16bytes; AES-256-GCM AAD UTF-8 `teamptt-v1|id|sender|order|seq|audio` (or `end`). Server cannot authenticate ciphertext and only validates envelope length/sequence. Phones authenticate before playing/acknowledging.

## Deferred delivery

On connection, completion and client `{type:"backlog"}`, server sends:

```json
{"type":"backlog","messages":[{"id":"...","sender":"16hex","order":1,"frames":3,"expiresAt":1800000900000}]}
```

Only complete pending utterances for that enrolled recipient appear. `{type:"fetch",id}` returns `{type:"deferred",id,sender,order,frames:[base64...],end:base64,expiresAt}`. The end sequence is `frames.length`. Receipt `{type:"received",id}` deletes that recipient's pending claim; when all acknowledge the ciphertext is removed. Receipt of incomplete/unintended IDs does nothing. Expiry is min(serverbegin+15minutes, authenticated clientIDtimestamp+15minutes), additionally bounded by monotonic elapsed time. Fetching or finishing never extends expiry. Frame arrays are bounded750; queue16MiB;256messages. Whole deferred messages can be about1.31MiB; Android's receive cap must permit this. Fetch rate6/sec and bounded outgoing buffers disconnect slow consumers.

Server emits live end before backlog on the same ordered socket; backlog can precede the returning client receipt. Clients must deduplicate a message already accepted live and serialize/debounce fetch requests. A reconnect during speech cannot receive partial orphan frames but can fetch the complete utterance afterward. Frozen recipients include offline enrolled devices, never members enrolled after begin. Sender has no pending self-copy. Repeated fetch is allowed while pending, until receipt/expiry.

`playback_idle` is accepted as a no-op. `set_mode` supports only free; other modes receive `mode_rejected`. No private/directed relay speech, mixed transports, public admin endpoints, plaintext audio, server-held audio key, persistent audio, or automatic key rotation in v1.

Authenticated `profile {name}` updates only the bearer-authenticated member name (1–64 characters, no controls), persists it and broadcasts the roster. Android sends its current device name after hello and on rename. Names are display labels, not proof of identity.


### Multiple groups (relay 0.1.4)

Wire protocol remains v3. Invitation tokens route enrollment to one group; bearer tokens route HTTP and WebSocket traffic to one group. No client-supplied group ID grants or changes access. The same P-256 device key may enroll independently in different groups, obtaining distinct bearer tokens and group audio keys. Socket and queue maps are scoped per group, so identical device IDs cannot collide across groups. Legacy single-group registry and Android 71 profiles remain valid. The Android client selects one saved group at a time. Acknowledgments, retrieval, revocation and live-duration capability negotiation are confined to that group.
