Set-Location $PSScriptRoot\frontend
if (!(Test-Path node_modules)) {
    npm install
}
npm run dev -- --host 127.0.0.1 --port 3000
