# fix_gemini_ssl.ps1
# Usage:
# 1) Run in an elevated PowerShell if you plan to import into Trusted Root (requires admin):
#    .\fix_gemini_ssl.ps1 -Host api.generative.googleapis.com -OutDir C:\certs -ImportRoot
# 2) To just fetch a PEM and set GEMINI_CA_BUNDLE for current session (no admin):
#    .\fix_gemini_ssl.ps1 -Host api.generative.googleapis.com -OutDir C:\certs -SetEnv
#
# Notes:
# - If you're behind a corporate TLS-intercepting proxy, ask IT for the proxy's root CA PEM.
# - Importing a server cert as a root CA is NOT ideal; prefer the proxy root CA instead.
# - This script attempts to fetch the remote cert chain as seen by your machine and
#   saves the server cert as .cer and a base64 PEM. Use the PEM with GEMINI_CA_BUNDLE.

param(
    [string]$HostName = "api.generative.googleapis.com",
    [int]$Port = 443,
    [string]$OutDir = "C:\certs",
    [switch]$ImportRoot,
    [switch]$SetEnv
)

if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

$cerPath = Join-Path $OutDir "$($HostName).cer"
$pemPath = Join-Path $OutDir "$($HostName).pem"

Write-Host "Connecting to ${HostName}:$Port to retrieve certificate..."
try {
    $tcp = New-Object System.Net.Sockets.TcpClient($HostName, $Port)
    $ssl = New-Object System.Net.Security.SslStream($tcp.GetStream(), $false, ({$true}))
    $ssl.AuthenticateAsClient($HostName)
    $cert = $ssl.RemoteCertificate
    if (-not $cert) { throw "No certificate returned" }
    [IO.File]::WriteAllBytes($cerPath, $cert.Export([Security.Cryptography.X509Certificates.X509ContentType]::Cert))
    Write-Host "Saved server cert to: $cerPath"

    # Convert .cer to PEM (Base64) using certutil
    Write-Host "Converting to PEM: $pemPath"
    certutil -encode $cerPath $pemPath | Out-Null
    Write-Host "Saved PEM to: $pemPath"
} catch {
    Write-Error "Failed to retrieve certificate: $_"
    exit 1
}

if ($SetEnv) {
    Write-Host "Setting GEMINI_CA_BUNDLE and REQUESTS_CA_BUNDLE for current session (PowerShell only)."
    $env:GEMINI_CA_BUNDLE = $pemPath
    $env:REQUESTS_CA_BUNDLE = $pemPath
    Write-Host "GEMINI_CA_BUNDLE set to $pemPath"
    Write-Host "Restart your uvicorn server in this session: uvicorn main:app --reload"
}

if ($ImportRoot) {
    Write-Host "Importing certificate into Windows Trusted Root Certification Authorities (requires admin)."
    try {
        # Use certutil to add to Root store
        $add = Start-Process -FilePath certutil -ArgumentList ('-addstore','-f','Root',"$cerPath") -Verb runAs -Wait -NoNewWindow -PassThru
        if ($add.ExitCode -eq 0) {
            Write-Host "Successfully added $cerPath to Trusted Root Certification Authorities."
            Write-Host "Restart any services/Python processes to pick up the new trust store."
        } else {
            Write-Error "certutil returned exit code $($add.ExitCode)."
        }
    } catch {
        Write-Error "Import failed: $_"
    }
}

Write-Host "Done. If you still have SSL errors, obtain the corporate root CA PEM from IT and use that instead of the server cert."
