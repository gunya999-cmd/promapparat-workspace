$ErrorActionPreference = 'Stop'
$BaseUrl = 'https://promapparat-workspace.pages.dev/promapparat-extension'
$Target = Join-Path $env:LOCALAPPDATA 'PromApparat\BrowserExtension'
$Files = @('manifest.json','background.js','options.html','options.js','options.css')

Write-Host 'PromApparat: установка расширения для Edge / Chrome' -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $Target | Out-Null

foreach ($File in $Files) {
    $Uri = "$BaseUrl/$File"
    $Destination = Join-Path $Target $File
    Write-Host "Загрузка $File..."
    Invoke-WebRequest -UseBasicParsing -Uri $Uri -OutFile $Destination
}

$Readme = @"
PROMAPPARAT — ДОБАВИТЬ ТЕНДЕР

1. В Edge откройте edge://extensions
   или в Chrome: chrome://extensions
2. Включите «Режим разработчика».
3. Нажмите «Загрузить распакованное расширение».
4. Выберите папку:
   $Target
5. Закрепите значок PromApparat на панели браузера.

Горячая клавиша: Ctrl+Shift+Y.
"@
Set-Content -Path (Join-Path $Target 'УСТАНОВКА.txt') -Value $Readme -Encoding UTF8

Start-Process explorer.exe $Target
try { Start-Process msedge.exe 'edge://extensions' } catch {
    try { Start-Process chrome.exe 'chrome://extensions' } catch { }
}

Write-Host ''
Write-Host 'Файлы расширения установлены:' -ForegroundColor Green
Write-Host $Target
Write-Host 'В браузере выберите «Загрузить распакованное расширение» и укажите эту папку.'
Read-Host 'Нажмите Enter для завершения'
