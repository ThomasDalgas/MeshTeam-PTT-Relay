# MeshTeam PTT Relay på Home Assistant OS

MeshTeam PTT Relay forbinder telefoner over internettet, også når et gæstenet blokerer direkte trafik mellem telefonerne. Administratoren bruger Home Assistant; telefonerne bruger relæets separate HTTPS-adresse. Lyd dekrypteres kun på telefonerne.

## 1. Installer appen

Pakken understøtter Home Assistant OS på 64-bit Raspberry Pi (`aarch64`) og x86-64 (`amd64`). Tilføj dette repository under **Indstillinger → Apps → Installer app → Repositories**:

```text
https://github.com/funkoneinc/MeshTeam-PTT-Relay
```

Installer **MeshTeam PTT Relay**, start appen og åbn webinterfacet som Home Assistant-administrator. Første build kræver internet til container- og pakkeregistre. Der kræves ingen Home Assistant-adgangstoken i relæet.

En tidligere manuelt installeret lokal app har en anden identitet end repository-appen. Tilføjelsen migrerer ikke dens private data. Bevar den gamle app, tag backup og planlæg migration særskilt; start ikke to relæer på samme port.

For udviklere: `node scripts/package-ha.mjs` genererer den komplette `meshteam_relay/`-mappe fra fælles kildekode. Brug `--check` til at kontrollere, at pakken er opdateret.

## 2. Vælg adresse og netværk

Åbn installationsguiden i relæets webside. Den bruger den konfigurerede relæadresse. Indtast Home Assistants faste lokale IPv4-adresse og den værtsport, du vil bruge. Guidevalgene er vejledning; de ændrer ikke automatisk DNS, router eller Home Assistant. Et eksempel er ekstern TCP 443 til en lokal værtsport 8443. Din routers IP-adresse og Home Assistants IP-adresse er forskellige felter.

Reservér Home Assistants lokale IP i routerens DHCP-indstillinger, så portreglen fortsat rammer den rigtige maskine. Hvis 443 allerede bruges af en anden tjeneste, må dens regel ikke overskrives. Vælg en anden ekstern port eller brug en korrekt konfigureret reverse proxy. En ekstern port 9443 betyder, at telefonernes adresse skal slutte med `:9443`. Et skift af en eksisterende gruppes adresse kræver en særskilt migration; guidevalgene flytter ikke tilmeldte telefoner.

## 3. DuckDNS og certifikat

Har du allerede et domæne og en HTTPS-proxy, kan du bruge den; se alternativet nedenfor. For gratis DuckDNS:

