"use strict";
const relayTranslations = {
 "Sprog": {
  "en": "Language",
  "ro": "Limbă"
 },
 "Dit private talerelæ · Home Assistant": {
  "en": "Your private voice relay · Home Assistant",
  "ro": "Releul tău privat de voce · Home Assistant"
 },
 "Henter status…": {
  "en": "Loading status…",
  "ro": "Se încarcă starea…"
 },
 "Venter på status fra relæet.": {
  "en": "Waiting for relay status.",
  "ro": "Se așteaptă starea releului."
 },
 "Opret din relægruppe": {
  "en": "Create your relay group",
  "ro": "Creează grupul releului"
 },
 "Brug installationsguiden nedenfor til adresse, certifikat og router. Opret derefter gruppen på den HTTPS-adresse, telefonerne skal bruge.": {
  "en": "Use the installation guide below for the address, certificate and router. Then create the group using the HTTPS address the phones will connect to.",
  "ro": "Folosește ghidul de instalare de mai jos pentru adresă, certificat și router. Apoi creează grupul folosind adresa HTTPS la care se vor conecta telefoanele."
 },
 "Relæets HTTPS-adresse": {
  "en": "Relay HTTPS address",
  "ro": "Adresa HTTPS a releului"
 },
 "Gruppenavn": {
  "en": "Group name",
  "ro": "Numele grupului"
 },
 "Ejerens navn": {
  "en": "Owner name",
  "ro": "Numele proprietarului"
 },
 "Opret gruppe": {
  "en": "Create group",
  "ro": "Creează grupul"
 },
 "GRUPPEN": {
  "en": "GROUP",
  "ro": "GRUP"
 },
 "End-to-end-krypteret tale": {
  "en": "End-to-end encrypted voice",
  "ro": "Voce criptată end-to-end"
 },
 "Venter på talestatus": {
  "en": "Waiting for voice status",
  "ro": "Se așteaptă starea transmisiei"
 },
 "Viser aktive transmissioner modtaget af relæet.": {
  "en": "Shows active transmissions received by the relay.",
  "ro": "Afișează transmisiile active primite de releu."
 },
 "Telefoner online": {
  "en": "Phones online",
  "ro": "Telefoane online"
 },
 "Tilmeldte telefoner": {
  "en": "Enrolled phones",
  "ro": "Telefoane înregistrate"
 },
 "Beskeder i kø": {
  "en": "Queued messages",
  "ro": "Mesaje în așteptare"
 },
 "Hvad betyder talestatus og køen?": {
  "en": "What do voice status and the queue mean?",
  "ro": "Ce înseamnă starea transmisiei și coada?"
 },
 "“Sender tale” betyder, at telefonen sender en aktiv transmission gennem relæet. Det er ikke en måling af mikrofonens lydniveau. Relæet kan hverken aflytte eller dekryptere lyden.": {
  "en": "“Transmitting” means that the phone is sending an active transmission through the relay. It is not a microphone level measurement. The relay cannot listen to or decrypt the audio.",
  "ro": "„Transmite” înseamnă că telefonul trimite o transmisie activă prin releu. Nu este o măsurare a nivelului microfonului. Releul nu poate asculta sau decripta sunetul."
 },
 "Krypteret efterlevering varer højst 15 minutter. Køen slettes ved genstart. En modtagelseskvittering er ikke bevis på, at en bruger har hørt beskeden.": {
  "en": "Encrypted deferred delivery lasts up to 15 minutes. Restarting clears the queue. A receipt does not prove that someone heard the message.",
  "ro": "Livrarea amânată criptată este disponibilă cel mult 15 minute. Repornirea șterge coada. Confirmarea primirii nu dovedește că cineva a ascultat mesajul."
 },
 "Vis ejerens QR-kode": {
  "en": "Show owner QR code",
  "ro": "Arată codul QR al proprietarului"
 },
 "Lav ny ejerinvitation": {
  "en": "Create new owner invitation",
  "ro": "Creează o invitație nouă pentru proprietar"
 },
 "Efter ejerens tilmelding oprettes invitationer til andre deltagere på ejerens telefon.": {
  "en": "After the owner joins, invite other participants from the owner’s phone.",
  "ro": "După înregistrarea proprietarului, invitațiile pentru ceilalți participanți se creează pe telefonul acestuia."
 },
 "Deltagere": {
  "en": "Participants",
  "ro": "Participanți"
 },
 "Aktuel forbindelse": {
  "en": "Current connection",
  "ro": "Conexiunea curentă"
 },
 "Om RTT, codec og adgang": {
  "en": "About RTT, codec and access",
  "ro": "Despre RTT, codec și acces"
 },
 "RTT er tur-retur-tiden for en WebSocket-ping mellem relæet og telefonen. Den er ikke talens samlede forsinkelse og omfatter ikke mikrofonopstart, lydbehandling eller afspilning. En streg betyder, at der endnu ikke er en aktuel måling.": {
  "en": "RTT is the round-trip time of a WebSocket ping between the relay and phone. It is not the total voice delay and excludes microphone startup, audio processing and playback. A dash means no current measurement is available.",
  "ro": "RTT este timpul dus-întors al unui ping WebSocket între releu și telefon. Nu reprezintă întârzierea totală a vocii și nu include pornirea microfonului, procesarea sau redarea. O liniuță indică lipsa unei măsurători actuale."
 },
 "Codec-estimatet bygger på den krypterede pakkestørrelse i den aktuelle Android-protokol. Relæet dekrypterer ikke lyden og kan ikke bekræfte indholdet. Ukendte størrelser vises som ukendt; et præcist codec kræver metadata fra appen.": {
  "en": "The codec estimate uses the encrypted packet size in the current Android protocol. The relay does not decrypt audio or verify its content. Unknown sizes are shown as unknown; exact codec identification requires app metadata.",
  "ro": "Estimarea codecului folosește dimensiunea pachetelor criptate din protocolul Android actual. Releul nu decriptează sunetul și nu verifică conținutul. Dimensiunile necunoscute sunt afișate ca necunoscute; identificarea exactă necesită metadate din aplicație."
 },
 "Tilbagekaldelse stopper relæadgangen. Den gamle lydnøgle kan ikke slettes fra en tidligere deltagers telefon. En ny gruppe med ny nøgle kræves for kryptografisk udelukkelse.": {
  "en": "Revoking access blocks the relay. The old audio key cannot be erased from a former participant’s phone. Cryptographic exclusion requires a new group and key.",
  "ro": "Revocarea blochează accesul la releu. Cheia audio veche nu poate fi ștearsă de pe telefonul unui fost participant. Excluderea criptografică necesită un grup și o cheie noi."
 },
 "Teknisk status": {
  "en": "Technical status",
  "ro": "Stare tehnică"
 },
 "Relæets oppetid": {
  "en": "Relay uptime",
  "ro": "Timp de funcționare"
 },
 "Protokol": {
  "en": "Protocol",
  "ro": "Protocol"
 },
 "HTTPS på relæet": {
  "en": "Relay HTTPS",
  "ro": "HTTPS pe releu"
 },
 "Certifikat udløber": {
  "en": "Certificate expires",
  "ro": "Expirarea certificatului"
 },
 "Indlæsning af certifikat": {
  "en": "Certificate loading",
  "ro": "Încărcarea certificatului"
 },
 "Modtaget trafik": {
  "en": "Received traffic",
  "ro": "Trafic primit"
 },
 "Sendt trafik": {
  "en": "Sent traffic",
  "ro": "Trafic trimis"
 },
 "Modtagne lydpakker": {
  "en": "Audio packets received",
  "ro": "Pachete audio primite"
 },
 "Afsluttede transmissioner": {
  "en": "Completed transmissions",
  "ro": "Transmisii încheiate"
 },
 "Køens størrelse": {
  "en": "Queue size",
  "ro": "Dimensiunea cozii"
 },
 "Ældste besked i kø": {
  "en": "Oldest queued message",
  "ro": "Cel mai vechi mesaj din coadă"
 },
 "Ventende data på forbindelser": {
  "en": "Buffered connection data",
  "ro": "Date în așteptare pe conexiuni"
 },
 "Codec-oplysninger": {
  "en": "Codec information",
  "ro": "Informații codec"
 },
 "Estimat fra pakkestørrelse": {
  "en": "Estimated from packet size",
  "ro": "Estimare din dimensiunea pachetului"
 },
 "Trafiktal er WebSocket-JSON-data set fra relæet (↓ modtaget, ↑ sendt), ikke netværksforbrug inklusive TLS/IP. Køstørrelsen tæller base64-krypteret lyd. Målingerne nulstilles ved genstart og er kun tilgængelige i denne private administration. Dashboardet opdateres cirka hvert sekund. Certifikatstatus beskriver relæets indlæste certifikat; kontrollér Duck DNS-loggen for udstedelse og fornyelsesfejl.": {
  "en": "Traffic counts WebSocket JSON payloads (↓ received, ↑ sent), excluding TLS/IP overhead. Queue size counts base64 encrypted audio. Measurements reset on restart and are only available in this private administration. The dashboard refreshes about once per second. Certificate status describes the loaded certificate; check Duck DNS logs for issuance or renewal errors.",
  "ro": "Traficul reprezintă datele JSON WebSocket (↓ primite, ↑ trimise), fără TLS/IP. Coada măsoară sunetul criptat în base64. Măsurătorile se resetează la repornire și sunt disponibile doar în această administrare privată. Panoul se actualizează aproximativ o dată pe secundă. Starea certificatului descrie certificatul încărcat; verifică jurnalul Duck DNS pentru erori de emitere sau reînnoire."
 },
 "Tilmeld ejerens telefon": {
  "en": "Enroll the owner’s phone",
  "ro": "Înregistrează telefonul proprietarului"
 },
 "Scan i MeshTeam PTT → Indstillinger → Forbindelse → Internet · eget relæ. Del kun koden med ejeren.": {
  "en": "Scan in MeshTeam PTT → Settings → Connection → Internet · own relay. Share this code only with the owner.",
  "ro": "Scanează în MeshTeam PTT → Setări → Conexiune → Internet · releu propriu. Partajează codul doar cu proprietarul."
 },
 "Invitation til manuel indsættelse": {
  "en": "Invitation for manual entry",
  "ro": "Invitație pentru introducere manuală"
 },
 "Skjul invitation": {
  "en": "Hide invitation",
  "ro": "Ascunde invitația"
 },
 "Installation og forbindelse": {
  "en": "Installation and connection",
  "ro": "Instalare și conectare"
 },
 "Tilpas vejledningen til dit netværk. Felterne her er lokale huskenoter i denne browser; de ændrer ikke routeren, relæet eller DuckDNS.": {
  "en": "Adapt the guide to your network. These fields are notes saved in this browser; they do not change the router, relay or DuckDNS.",
  "ro": "Adaptează ghidul la rețeaua ta. Câmpurile sunt note salvate în acest browser; nu modifică routerul, releul sau DuckDNS."
 },
 "Relæets lokale IPv4-adresse": {
  "en": "Relay local IPv4 address",
  "ro": "Adresa IPv4 locală a releului"
 },
 "Routertype": {
  "en": "Router type",
  "ro": "Tipul routerului"
 },
 "Generel router": {
  "en": "Generic router",
  "ro": "Router generic"
 },
 "Offentlig TCP-port": {
  "en": "Public TCP port",
  "ro": "Port TCP public"
 },
 "HTTPS-port på Home Assistant": {
  "en": "HTTPS port on Home Assistant",
  "ro": "Port HTTPS în Home Assistant"
 },
 "Fast lokal adresse": {
  "en": "Fixed local address",
  "ro": "Adresă locală fixă"
 },
 "Reservér Home Assistants IP-adresse i routerens DHCP-indstillinger, så portreglen fortsat peger på den rigtige enhed efter genstart.": {
  "en": "Reserve Home Assistant’s IP in the router DHCP settings so the port rule still targets the correct device after a restart.",
  "ro": "Rezervă adresa IP a Home Assistant în setările DHCP ale routerului, pentru ca regula de port să indice dispozitivul corect după repornire."
 },
 "DuckDNS og certifikat": {
  "en": "DuckDNS and certificate",
  "ro": "DuckDNS și certificat"
 },
 "Opret en gratis adresse på": {
  "en": "Create a free address at",
  "ro": "Creează o adresă gratuită la"
 },
 ". Installer den officielle": {
  "en": ". Install the official",
  "ro": ". Instalează aplicația oficială"
 },
 "-app via Home Assistant → Indstillinger → Apps. Tokenet skal gemmes i Duck DNS-appens indstillinger, aldrig i denne guide eller en delt skærmoptagelse.": {
  "en": "app via Home Assistant → Settings → Apps. Save the token in the Duck DNS app settings, never in this guide or a shared recording.",
  "ro": "prin Home Assistant → Setări → Aplicații. Salvează tokenul în setările aplicației Duck DNS, niciodată în acest ghid sau într-o înregistrare partajată."
 },
 "Vis indstillinger til Duck DNS": {
  "en": "Show Duck DNS settings",
  "ro": "Arată setările Duck DNS"
 },
 "Læs og acceptér selv": {
  "en": "Read and accept",
  "ro": "Citește și acceptă"
 },
 "Let’s Encrypts vilkår": {
  "en": "Let’s Encrypt terms",
  "ro": "condițiile Let’s Encrypt"
 },
 ", før": {
  "en": "yourself before changing",
  "ro": "înainte de a schimba"
 },
 "ændres til": {
  "en": "to",
  "ro": "în"
 },
 ". Start Duck DNS og kontrollér loggen for et udstedt certifikat. DNS-kontrol kræver ikke åbning af port 80.": {
  "en": ". Start Duck DNS and check the log for an issued certificate. DNS verification does not require opening port 80.",
  "ro": ". Pornește Duck DNS și verifică jurnalul pentru emiterea certificatului. Verificarea DNS nu necesită deschiderea portului 80."
 },
 "Aktivér HTTPS på relæet": {
  "en": "Enable HTTPS on the relay",
  "ro": "Activează HTTPS pe releu"
 },
 "I MeshTeam PTT Relay-appens konfiguration: sæt": {
  "en": "In the MeshTeam PTT Relay app configuration, set",
  "ro": "În configurația aplicației MeshTeam PTT Relay, setează"
 },
 ", angiv den offentlige HTTPS-adresse, og forbind containerport": {
  "en": ", enter the public HTTPS address and map container port",
  "ro": ", introdu adresa HTTPS publică și mapează portul containerului"
 },
 "til værtsporten nedenfor. Gem og genstart. Duck DNS fornyer certifikatet automatisk; relæet indlæser gyldige fornyelser uden at afbryde aktive samtaler.": {
  "en": "to the host port below. Save and restart. Duck DNS renews the certificate automatically; the relay loads valid renewals without interrupting active conversations.",
  "ro": "la portul gazdei de mai jos. Salvează și repornește. Duck DNS reînnoiește automat certificatul; releul încarcă reînnoirile valide fără a întrerupe conversațiile active."
 },
 "Lad": {
  "en": "Keep",
  "ro": "Păstrează"
 },
 "være deaktiveret ved indbygget HTTPS. Administrationen kører gennem Home Assistant og skal ikke åbnes på routeren.": {
  "en": "disabled when using built-in HTTPS. Administration runs through Home Assistant and must not be exposed on the router.",
  "ro": "dezactivat când folosești HTTPS integrat. Administrarea se face prin Home Assistant și nu trebuie expusă pe router."
 },
 "Åbn én port på routeren": {
  "en": "Open one router port",
  "ro": "Deschide un port pe router"
 },
 "Kontrollér først, at den offentlige port ikke allerede bruges af en anden tjeneste. Overskriv ikke en eksisterende regel. Gem kun denne TCP-regel. Brug ikke DMZ, og åbn ikke port 8123, 8099 eller den ukrypterede port 8788 for relæet. Menunavne kan variere med routermodel og software.": {
  "en": "First check that another service is not using the public port. Do not overwrite an existing rule. Save only this TCP rule. Do not use DMZ or open ports 8123, 8099 or unencrypted port 8788 for the relay. Menu names vary by router model and software.",
  "ro": "Verifică mai întâi că portul public nu este folosit de alt serviciu. Nu suprascrie reguli existente. Salvează doar această regulă TCP. Nu folosi DMZ și nu deschide porturile 8123, 8099 sau portul necriptat 8788 pentru releu. Denumirile meniurilor pot varia."
 },
 "Hvis forbindelsen ikke kommer igennem": {
  "en": "If the connection fails",
  "ro": "Dacă nu se poate conecta"
 },
 "Sammenlign routerens WAN-IP med din offentlige IP. En privat WAN-adresse eller adresse i 100.64.0.0–100.127.255.255 kan betyde dobbelt NAT eller CGNAT. Kontakt udbyderen om en offentlig IP, eller brug en særskilt VPN-løsning. Portviderestilling alene kan ikke løse CGNAT.": {
  "en": "Compare the router WAN IP with your public IP. A private WAN address or an address in 100.64.0.0–100.127.255.255 may indicate double NAT or CGNAT. Ask your provider for a public IP or use a separate VPN solution. Port forwarding alone cannot resolve CGNAT.",
  "ro": "Compară IP-ul WAN al routerului cu IP-ul public. O adresă WAN privată sau din 100.64.0.0–100.127.255.255 poate indica NAT dublu sau CGNAT. Cere furnizorului un IP public sau folosește o soluție VPN separată. Redirecționarea porturilor nu poate rezolva singură CGNAT."
 },
 "Test fra mobilnettet": {
  "en": "Test using mobile data",
  "ro": "Testează prin date mobile"
 },
 "Slå Wi-Fi fra på en telefon, og åbn adressen nedenfor. Forvent": {
  "en": "Turn off Wi-Fi on a phone and open the address below. Expect",
  "ro": "Oprește Wi-Fi pe un telefon și deschide adresa de mai jos. Rezultatul așteptat este"
 },
 "uden certifikatadvarsel. En test fra hjemmenettet beviser ikke, at forbindelsen virker udefra.": {
  "en": "without a certificate warning. A test from the home network does not prove external connectivity.",
  "ro": "fără avertizare de certificat. Un test din rețeaua de acasă nu confirmă accesul din exterior."
 },
 "Tilmeld telefonerne": {
  "en": "Enroll the phones",
  "ro": "Înregistrează telefoanele"
 },
 "Opret gruppen, vis ejerens QR-kode, og scan med den første telefon. Lav derefter deltagerinvitationer fra ejerens app. QR-koder udløber efter 15 minutter. Telefonerne skal have en appversion med relæfunktionen.": {
  "en": "Create the group, show the owner QR code and scan it with the first phone. Then create participant invitations in the owner’s app. QR codes expire after 15 minutes. Phones need an app version with relay support.",
  "ro": "Creează grupul, afișează codul QR al proprietarului și scanează-l cu primul telefon. Apoi creează invitații pentru participanți din aplicația proprietarului. Codurile expiră după 15 minute. Telefoanele necesită o versiune cu suport pentru releu."
 },
 "Slet gruppe og start forfra": {
  "en": "Delete group and start over",
  "ro": "Șterge grupul și începe din nou"
 },
 "Dette afbryder alle telefoner, tilbagekalder invitationer og adgang samt sletter relæets kø og grupperegister. Telefonernes lokale profiler slettes ikke. Alle skal tilmeldes en ny gruppe med en ny lydnøgle.": {
  "en": "This disconnects all phones, revokes invitations and access, and deletes the relay queue and group registry. Local phone profiles are not deleted. Everyone must enroll in a new group with a new audio key.",
  "ro": "Această acțiune deconectează toate telefoanele, revocă invitațiile și accesul și șterge coada și registrul grupului. Profilurile locale de pe telefoane nu sunt șterse. Toți trebuie să se înregistreze într-un grup nou, cu o cheie audio nouă."
 },
 "Skriv gruppens navn for at bekræfte": {
  "en": "Type the group name to confirm",
  "ro": "Scrie numele grupului pentru confirmare"
 },
 "Slet hele gruppen": {
  "en": "Delete entire group",
  "ro": "Șterge întregul grup"
 },
 "Op til 6 deltagere · Kun beskeder på højst 30 sekunder gemmes til efterlevering · Lydnøgler bliver på telefonerne": {
  "en": "Up to 6 participants · Only messages up to 30 seconds are kept for deferred delivery · Audio keys stay on the phones",
  "ro": "Maximum 6 participanți · Doar mesajele de cel mult 30 de secunde sunt păstrate pentru livrare amânată · Cheile audio rămân pe telefoane"
 },
 "Under 1 s": {
  "en": "Under 1 s",
  "ro": "Sub 1 s"
 },
 " t ": {
  "en": " h ",
  "ro": " h "
 },
 "Anmodningen blev afvist.": {
  "en": "The request was rejected.",
  "ro": "Cererea a fost respinsă."
 },
 "Status utilgængelig": {
  "en": "Status unavailable",
  "ro": "Stare indisponibilă"
 },
 "Forbindelsen til dashboardet er afbrudt. Seneste svar ": {
  "en": "Dashboard connection lost. Last response ",
  "ro": "Conexiunea cu panoul s-a întrerupt. Ultimul răspuns "
 },
 ". Tallene kan være forældede.": {
  "en": ". Values may be stale.",
  "ro": ". Valorile pot fi învechite."
 },
 "Ingen kontakt til dashboardet. Genindlæs siden for at prøve igen.": {
  "en": "Cannot reach the dashboard. Reload to try again.",
  "ro": "Panoul nu poate fi contactat. Reîncarcă pagina."
 },
 "Talestatus ukendt": {
  "en": "Voice status unknown",
  "ro": "Starea transmisiei necunoscută"
 },
 "Venter på en ny status fra relæet.": {
  "en": "Waiting for a new relay status.",
  "ro": "Se așteaptă o stare nouă de la releu."
 },
 "Status ukendt": {
  "en": "Status unknown",
  "ro": "Stare necunoscută"
 },
 "Forbindelse": {
  "en": "Connection",
  "ro": "Conexiune"
 },
 "Codec-estimat": {
  "en": "Codec estimate",
  "ro": "Estimare codec"
 },
 "Trafik ↓ / ↑": {
  "en": "Traffic ↓ / ↑",
  "ro": "Trafic ↓ / ↑"
 },
 "Tilbagekald adgang": {
  "en": "Revoke access",
  "ro": "Revocă accesul"
 },
 "Tilbagekald relæadgang for ": {
  "en": "Revoke relay access for ",
  "ro": "Revoci accesul la releu pentru "
 },
 "? Den gamle lydnøgle kan ikke slettes fra telefonen.": {
  "en": "? The old audio key cannot be erased from the phone.",
  "ro": "? Cheia audio veche nu poate fi ștearsă de pe telefon."
 },
 "Adgangen er tilbagekaldt.": {
  "en": "Access revoked.",
  "ro": "Acces revocat."
 },
 "Relæ startet": {
  "en": "Relay running",
  "ro": "Releu pornit"
 },
 "Relæet kører ikke": {
  "en": "Relay stopped",
  "ro": "Releu oprit"
 },
 "Afventer opsætning": {
  "en": "Setup required",
  "ro": "Necesită configurare"
 },
 "Status opdateret ": {
  "en": "Updated ",
  "ro": "Actualizat "
 },
 " · ekstern adgang er ikke automatisk testet": {
  "en": " · external access is not automatically tested",
  "ro": " · accesul extern nu este testat automat"
 },
 "Deltager": {
  "en": "Participant",
  "ro": "Participant"
 },
 "Talestatus ikke tilgængelig": {
  "en": "Voice status unavailable",
  "ro": "Starea transmisiei indisponibilă"
 },
 " sender tale": {
  "en": " is transmitting",
  "ro": " transmite"
 },
 "Ingen sender tale": {
  "en": "No one is transmitting",
  "ro": "Nimeni nu transmite"
 },
 "Klar til næste transmission": {
  "en": "Ready for the next transmission",
  "ro": "Pregătit pentru următoarea transmisie"
 },
 " · Ejer": {
  "en": " · Owner",
  "ro": " · Proprietar"
 },
 "Sender tale": {
  "en": "Transmitting",
  "ro": "Transmite"
 },
 "Sidst set for ": {
  "en": "Last seen ",
  "ro": "Văzut acum "
 },
 " siden": {
  "en": " ago",
  "ro": ""
 },
 "Ingen aktuel forbindelse": {
  "en": "No current connection",
  "ro": "Nicio conexiune actuală"
 },
 " gammel": {
  "en": " old",
  "ro": " vechime"
 },
 "Blandet": {
  "en": "Mixed",
  "ro": "Mixt"
 },
 " · estimat": {
  "en": " · estimate",
  "ro": " · estimare"
 },
 "Ukendt · krypteret": {
  "en": "Unknown · encrypted",
  "ro": "Necunoscut · criptat"
 },
 "Ingen aktiv tale": {
  "en": "No active transmission",
  "ro": "Nicio transmisie activă"
 },
 "Aktiv · indbygget TLS": {
  "en": "Active · built-in TLS",
  "ro": "Activ · TLS integrat"
 },
 "TLS valgt · afventer listener": {
  "en": "TLS selected · waiting for listener",
  "ro": "TLS selectat · se așteaptă pornirea"
 },
 "Ekstern proxy / ikke aktiveret": {
  "en": "External proxy / disabled",
  "ro": "Proxy extern / dezactivat"
 },
 "Ikke tilgængelig": {
  "en": "Unavailable",
  "ro": "Indisponibil"
 },
 "Seneste indlæsning afvist · kontrollér log": {
  "en": "Last reload rejected · check logs",
  "ro": "Ultima reîncărcare respinsă · verifică jurnalul"
 },
 "Automatisk indlæsning aktiv": {
  "en": "Automatic loading active",
  "ro": "Încărcare automată activă"
 },
 "Ikke administreret her": {
  "en": "Not managed here",
  "ro": "Nu este administrat aici"
 },
 "Tom kø": {
  "en": "Queue empty",
  "ro": "Coada este goală"
 },
 "Anmodningen tog for lang tid. Genindlæs status før du prøver igen.": {
  "en": "Request timed out. Reload status before trying again.",
  "ro": "Cererea a expirat. Reîncarcă starea înainte de a încerca din nou."
 },
 "Gruppen er oprettet. Vis QR-koden og tilmeld ejerens telefon.": {
  "en": "Group created. Show the QR code to enroll the owner.",
  "ro": "Grup creat. Afișează codul QR pentru înregistrarea proprietarului."
 },
 "Udløber ": {
  "en": "Expires ",
  "ro": "Expiră "
 },
 "Lav en ny ejerinvitation? Den tidligere kode holder straks op med at virke.": {
  "en": "Create a new owner invitation? The previous code stops working immediately.",
  "ro": "Creezi o invitație nouă pentru proprietar? Codul anterior nu va mai funcționa."
 },
 "Ny invitation klar. Vis QR-koden for at tilmelde ejeren.": {
  "en": "New invitation ready. Show the QR code to enroll the owner.",
  "ro": "Invitația nouă este gata. Afișează codul QR pentru înregistrarea proprietarului."
 },
 "Indtast Home Assistants lokale IPv4-adresse for at få en færdig portregel.": {
  "en": "Enter the local Home Assistant IPv4 address to generate the port rule.",
  "ro": "Introdu adresa IPv4 locală a Home Assistant pentru a genera regula de port."
 },
 "Indtast en gyldig IPv4-adresse.": {
  "en": "Enter a valid IPv4 address.",
  "ro": "Introdu o adresă IPv4 validă."
 },
 "Porte skal være hele tal mellem 1 og 65535.": {
  "en": "Ports must be integers from 1 to 65535.",
  "ro": "Porturile trebuie să fie numere întregi între 1 și 65535."
 },
 "Vejledningen bruger dine valg. Lokal IP kan være foreslået fra denne Home Assistant-adresse; kontrollér den. Ændringer gemmes kun i denne browser.": {
  "en": "The guide uses your choices. The local IP may be suggested from this Home Assistant address; check it. Changes are saved only in this browser.",
  "ro": "Ghidul folosește alegerile tale. IP-ul local poate fi sugerat din adresa Home Assistant; verifică-l. Modificările sunt salvate doar în acest browser."
 },
 "Konfigureret relæadresse: ": {
  "en": "Configured relay address: ",
  "ro": "Adresa configurată a releului: "
 },
 "Angiv relæets HTTPS-adresse i gruppeopsætningen.": {
  "en": "Enter the relay HTTPS address in group setup.",
  "ro": "Introdu adresa HTTPS a releului în configurarea grupului."
 },
 "Den valgte offentlige port matcher ikke relæadressen. Portreglen og relæets konfigurerede adresse skal bruge samme offentlige port. Guiden ændrer ikke den eksisterende gruppe.": {
  "en": "The public port does not match the relay address. The rule and configured relay address must use the same public port. The guide does not change the existing group.",
  "ro": "Portul public nu corespunde adresei releului. Regula și adresa configurată trebuie să folosească același port public. Ghidul nu modifică grupul existent."
 },
 "Din konfigurerede DuckDNS-adresse: ": {
  "en": "Your configured DuckDNS address: ",
  "ro": "Adresa DuckDNS configurată: "
 },
 "Du kan bruge DuckDNS eller dit eget domæne. Ved eget domæne skal DNS og certifikat sættes op hos den relevante udbyder.": {
  "en": "Use DuckDNS or your own domain. For your own domain, configure DNS and the certificate with your provider.",
  "ro": "Poți folosi DuckDNS sau propriul domeniu. Pentru domeniul propriu, configurează DNS și certificatul la furnizorul respectiv."
 },
 "DIT-NAVN.duckdns.org": {
  "en": "YOUR-NAME.duckdns.org",
  "ro": "NUMELE-TAU.duckdns.org"
 },
 "Container 8443/tcp → Home Assistant-værtsport ": {
  "en": "Container 8443/tcp → Home Assistant host port ",
  "ro": "Container 8443/tcp → port gazdă Home Assistant "
 },
 "[gyldig port kræves]": {
  "en": "[valid port required]",
  "ro": "[este necesar un port valid]"
 },
 "Find Port Forwarding, Portviderestilling, NAT eller Virtual Server i routerens indstillinger.": {
  "en": "Find Port Forwarding, NAT or Virtual Server in your router settings.",
  "ro": "Găsește Port Forwarding, NAT sau Virtual Server în setările routerului."
 },
 "I UniFi Network: Indstillinger → Port Forwarding (eller Policy Engine, afhængigt af version) → Create New.": {
  "en": "In UniFi Network: Settings → Port Forwarding (or Policy Engine, depending on version) → Create New.",
  "ro": "În UniFi Network: Settings → Port Forwarding (sau Policy Engine, în funcție de versiune) → Create New."
 },
 "Navn: MeshTeam Relay HTTPS\nProtokol: TCP\nOffentlig port: ": {
  "en": "Name: MeshTeam PTT Relay HTTPS\nProtocol: TCP\nPublic port: ",
  "ro": "Nume: MeshTeam PTT Relay HTTPS\nProtocol: TCP\nPort public: "
 },
 "\nVideresend til IP: ": {
  "en": "\nForward to IP: ",
  "ro": "\nRedirecționează către IP: "
 },
 "\nIntern port: ": {
  "en": "\nInternal port: ",
  "ro": "\nPort intern: "
 },
 "Portreglen vises, når lokal IP-adresse og begge porte er gyldige.": {
  "en": "The rule appears when the local IP and both ports are valid.",
  "ro": "Regula apare când IP-ul local și ambele porturi sunt valide."
 },
 "Din HTTPS-adresse + /health": {
  "en": "Your HTTPS address + /health",
  "ro": "Adresa ta HTTPS + /health"
 },
 "Slet gruppen permanent? Alle telefoner skal tilmeldes på ny.": {
  "en": "Permanently delete the group? All phones must enroll again.",
  "ro": "Ștergi definitiv grupul? Toate telefoanele trebuie înregistrate din nou."
 },
 "Gruppen er slettet. Opret en ny gruppe for at starte forfra.": {
  "en": "Group deleted. Create a new group to start over.",
  "ro": "Grup șters. Creează un grup nou pentru a începe din nou."
 },
 "Skriv gruppens navn præcist for at bekræfte.": {
  "en": "Type the exact group name to confirm.",
  "ro": "Scrie exact numele grupului pentru confirmare."
 },
 " · kun live": {
  "en": " · live only",
  "ro": " · doar live"
 },
 "Kun adgang gennem Home Assistant.": {
  "en": "Access only through Home Assistant.",
  "ro": "Acces doar prin Home Assistant."
 },
 "Ingen aktiv ejerinvitation. Opret en ny, hvis gruppen stadig er tom.": {
  "en": "No active owner invitation. Create a new one if the group is still empty.",
  "ro": "Nu există invitație activă pentru proprietar. Creează una nouă dacă grupul este încă gol."
 },
 "Invitationen er udløbet eller brugt.": {
  "en": "Invitation expired or already used.",
  "ro": "Invitația a expirat sau a fost folosită."
 },
 "Siden findes ikke.": {
  "en": "Page not found.",
  "ro": "Pagina nu a fost găsită."
 },
 "Genindlæs siden før ændringer.": {
  "en": "Reload the page before making changes.",
  "ro": "Reîncarcă pagina înainte de modificări."
 },
 "Gruppen er allerede oprettet. Den eksisterende gruppe bevares.": {
  "en": "The group already exists. The existing group is preserved.",
  "ro": "Grupul există deja. Grupul existent este păstrat."
 },
 "Opret gruppen først.": {
  "en": "Create the group first.",
  "ro": "Creează mai întâi grupul."
 },
 "Ejeren er allerede tilmeldt. Lav deltagerinvitationer på ejerens telefon.": {
  "en": "The owner has already enrolled. Create invitations on the owner’s phone.",
  "ro": "Proprietarul este deja înregistrat. Creează invitații pe telefonul proprietarului."
 },
 "Deltageren findes ikke.": {
  "en": "Participant not found.",
  "ro": "Participantul nu a fost găsit."
 },
 "Ejeren kan ikke fjernes her. En ny gruppe kræver ny lydnøgle og ny tilmelding.": {
  "en": "The owner cannot be removed here. A new group requires a new audio key and enrollment.",
  "ro": "Proprietarul nu poate fi eliminat aici. Un grup nou necesită o cheie audio nouă și înregistrare nouă."
 },
 "Handlingen kunne ikke gennemføres. Kontrollér HTTPS-adresse og navne.": {
  "en": "The action failed. Check the HTTPS address and names.",
  "ro": "Acțiunea a eșuat. Verifică adresa HTTPS și numele."
 },
 "Operation in progress": {
  "en": "Operation in progress",
  "ro": "Operație în curs"
 },
 "Group confirmation does not match": {
  "en": "Group confirmation does not match",
  "ro": "Confirmarea grupului nu corespunde"
 },
 "Fx 192.168.1.50": {
  "en": "E.g. 192.168.1.50",
  "ro": "De ex. 192.168.1.50"
 },
 "Privat QR-invitation til ejerens telefon": {
  "en": "Private QR invitation for the owner’s phone",
  "ro": "Invitație QR privată pentru telefonul proprietarului"
 },
 "https://dit-navn.duckdns.org": {
  "en": "https://your-name.duckdns.org",
  "ro": "https://numele-tau.duckdns.org"
 },
 "Live tale fortsætter efter 30 sekunder, men hele den gemte begyndelse slettes, og den lange transmission kan ikke efterleveres. Alle tilsluttede telefoner skal bruge Android version 71 eller nyere; ellers gælder den tidligere 30-sekundersgrænse.": {
  "en": "Live voice continues after 30 seconds, but the entire saved prefix is discarded and the long transmission cannot be delivered later. All connected phones need Android version 71 or later; otherwise the previous 30-second limit applies.",
  "ro": "Vocea live continuă după 30 de secunde, dar întreaga parte salvată este ștearsă, iar transmisia lungă nu poate fi livrată ulterior. Toate telefoanele conectate necesită versiunea Android 71 sau mai nouă; altfel se aplică limita anterioară de 30 de secunde."
 }
};
Object.assign(relayTranslations,{"Vælg gruppe": {"en": "Select group", "ro": "Alege grupul"}, "Opret en ekstra gruppe": {"en": "Create another group", "ro": "Creează încă un grup"}, "Annuller": {"en": "Cancel", "ro": "Anulează"}, "Gruppen findes ikke.": {"en": "Group not found.", "ro": "Grupul nu a fost găsit."}, "Samme telefon kan tilmeldes flere grupper. Vælg én aktiv gruppe ad gangen i appen under Gemte grupper. Hver gruppe har sin egen lydnøgle, deltagere og efterleveringskø.": {"en": "The same phone can join multiple groups. Choose one active group at a time under Saved groups in the app. Each group has its own audio key, members and deferred delivery queue.", "ro": "Același telefon se poate înscrie în mai multe grupuri. Alege un singur grup activ în Grupuri salvate din aplicație. Fiecare grup are propria cheie audio, propriii membri și propria coadă de livrare ulterioară."}, "Dette afbryder kun telefonerne i den valgte gruppe, tilbagekalder invitationer og adgang samt sletter relæets kø og grupperegister. Telefonernes lokale profiler slettes ikke. Alle skal tilmeldes en ny gruppe med en ny lydnøgle.": {"en": "This disconnects only the phones in the selected group, revokes invitations and access, and deletes its queue and registry. Local phone profiles are not deleted. Members must join a new group with a new audio key.", "ro": "Aceasta deconectează doar telefoanele din grupul selectat, revocă invitațiile și accesul și șterge coada și registrul grupului. Profilurile locale nu sunt șterse. Membrii trebuie să se înscrie într-un grup nou cu o cheie audio nouă."}});
let relayLanguage='da';
try { const stored=localStorage.getItem('meshteam-relay-language');relayLanguage=['da','en','ro'].includes(stored)?stored:(navigator.language||'da').slice(0,2); } catch {}
if(!['da','en','ro'].includes(relayLanguage))relayLanguage='en';
function T(source){return relayTranslations[source]?.[relayLanguage]??source;}
function relayLocale(){return {da:'da-DK',en:'en-US',ro:'ro-RO'}[relayLanguage];}
const relayStatic=[];
const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
while(walker.nextNode()){const node=walker.currentNode,key=node.data.trim();if(relayTranslations[key])relayStatic.push({node,key,prefix:node.data.match(/^\s*/)[0],suffix:node.data.match(/\s*$/)[0]});}
const relayAttributes=[];
for(const el of document.querySelectorAll('[placeholder],[alt]'))for(const attr of ['placeholder','alt']){const source=el.getAttribute(attr);if(relayTranslations[source])relayAttributes.push({el,attr,source});}
function setRelayLanguage(value){
 relayLanguage=['da','en','ro'].includes(value)?value:'en';document.documentElement.lang=relayLanguage;
 try{localStorage.setItem('meshteam-relay-language',relayLanguage);}catch{}
 for(const item of relayStatic)if(item.node.isConnected)item.node.data=item.prefix+T(item.key)+item.suffix;
 for(const item of relayAttributes)item.el.setAttribute(item.attr,T(item.source));
 document.getElementById('language').value=relayLanguage;
}
setRelayLanguage(relayLanguage);
