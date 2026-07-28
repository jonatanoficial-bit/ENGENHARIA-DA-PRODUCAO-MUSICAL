param(
  [string]$Destination = "outputs/engenharia-da-producao-musical-fases-01-a-16-v1.4.4.zip"
)

$root = Split-Path -Parent $PSScriptRoot
$destinationPath = Join-Path $root $Destination
$destinationFolder = Split-Path -Parent $destinationPath
New-Item -ItemType Directory -Force -Path $destinationFolder | Out-Null
if (Test-Path -LiteralPath $destinationPath) { Remove-Item -LiteralPath $destinationPath -Force }
$items = Get-ChildItem -LiteralPath $root -Force | Where-Object { $_.Name -notin @('outputs', 'work', '.git') }
Push-Location -LiteralPath $root
try {
  & tar.exe -a -c -f $destinationPath @($items.Name)
  if ($LASTEXITCODE -ne 0) { throw "Não foi possível criar o pacote ZIP." }
} finally {
  Pop-Location
}
Write-Output "Pacote criado: $destinationPath"
