S# backupSupabase.ps1 - SEM DOCKER - v2
$ErrorActionPreference = "Stop"
$REPO = "C:\dev\orquestrador-mvp"
$BACKUP_DIR = "$REPO\Backups\Supabase"
$DATA = Get-Date -Format "yyyy-MM-dd_HH-mm"
$LOG = "$REPO\Backups\backup-log.txt"
mkdir $BACKUP_DIR -Force | Out-Null
Set-Location $REPO

# COLE SUA URL AQUI SE NAO ESTIVER NO.env
if (-not $env:DATABASE_URL) {
  $env:DATABASE_URL = Get-Content "$REPO\supabase\.temp\pooler-url" -ErrorAction SilentlyContinue
  if (-not $env:DATABASE_URL) {
$env:DATABASE_URL = "postgresql://postgres.mcukxnxpiayitkjmvjnv:gyvziq-8sipSo-fuqgen@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
  }
}

$DUMP_FILE = "$BACKUP_DIR\supabase-full-$DATA.sql"
Write-Host "Fazendo dump completo [schema+dados+RLS] sem Docker..." -ForegroundColor Cyan

# usa pg_dump que vem junto com supabase CLI recente ou instalado
$pgdump = (Get-Command pg_dump -ErrorAction SilentlyContinue).Source
if (-not $pgdump) { $pgdump = "$env:USERPROFILE\.supabase\pg_dump.exe" }

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  Write-Host "pg_dump nao encontrado, tentando via supabase..." -ForegroundColor Yellow
  supabase db dump --db-url $env:DATABASE_URL -f "$DUMP_FILE" --use-copy 2>&1 | Out-Null
} else {
  pg_dump $env:DATABASE_URL -F p --no-owner --no-acl --clean --if-exists -f "$DUMP_FILE"
}

if (-not (Test-Path $DUMP_FILE) -or (Get-Item $DUMP_FILE).Length -lt 5KB) {
  Write-Host "ERRO: Dump falhou. Verifique DATABASE_URL e senha." -ForegroundColor Red; pause; exit 1
}

Compress-Archive -Path $DUMP_FILE -DestinationPath "$DUMP_FILE.zip" -Force
Remove-Item $DUMP_FILE -Force
"$DATA | SUPABASE OK | supabase-full-$DATA.sql.zip | $([math]::Round((Get-Item "$DUMP_FILE.zip").Length/1MB,2)) MB" | Out-File $LOG -Append
Write-Host "Backup Supabase OK: $DUMP_FILE.zip" -ForegroundColor Green
pause