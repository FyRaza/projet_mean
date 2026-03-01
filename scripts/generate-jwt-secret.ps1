# Script pour générer un JWT_SECRET sécurisé
# Usage: .\scripts\generate-jwt-secret.ps1

$length = 64
$chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
$random = New-Object System.Random
$secret = -join ($chars.ToCharArray() | Get-Random -Count $length -InputObject { $random.Next(0, $chars.Length) } | ForEach-Object { $chars[$_] })

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "JWT_SECRET généré :" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host $secret -ForegroundColor Yellow
Write-Host ""
Write-Host "Copiez cette valeur et utilisez-la comme valeur pour la variable JWT_SECRET sur Railway" -ForegroundColor Cyan
Write-Host ""

