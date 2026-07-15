param(
  [string]$DatabaseId = "",
  [string]$WorkerUrl = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $PSScriptRoot
$WorkerDir = Join-Path $RepoRoot "cloudflare"
$WranglerFile = Join-Path $WorkerDir "wrangler.toml"

function Invoke-Checked {
  param([scriptblock]$Command, [string]$ErrorMessage)
  & $Command
  if ($LASTEXITCODE -ne 0) { throw $ErrorMessage }
}

function Invoke-NativeCapture {
  param([scriptblock]$Command)
  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    $output = (& $Command 2>&1 | Out-String)
    $exitCode = $LASTEXITCODE
    return @{ Output = $output; ExitCode = $exitCode }
  }
  finally {
    $ErrorActionPreference = $previousPreference
  }
}

function ConvertFrom-SecureText {
  param([Security.SecureString]$Value)
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

Write-Host "`nPromApparat Cloudflare Worker + D1 setup" -ForegroundColor Cyan
Write-Host "No paid external services are used.`n"

Push-Location $WorkerDir
try {
  Invoke-Checked { npm install } "Failed to install Wrangler. Check Node.js and npm."

  & npx wrangler whoami | Out-Host
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Opening Cloudflare login..." -ForegroundColor Yellow
    Invoke-Checked { npx wrangler login } "Cloudflare login failed."
  }

  $config = Get-Content $WranglerFile -Raw
  if ($config -match "REPLACE_WITH_D1_DATABASE_ID") {
    if (-not $DatabaseId) {
      Write-Host "Creating D1 database promapparat-workspace..." -ForegroundColor Cyan
      $createResult = Invoke-NativeCapture { npx wrangler d1 create promapparat-workspace }
      Write-Host $createResult.Output
      if ($createResult.ExitCode -ne 0) { throw "D1 database creation failed." }
      if ($createResult.Output -match 'database_id\s*=\s*"([^"]+)"') {
        $DatabaseId = $Matches[1]
      } else {
        throw "Could not detect database_id. Run 'npx wrangler d1 list' and rerun with -DatabaseId <ID>."
      }
    }
    $config = $config.Replace("REPLACE_WITH_D1_DATABASE_ID", $DatabaseId)
    Set-Content -Path $WranglerFile -Value $config -Encoding UTF8
    Write-Host "D1 database_id saved to cloudflare/wrangler.toml" -ForegroundColor Green
  }

  Write-Host "Applying D1 migrations..." -ForegroundColor Cyan
  Invoke-Checked { npx wrangler d1 migrations apply DB --remote } "D1 migrations failed."

  $secretBytes = New-Object byte[] 32
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($secretBytes) } finally { $rng.Dispose() }
  $bootstrapSecret = [Convert]::ToBase64String($secretBytes)
  $bootstrapSecret | npx wrangler secret put BOOTSTRAP_SECRET | Out-Host
  if ($LASTEXITCODE -ne 0) { throw "Failed to save BOOTSTRAP_SECRET." }

  Write-Host "Deploying Worker..." -ForegroundColor Cyan
  $deployResult = Invoke-NativeCapture { npx wrangler deploy }
  Write-Host $deployResult.Output
  if ($deployResult.ExitCode -ne 0) { throw "Worker deployment failed." }
  $deployOutput = $deployResult.Output

  if (-not $WorkerUrl -and $deployOutput -match 'https://[a-zA-Z0-9.-]+\.workers\.dev') {
    $WorkerUrl = $Matches[0].TrimEnd('/')
  }
  if (-not $WorkerUrl) {
    $WorkerUrl = (Read-Host "Paste Worker URL, for example https://promapparat-api.example.workers.dev").TrimEnd('/')
  }

  Write-Host "`nCreate the first director account" -ForegroundColor Cyan
  $email = (Read-Host "Director email").Trim().ToLowerInvariant()
  $passwordSecure = Read-Host "Director password (minimum 10 characters)" -AsSecureString
  $password = ConvertFrom-SecureText $passwordSecure
  if ($password.Length -lt 10) { throw "Password must contain at least 10 characters." }

  $body = @{ email = $email; password = $password; name = "Director" } | ConvertTo-Json
  $headers = @{ "X-Bootstrap-Secret" = $bootstrapSecret }
  try {
    $result = Invoke-RestMethod -Method Post -Uri "$WorkerUrl/api/bootstrap" -Headers $headers -ContentType "application/json" -Body $body
    Write-Host "Director created: $($result.user.email)" -ForegroundColor Green
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 409) {
      Write-Host "The first user already exists. Bootstrap skipped." -ForegroundColor Yellow
    } else { throw }
  } finally {
    $password = $null
    $bootstrapSecret = $null
  }

  Write-Host "`nDone." -ForegroundColor Green
  Write-Host "Worker API: $WorkerUrl"
  Write-Host "Readiness check: $WorkerUrl/ready"
  Write-Host "`nNext step in Cloudflare Pages:"
  Write-Host "Settings -> Environment variables -> Production"
  Write-Host "VITE_API_URL = $WorkerUrl" -ForegroundColor Yellow
  Write-Host "Then start a new Pages deployment."
}
finally {
  Pop-Location
}
