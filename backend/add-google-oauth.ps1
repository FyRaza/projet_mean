# Script pour ajouter GOOGLE_CLIENT_ID au fichier .env

$envPath = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envPath)) {
    Write-Host "Erreur: Le fichier .env n'existe pas. Créez-le d'abord." -ForegroundColor Red
    exit 1
}

$clientId = Read-Host "Entrez votre Google Client ID (ou appuyez sur Entree pour ignorer)"

if ($clientId) {
    $content = Get-Content $envPath -Raw
    
    # Vérifier si GOOGLE_CLIENT_ID existe déjà
    if ($content -match "GOOGLE_CLIENT_ID=") {
        # Remplacer la valeur existante
        $content = $content -replace "GOOGLE_CLIENT_ID=.*", "GOOGLE_CLIENT_ID=$clientId"
        Write-Host "GOOGLE_CLIENT_ID mis a jour" -ForegroundColor Green
    } else {
        # Ajouter à la fin du fichier
        $content += "`n# Google OAuth Configuration`nGOOGLE_CLIENT_ID=$clientId`n"
        Write-Host "GOOGLE_CLIENT_ID ajoute" -ForegroundColor Green
    }
    
    Set-Content -Path $envPath -Value $content -Encoding UTF8
    Write-Host "Configuration Google OAuth ajoutee avec succes !" -ForegroundColor Green
} else {
    Write-Host "Aucun Client ID fourni. Ignore." -ForegroundColor Yellow
    Write-Host "Vous pouvez ajouter manuellement GOOGLE_CLIENT_ID dans le fichier .env" -ForegroundColor Yellow
}

