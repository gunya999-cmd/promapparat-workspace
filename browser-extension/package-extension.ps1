$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$output = Join-Path $root 'promapparat-tender-capture.zip'
$files = @('manifest.json','background.js','options.html','options.js','options.css','README.md') | ForEach-Object { Join-Path $root $_ }
if (Test-Path $output) { Remove-Item $output -Force }
Compress-Archive -Path $files -DestinationPath $output -CompressionLevel Optimal
Write-Host "Created: $output" -ForegroundColor Green
