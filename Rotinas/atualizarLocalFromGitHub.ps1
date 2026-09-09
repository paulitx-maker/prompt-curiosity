# Rotinas/atualizarLocalFromGitHub.ps1 - ATUALIZA A RAIZ COM O GITHUB
Set-Location "C:\dev\orquestrador-mvp"

Write-Host "=== ATUALIZADOR LOCAL <- GITHUB ===" -ForegroundColor Cyan
git status
Write-Host "`nAVISO: Isso vai APAGAR mudancas locais nao commitadas e atualizar sua pasta raiz." -ForegroundColor Yellow

# 1. Backup de emergencia do estado atual antes de sobrescrever
$emergency = "C:\dev\orquestrador-mvp\Backups\emergency-antes-restore-$(Get-Date -Format 'yyyy-MM-dd_HH-mm').bundle"
Write-Host "Criando backup de emergencia do seu estado ATUAL em: $emergency" -ForegroundColor Gray
git bundle create $emergency --all

# 2. Busca o que tem no GitHub
git fetch origin

# 3. Mostra opcoes
Write-Host "`nUltimos 10 commits no GITHUB (origin/main):" -ForegroundColor Cyan
git log origin/main --oneline -10

$commit = Read-Host "`nQual commit quer usar? (ENTER = mais recente do GitHub, ou cole o hash)"

if ([string]::IsNullOrWhiteSpace($commit)) { $commit = "origin/main" }

Write-Host "`nVai fazer: git reset --hard $commit na pasta C:\dev\orquestrador-mvp" -ForegroundColor Red
$confirma = Read-Host "Tem CERTEZA? Digite S para confirmar"

if ($confirma -eq 'S') {
    git reset --hard $commit
    git clean -fd
    Write-Host "`nLOCAL ATUALIZADO! Agora seu C:\dev\orquestrador-mvp == GitHub ($commit)" -ForegroundColor Green
    Write-Host "Backup de emergencia salvo em: $emergency" -ForegroundColor Green
} else {
    Write-Host "Cancelado. Seu backup de emergencia continua em $emergency"
}
pause