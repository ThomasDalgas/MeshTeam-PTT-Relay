param([ValidateSet('init','start','stop','status','logs')][string]$Action='status')
$ErrorActionPreference='Stop'
Set-Location (Join-Path $PSScriptRoot '..')
function Docker-Run {
    & docker @args
    if ($LASTEXITCODE -ne 0) { throw "Docker failed (exit $LASTEXITCODE)." }
}
Get-Command docker -ErrorAction Stop | Out-Null
Docker-Run compose version
Docker-Run info
switch ($Action) {
    'init' {
        if (!(Test-Path .env)) {
            Copy-Item .env.example .env
            Write-Host 'Created .env. Set RELAY_DOMAIN to your DNS hostname, then rerun init.'
            exit 0
        }
        Docker-Run compose build relay
        $relayOrigin=Read-Host 'HTTPS origin (must match RELAY_DOMAIN)'
        $groupName=Read-Host 'Group name'
        $ownerName=Read-Host 'Owner display name'
        Docker-Run compose run --rm relay node src/cli.mjs init --origin $relayOrigin --name $groupName --owner $ownerName
        Write-Host 'Run .\scripts\relay.ps1 start, then scan the private owner QR within 15 minutes.'
    }
    'start' { Docker-Run compose up -d }
    'stop' { Docker-Run compose stop }
    'status' { Docker-Run compose ps }
    'logs' { Docker-Run compose logs --tail=80 }
}
