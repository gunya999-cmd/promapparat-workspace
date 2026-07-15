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

function ConvertFrom-SecureText {
  param([Security.SecureString]$Value)
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

Write-Host "`nPromApparat: бесплатное развёртывание Cloudflare Worker + D1" -ForegroundColor Cyan
Write-Host "Платные внешние сервисы не используются.`n"

Push-Location $WorkerDir
try {
  Invoke-Checked { npm install } "Не удалось установить Wrangler. Проверьте Node.js и npm."

  & npx wrangler whoami | Out-Host
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Открываю вход в Cloudflare..." -ForegroundColor Yellow
    Invoke-Checked { npx wrangler login } "Не удалось войти в Cloudflare."
  }

  $config = Get-Content $WranglerFile -Raw
  if ($config -match "REPLACE_WITH_D1_DATABASE_ID") {
    if (-not $DatabaseId) {
      Write-Host "Создаю D1 базу promapparat-workspace..." -ForegroundColor Cyan
      $createOutput = (& npx wrangler d1 create promapparat-workspace 2>&1 | Out-String)
      Write-Host $createOutput
      if ($createOutput -match 'database_id\s*=\s*"([^"]+)"') {
        $DatabaseId = $Matches[1]
      } else {
        throw "Не удалось автоматически определить database_id. Запустите 'npx wrangler d1 list' и повторите скрипт с параметром -DatabaseId <ID>."
      }
    }
    $config = $config.Replace("REPLACE_WITH_D1_DATABASE_ID", $DatabaseId)
    Set-Content -Path $WranglerFile -Value $config -Encoding UTF8
    Write-Host "D1 database_id записан в cloudflare/wrangler.toml" -ForegroundColor Green
  }

  Write-Host "Применяю миграции D1..." -ForegroundColor Cyan
  Invoke-Checked { npx wrangler d1 migrations apply DB --remote } "Не удалось применить миграции D1."

  $secretBytes = New-Object byte[] 32
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($secretBytes) } finally { $rng.Dispose() }
  $bootstrapSecret = [Convert]::ToBase64String($secretBytes)
  $bootstrapSecret | npx wrangler secret put BOOTSTRAP_SECRET | Out-Host
  if ($LASTEXITCODE -ne 0) { throw "Не удалось сохранить BOOTSTRAP_SECRET в Cloudflare." }

  Write-Host "Разворачиваю Worker..." -ForegroundColor Cyan
  $deployOutput = (& npx wrangler deploy 2>&1 | Out-String)
  Write-Host $deployOutput
  if ($LASTEXITCODE -ne 0) { throw "Развёртывание Worker завершилось ошибкой." }

  if (-not $WorkerUrl -and $deployOutput -match 'https://[a-zA-Z0-9.-]+\.workers\.dev') {
    $WorkerUrl = $Matches[0].TrimEnd('/')
  }
  if (-not $WorkerUrl) {
    $WorkerUrl = (Read-Host "Вставьте адрес Worker вида https://promapparat-api.<subdomain>.workers.dev").TrimEnd('/')
  }

  Write-Host "`nСоздание первого директора" -ForegroundColor Cyan
  $email = (Read-Host "Email директора").Trim().ToLowerInvariant()
  $passwordSecure = Read-Host "Пароль директора (минимум 10 символов)" -AsSecureString
  $password = ConvertFrom-SecureText $passwordSecure
  if ($password.Length -lt 10) { throw "Пароль должен содержать минимум 10 символов." }

  $body = @{ email = $email; password = $password; name = "Директор" } | ConvertTo-Json
  $headers = @{ "X-Bootstrap-Secret" = $bootstrapSecret }
  try {
    $result = Invoke-RestMethod -Method Post -Uri "$WorkerUrl/api/bootstrap" -Headers $headers -ContentType "application/json" -Body $body
    Write-Host "Первый директор создан: $($result.user.email)" -ForegroundColor Green
  } catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
      Write-Host "Первый пользователь уже существует — повторное создание пропущено." -ForegroundColor Yellow
    } else { throw }
  } finally {
    $password = $null
    $bootstrapSecret = $null
  }

  Write-Host "`nГотово." -ForegroundColor Green
  Write-Host "Worker API: $WorkerUrl"
  Write-Host "Проверка: $WorkerUrl/ready"
  Write-Host "`nСледующий шаг в Cloudflare Pages:"
  Write-Host "Settings -> Environment variables -> Production"
  Write-Host "VITE_API_URL = $WorkerUrl" -ForegroundColor Yellow
  Write-Host "После этого запустите новый deployment Pages."
}
finally {
  Pop-Location
}
