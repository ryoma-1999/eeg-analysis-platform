param(
    [ValidateSet("backend", "frontend", "all")]
    [string]$Target = "all"
)

$ErrorActionPreference = "Stop"

$acrName = "eeganalysisacr"
$acrServer = "$acrName.azurecr.io"

# 日時をイメージタグとして使用
$tag = Get-Date -Format "yyyyMMddHHmmss"

$tfvarsPath = Join-Path `
    $PSScriptRoot `
    "infra\image_tags.auto.tfvars"


Write-Host "=== Azure Login Check ==="

az account show 1>$null 2>$null

if ($LASTEXITCODE -ne 0) {
    az login
}


Write-Host "=== ACR Login ==="

az acr login --name $acrName


# 現在のタグを取得
$tfvarsContent = Get-Content $tfvarsPath -Raw

$backendTag = (
    [regex]::Match(
        $tfvarsContent,
        'backend_image_tag\s*=\s*"([^"]+)"'
    )
).Groups[1].Value

$frontendTag = (
    [regex]::Match(
        $tfvarsContent,
        'frontend_image_tag\s*=\s*"([^"]+)"'
    )
).Groups[1].Value


# -------------------------
# Backend
# -------------------------

if (
    $Target -eq "backend" -or
    $Target -eq "all"
) {
    Write-Host "=== Build Backend ==="

    docker build `
        -t "$acrServer/eeg-backend:$tag" `
        "$PSScriptRoot\backend"

    Write-Host "=== Push Backend ==="

    docker push "$acrServer/eeg-backend:$tag"

    $backendTag = $tag
}


# -------------------------
# Frontend
# -------------------------

if (
    $Target -eq "frontend" -or
    $Target -eq "all"
) {
    Write-Host "=== Build Frontend ==="

    docker build `
        -f "$PSScriptRoot\frontend\Dockerfile.prod" `
        -t "$acrServer/eeg-frontend:$tag" `
        "$PSScriptRoot\frontend"

    Write-Host "=== Push Frontend ==="

    docker push "$acrServer/eeg-frontend:$tag"

    $frontendTag = $tag
}


# -------------------------
# Terraform Image Tags
# -------------------------

@"
backend_image_tag  = "$backendTag"
frontend_image_tag = "$frontendTag"
"@ | Set-Content $tfvarsPath


# -------------------------
# Terraform
# -------------------------

Push-Location "$PSScriptRoot\infra"

try {
    Write-Host "=== Terraform Init ==="
    terraform init

    Write-Host "=== Terraform Format ==="
    terraform fmt

    Write-Host "=== Terraform Validate ==="
    terraform validate

    Write-Host "=== Terraform Plan ==="
    terraform plan -out=tfplan

    Write-Host "=== Terraform Apply ==="
    terraform apply -auto-approve tfplan
}
finally {
    Remove-Item tfplan `
        -ErrorAction SilentlyContinue

    Pop-Location
}


Write-Host ""
Write-Host "=== Deployment Complete ==="
Write-Host "Target: $Target"
Write-Host "Tag:    $tag"