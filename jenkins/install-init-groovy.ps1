# install-init-groovy.ps1
# Usage: Run as Administrator from the repo folder or double-click in an elevated PowerShell
# This will copy the init.groovy script into Jenkins home and restart the Jenkins service.

$ErrorActionPreference = 'Stop'

# Resolve paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $scriptDir "init.groovy.d\create-nexus-credential.groovy"
$dstDir = 'C:\ProgramData\Jenkins\.jenkins\init.groovy.d'
$dst = Join-Path $dstDir 'create-nexus-credential.groovy'

if (-Not (Test-Path $src)) {
    Write-Error "Source file not found: $src"
    exit 2
}

# Ensure destination directory exists
if (-Not (Test-Path $dstDir)) {
    New-Item -ItemType Directory -Force -Path $dstDir | Out-Null
}

Write-Output "Copying $src to $dst"
Copy-Item -Force -Path $src -Destination $dst

# Restart Jenkins service
$svc = Get-Service -Name jenkins -ErrorAction SilentlyContinue
if ($null -eq $svc) {
    Write-Warning "Jenkins service not found. If Jenkins runs as a different service name or in Docker, copy the file manually to $dstDir and restart accordingly."
    Write-Output "File copied; please restart Jenkins manually."
    exit 0
}

Write-Output "Restarting Jenkins service..."
Try {
    Restart-Service -Name jenkins -Force -ErrorAction Stop
    Write-Output "Jenkins restarted. Check Jenkins logs for init script output (System Log) and verify credential 'nexus-admin' exists in Manage Credentials."
} Catch {
    Write-Error "Failed to restart Jenkins service: $_"
    Write-Output "File is copied to $dst; restart Jenkins manually."
    exit 3
}

Write-Output "Done."