1. Log ind på [DuckDNS](https://www.duckdns.org/) og registrér et ledigt underdomæne.
2. Installer den officielle **Duck DNS**-app i Home Assistant.
3. Indsæt dit fulde DuckDNS-domæne og dit token i Duck DNS-appens konfiguration. Tokenet er en hemmelighed; det skal ikke indtastes i relædashboardet eller deles i screenshots.
4. Vælg filnavnene `meshteam-fullchain.pem` og `meshteam-privkey.pem`. Relæets indbyggede HTTPS bruger netop disse filer under `/ssl`.
5. Læs og accepter [Let’s Encrypts abonnentaftale](https://letsencrypt.org/repository/) og sæt først derefter `accept_terms` til `true` i Duck DNS-appen.
6. Start Duck DNS og kontrollér loggen for afsluttet certifikatudstedelse. Behold start ved opstart slået til, så DNS og certifikat løbende opdateres.

Denne skabelon er **ikke klar til brug**, før domæne/token er erstattet, og vilkårene er accepteret:

```yaml
domains:
  - DIT-DOMAENE.duckdns.org
token: DIT-PRIVATE-DUCKDNS-TOKEN
aliases: []
lets_encrypt:
  accept_terms: false
  algo: secp384r1
  certfile: meshteam-fullchain.pem
  keyfile: meshteam-privkey.pem
seconds: 300
```

DuckDNS-certifikatet valideres via DNS. Certifikatudstedelse er ikke i sig selv bevis for, at telefonerne kan nå din router. Denne opsætning kræver ikke ændringer i Home Assistant Cores egen HTTP-konfiguration.

## 4. Aktivér relæets HTTPS

Når certifikatet findes, sæt `tls_enabled: true` i MeshTeam PTT Relay-appens konfiguration. Angiv `public_origin` som den **eksterne HTTPS-adresse uden sti**. Den er et forslag til den første gruppe; ændring af feltet flytter ikke en eksisterende gruppe.

Under appens Netværk skal containerport **8443/tcp** mappes til den værtsport, du valgte i guiden, normalt **8443**. Lad **8788/tcp** være deaktiveret. Gem og genstart kun MeshTeam PTT Relay. Åbn relæets webside og opret gruppen med det samme HTTPS-domæne som certifikatet.

SSL-mappen er skrivebeskyttet. En begrænset root-proces kopierer kun certifikatparret til en beskyttet, midlertidig mappe. Relæet og webadministrationen kører uden root. Nye gyldige certifikater indlæses inden for cirka 60 sekunder uden at afbryde eksisterende taleforbindelser. Ugyldige fornyelser afvises; manglende eller ugyldige filer ved opstart stopper TLS-opstarten.

## 5. Åbn præcis én port på routeren

Generér først reglen i webguiden med dine egne værdier. En typisk regel er:

| Routerfelt | Værdi |
| --- | --- |
| Navn | MeshTeam PTT Relay HTTPS |
| Protokol | TCP |
| Ekstern/WAN-port | 443 (eller porten i din HTTPS-adresse) |
| Intern/Forward IP | Home Assistants reserverede lokale IP |
| Intern/Forward-port | Den valgte værtsport, normalt 8443 |
| Kilde | Alle, hvis telefonerne skal kunne bruge skiftende mobilnet |

**UniFi:** Åbn Network → Settings. Find **Port Forwarding** i oversigten, eller søg efter den, og vælg **Create New**. Vælg den WAN-forbindelse, der modtager trafik til dit domæne. Udfyld **WAN Port**, **Forward IP Address**, **Forward Port** og **TCP** efter guidens værdier. Gennemse reglen før **Add**. Menunavne varierer mellem versioner.

**Andre routere:** Funktionen hedder ofte *Port Forwarding*, *NAT*, *Virtual Server* eller *Port Mapping*. Felterne svarer til tabellen. Følg producentens vejledning; slå ikke DMZ til. Åbn ikke relæets ukrypterede 8788, administrationsport 8099 eller Home Assistants 8123 som del af denne opsætning. Guiden ændrer ingen routerregler automatisk.

Sammenlign WAN-adressen i routeren med domænets offentlige IP. Privat WAN-adresse (`10.x`, `172.16–31.x`, `192.168.x`) eller `100.64.0.0/10` kan betyde dobbelt NAT/CGNAT. En regel på din egen router er da ikke nødvendigvis nok. Ved egen upstream-router kan en tilsvarende viderestilling være nødvendig dér; ved udbyderens CGNAT skal du aftale offentlig adresse eller vælge en særskilt VPN-løsning. Relæet omgår ikke disse begrænsninger.

## 6. Kontrollér fra mobilnet og tilmeld telefonerne

Slå Wi-Fi fra på én telefon og åbn din relæadresse med `/health` til sidst. Browseren skal vise `status: ok` uden certifikatadvarsel. En vellykket test fra hjemmets Wi-Fi kan skyldes NAT-loopback og beviser ikke mobiladgang. Hvis mobilnet virker, men hjemme-Wi-Fi fejler, undersøges routerens NAT-loopback eller lokal DNS.

Åbn webadministrationen og vælg **Vis ejerens QR-kode**. Hvis den er udløbet, kan du lave en ny ejerinvitation, så længe ingen telefon er tilmeldt. Scan den i Android-appens **Indstillinger → Forbindelse → Internet · eget relæ**. Android skal være version 64 eller nyere med gyldig fuld adgang. Ejeren opretter derefter invitationer til de andre deltagere på sin telefon. QR-koder er private og udløber efter 15 minutter.

Test tale begge veje, en offline modtager og efterlevering. Et grønt serverhelbred beviser ikke, at mikrofon, lydrute eller alle telefoners købsadgang er i orden.

## Sådan læses dashboardet

- **Taler nu** betyder, at relæet modtager en aktiv taletransmission. Det beviser ikke, at en mikrofon indeholder hørbar tale, eller at en modtager har afspillet den.
- **RTT** måler WebSocket ping/pong mellem relæ og telefon. Det er ikke envejsforsinkelse eller samlet mikrofon-til-højttaler-forsinkelse. En manglende eller gammel måling vises som sådan.
- **Codec-estimat** udledes af længden på de krypterede lydpakker i den aktuelle protokol. Relæet læser ikke den krypterede codec-header. Ukendte eller blandede pakker må ikke præsenteres som en sikker codec-identifikation.
- **Trafik** er applikationsdata, ikke total netværkstrafik inklusive TLS/IP. Tallene og målingerne nulstilles ved genstart.
- **Kø** er krypterede beskeder til efterlevering. En kvittering er modtagelse, ikke bevis for at en person har hørt beskeden.

Talestatus og tekniske målinger findes kun i den private Home Assistant-administration. `/health` afslører ingen deltagernavne eller statistik. Relæet gemmer ikke en historik over samtaler eller målinger.

## Drift og begrænsninger

Op til seks deltagere. Android version 71+ kan fortsætte live efter 30 sekunder. Hele den gemte begyndelse slettes, når grænsen overskrides; lange transmissioner kan ikke efterleveres. Kun hele beskeder på højst 30 sekunder gemmes til efterlevering i højst 15 minutter fra talestart. Hvis en tilsluttet telefon bruger en ældre version, gælder 30-sekundersgrænsen stadig for nye transmissioner. Køen ligger kun i RAM og slettes ved genstart/opdatering. Lydnøgler forbliver på telefonerne. Den private medlemsregistrering indeholder navne, offentlige enhedsnøgler og hashes af adgangsoplysninger. Backups af appen er private.

Tilbagekaldelse stopper en telefons adgang til relæet, men sletter ikke en lydnøgle, telefonen allerede har kendt. Der kræves en ny gruppe med ny nøgle for kryptografisk udelukkelse. Opdater appen med backup og bevaret `/data`; afinstaller ikke for at opdatere.

### Alternativ: eksisterende reverse proxy

Behold `tls_enabled: false`, hvis TLS afsluttes af en betroet HTTPS-proxy. Forward HTTP og WebSocket til `local-meshteam-relay:8788` på Home Assistants interne app-netværk. En proxy på en anden LAN-maskine kræver en særskilt, begrænset lokal portmapping. Publicér aldrig det ukrypterede upstream-endpoint. Certifikatets automatiske fornyelse og reload skal håndteres af proxyen; en engangsimport af et certifikat er ikke automatisk fornyelse.

## Officielle vejledninger

- [Duck DNS-app: opsætning og automatisk fornyelse](https://github.com/home-assistant/addons/blob/master/duckdns/DOCS.md)
- [UniFi: Port Forwarding](https://help.ui.com/hc/en-us/articles/235723207-UniFi-Gateway-Port-Forwarding)
- [Home Assistant: app-konfiguration](https://developers.home-assistant.io/docs/add-ons/configuration/)

## Sprog, navne og nulstilling

Dashboardets sprogvælger tilbyder dansk, engelsk og rumænsk og husker valget i browseren. Android version 71+ sender telefonens enhedsnavn til relæet ved tilslutning og efter navneændringer. Invitationsnavnet bruges kun, indtil telefonen har sendt sit navn.

Under **Slet gruppe og start forfra** kræves gruppens præcise navn og en ekstra bekræftelse. Alle forbindelser lukkes, register og invitationer slettes, og køen tømmes. Telefonernes lokale profiler bliver liggende, men virker ikke længere. Opret en ny gruppe og tilmeld alle med nye QR-koder. Denne handling kan ikke fortrydes i dashboardet.


## Flere grupper / Multiple groups (0.1.4)

Relæet understøtter op til 8 samtidige, adskilte grupper med op til 6 telefoner i hver gruppe. Alle deler samme HTTPS-adresse, certifikat og portregel. En telefon kan være medlem af flere grupper, men Android-appen har én aktiv gruppe ad gangen.

1. Vælg **Opret en ekstra gruppe** på dashboardet og angiv gruppens og ejerens navn.
2. Scan ejerens QR-kode i appen, også selvom telefonen allerede er med i en anden gruppe.
3. Opret deltagernes invitationer fra ejerens telefon i den valgte gruppe. Hver gruppe har sin egen lydnøgle.
4. Skift på telefonen via **Indstillinger → Internet · eget relæ → Gemte grupper**. Den tidligere forbindelse afbrydes ved skift. Korte beskeder til en allerede tilmeldt, frakoblet telefon kan efterleveres ved tilbagevenden inden for 15 minutter.
5. Vælg en gruppe øverst i dashboardet for at se dens deltagere, tale og kø. Sletning og tilbagekaldelse gælder kun den valgte gruppe.

Den eksisterende `relay.json` bevares uden omskrivning ved opgradering. Ekstra grupperegistre ligger i `relay.json.groups/`; backup og gendannelse skal inkludere begge samt eventuelle `.revoked`-filer. Invitationernes hemmeligheder er fortsat kun midlertidigt i hukommelsen. Lydkøer er separate og begrænset til 16 MiB per gruppe (højst 128 MiB samlet ciphertext ved 8 grupper, plus drifts-overhead). Køerne mistes ved relægenstart.

Standalone CLI: `npm run relay -- groups`, `npm run relay -- add-group --origin https://relay.example.com --name Team2 --owner Owner` (genstart derefter standalone-serveren), samt `members --group GROUP_ID` eller `revoke --group GROUP_ID --id MEMBER_ID`. Brug HA-dashboardet til ændringer på HA-installationen; rediger ikke registrene manuelt.
