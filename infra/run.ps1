$ErrorActionPreference = "Stop"

Write-Host "=== Azure Login Check ==="

# Azure CLI login status check
$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"

az account show 1>$null 2>$null
$azLoginStatus = $LASTEXITCODE

$ErrorActionPreference = $previousErrorActionPreference

if ($azLoginStatus -ne 0) {
    Write-Host "Azure CLI is not logged in. Starting login..."
    az login

    if ($LASTEXITCODE -ne 0) {
        throw "Azure login failed."
    }
}

Write-Host "=== Terraform Init ==="
terraform init

Write-Host "=== Terraform Format ==="
terraform fmt

Write-Host "=== Terraform Validate ==="
terraform validate

Write-Host "=== Terraform Plan ==="
terraform plan

if ($LASTEXITCODE -ne 0) {
    throw "Terraform plan failed."
}

Write-Host "=== Terraform Apply ==="
terraform apply

if ($LASTEXITCODE -ne 0) {
    throw "Terraform apply failed."
}