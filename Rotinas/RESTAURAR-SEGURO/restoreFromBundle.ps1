# Rotinas/restoreFromBundle.ps1 - RESTORE SEGURO COM ESCOLHA
$BackupDir = "C:\dev\orquestrador-mvp\Backups"
$Bundles = Get-ChildItem -Path $BackupDir -Filter "*.bundle" | Sort-Object LastWriteTime -Descending

if ($Bundles.Count -eq 0) {
    Write-Host "NENHUM.bundle encontrado em $BackupDir" -ForegroundColor Red
    pause; exit
}

Write-Host "`n=== BACKUPS DISPONIVEIS (mais recente primeiro) ===" -ForegroundColor Cyan
for ($i=0; $i -lt $Bundles.Count; $i++) {
    $b = $Bundles[$i]
    Write-Host "[$i] $($b.Name) - $($b.LastWriteTime) - $([math]::Round($b.Length/1MB,2)) MB"
}

$escolha = Read-Host "`nDigite o NUMERO do backup que quer restaurar"
if (-not ($escolha -match '^\d+$') -or [int]$escolha -ge $Bundles.Count) {
    Write-Host "Escolha invalida!" -ForegroundColor Red; pause; exit
}

$bundleEscolhido = $Bundles[[int]$escolha]
$destino = "C:\dev\orquestrador-mvp-RESTAURADO-$($bundleEscolhido.BaseName)"

Write-Host "`nVai restaurar:" -ForegroundColor Yellow
Write-Host "DE: $($bundleEscolhido.FullName)"
Write-Host "PARA: $destino"
$confirma = Read-Host "Confirmar? (S/N)"

if ($confirma -ne 'S' -and $confirma -ne 's') { Write-Host "Cancelado."; exit }

git clone $bundleEscolhido.FullName $destino
Write-Host "`nRESTORE OK! Pasta criada: $destino" -ForegroundColor Green
Write-Host "Seu projeto atual em C:\dev\orquestrador-mvp NAO foi alterado." -ForegroundColor Green
pause