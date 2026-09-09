# backupGitHub.ps1 - Backup seguro sem auto-delete - v3
$ErrorActionPreference = "Stop"
$REPO = "C:\dev\orquestrador-mvp"
$BACKUP_DIR = "$REPO\Backups"
$DATA = Get-Date -Format "yyyy-MM-dd_HH-mm"
$LOG = "$BACKUP_DIR\backup-log.txt"

Set-Location $REPO

if (-not (Test-Path "$REPO\.git")) { Write-Host "ERRO: Nao e repo git" -ForegroundColor Red; pause; exit 1 }
mkdir $BACKUP_DIR -Force | Out-Null

$status = git status --porcelain
if ($status) {
  Write-Host "AVISO: Existem arquivos nao commitados - considere commitar antes" -ForegroundColor Yellow
  git status --short
}

Write-Host "Criando bundle..." -ForegroundColor Cyan
git bundle create "$BACKUP_DIR\orquestrador-mvp-$DATA.bundle" --all

Write-Host "Criando zip..." -ForegroundColor Cyan
git archive --format=zip --output "$BACKUP_DIR\orquestrador-mvp-$DATA.zip" HEAD

Write-Host "Verificando bundle..." -ForegroundColor Cyan
git bundle verify "$BACKUP_DIR\orquestrador-mvp-$DATA.bundle"

"$DATA | OK | commit $(git rev-parse --short HEAD) | branch $(git branch --show-current)" | Out-File $LOG -Append

Write-Host "Backup OK em $BACKUP_DIR" -ForegroundColor Green
Get-ChildItem $BACKUP_DIR | Sort-Object LastWriteTime -Descending | Format-Table Name, @{N='MB';E={[math]::Round($_.Length/1MB,2)}}, LastWriteTime
pause