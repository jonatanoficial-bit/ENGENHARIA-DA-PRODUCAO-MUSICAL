param(
  [string]$Destination = "outputs/engenharia-da-producao-musical-fases-01-a-15-v1.3.1.zip"
)

$root = Split-Path -Parent $PSScriptRoot
$destinationPath = Join-Path $root $Destination
$destinationFolder = Split-Path -Parent $destinationPath
New-Item -ItemType Directory -Force -Path $destinationFolder | Out-Null
if (Test-Path -LiteralPath $destinationPath) { Remove-Item -LiteralPath $destinationPath -Force }
$items = Get-ChildItem -LiteralPath $root -Force | Where-Object { $_.Name -notin @('outputs', 'work', '.git') }
Compress-Archive -LiteralPath $items.FullName -DestinationPath $destinationPath -Force
Write-Output "Pacote criado: $destinationPath"
