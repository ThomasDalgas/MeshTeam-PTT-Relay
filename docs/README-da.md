# MeshTeam PTT Relay – installation

Relæet er nu et selvstændigt projekt med MIT-licens. Det kan bruges af andre uden at købe serversoftwaren. Android-appens Fuld adgang og licens er separate.

- **Home Assistant OS:** Tilføj dette repository i app-butikken, og installer MeshTeam PTT Relay. Se [HA-vejledningen](home-assistant.md).
- **Linux / Raspberry Pi:** Docker Compose med Caddy til HTTPS. Se [Linux](linux.md).
- **Windows PC:** Docker Desktop i Linux-container-tilstand og den medfølgende PowerShell-hjælper. Se [Windows](windows.md).
- **Mac:** Docker Desktop og shell-hjælper eller avanceret Node-installation. Se [macOS](macos.md).

Der er op til otte adskilte grupper med seks telefoner i hver. Samme telefon kan være med i flere grupper, men appen er aktiv i én valgt gruppe ad gangen. Kun HA-installationen har webdashboard i denne udgave; de øvrige administreres via kommandolinjen. Der er endnu ingen signerede Windows-/Mac-desktopinstallationsprogrammer.

Alle telefoner skal kunne nå relæets HTTPS-adresse. Relæet videresender krypteret tale og gemmer kun korte komplette beskeder i hukommelsen i op til 15 minutter. Lange samtaler fortsætter live uden efterlevering. Nøglerne ligger på telefonerne.

En eksisterende lokal HA-app bliver ikke automatisk flyttet til repository-versionen. Bevar den og tag backup før en særskilt migrering. Slet ikke grupper eller Docker-volumener for at opdatere.

Support: funkoneinc@gmail.com. Se [teststatus](verification.md), før du vælger platform.
