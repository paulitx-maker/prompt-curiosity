$REPO = "C:\dev\orquestrador-mvp"
$BACKUP_DIR = "$REPO\Backups\Supabase"
$DATA = Get-Date -Format "yyyy-MM-dd_HH-mm"
mkdir $BACKUP_DIR -Force | Out-Null

$DB_URL = "postgresql://postgres.mcukxnxpiayitkjhmvjnv:$env:SUPABASE_DB_PASSWORD@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

Write-Host "Fazendo dump via Session Pooler 5432..." -ForegroundColor Cyan

# Usa o 17 e usa --format=plain sem espaço
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" --format=plain --no-owner --no-acl -f "$DUMP_FILE" "$DB_URL"

if (Test-Path $DUMP_FILE) {
  Compress-Archive -Path $DUMP_FILE -DestinationPath "$DUMP_FILE.zip" -Force
  Remove-Item $DUMP_FILE -Force
  Write-Host "Backup OK: $DUMP_FILE.zip" -ForegroundColor Green
} else {
  Write-Host "Falhou" -ForegroundColor Red
}