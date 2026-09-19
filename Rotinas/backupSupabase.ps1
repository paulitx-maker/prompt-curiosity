$REPO = "C:\dev\orquestrador-mvp"
$BACKUP_DIR = "$REPO\Backups\Supabase"
$DATA = Get-Date -Format "yyyy-MM-dd_HH-mm"
mkdir $BACKUP_DIR -Force | Out-Null
$DUMP_FILE = "$BACKUP_DIR\supabase-dump-$DATA.sql"

# Lê do.env que você já tem na raiz (linha 19 no seu print)
$envLine = Get-Content "$REPO\.env" | Where-Object { $_ -match "SUPABASE_DB_URL=" }
$DB_URL = ($envLine -split "=",2)[1].Trim().Trim('"').Trim("'")

if (-not $DB_URL) {
    Write-Host "ERRO: SUPABASE_DB_URL nao encontrado no.env" -ForegroundColor Red
    exit 1
}

Write-Host "Fazendo dump para $DUMP_FILE..." -ForegroundColor Cyan
Write-Host "URL: $($DB_URL.Substring(0,60))..." -ForegroundColor Gray

& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" --format=plain --no-owner --no-acl -f $DUMP_FILE $DB_URL

if (Test-Path $DUMP_FILE) {
    $size = (Get-Item $DUMP_FILE).Length / 1MB
    Write-Host "Dump OK - $([math]::Round($size,2)) MB" -ForegroundColor Green
    Compress-Archive -Path $DUMP_FILE -DestinationPath "$DUMP_FILE.zip" -Force
    Remove-Item $DUMP_FILE -Force
    Write-Host "Backup OK: $DUMP_FILE.zip" -ForegroundColor Green
} else {
    Write-Host "Falhou - verifica SUPABASE_DB_URL no.env e pg_dump 17" -ForegroundColor Red
}