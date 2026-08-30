# Azure Deploy 手順

リポジトリ直下で実行します。

```powershell
cd "C:\git clone\eeg-analysis-platform"
```

## Backendのみリリース

```powershell
.\deploy.ps1 backend
```

BackendのDockerイメージをビルドし、ACRへPushして、TerraformでAzure Container Appsへ反映します。

## Frontendのみリリース

```powershell
.\deploy.ps1 frontend
```

## Frontend / Backend 両方リリース

```powershell
.\deploy.ps1 all
```

## 現在のイメージタグ確認

```powershell
Get-Content .\infra\image_tags.auto.tfvars
```

例:

```text
backend_image_tag  = "20260830232110"
frontend_image_tag = "20260830232110"
```

## Terraformが参照しているイメージ設定確認

```powershell
Select-String `
  -Path .\infra\backend_container_app.tf,.\infra\frontend_container_app.tf `
  -Pattern "image\s*="
```

以下のように変数を参照していればOKです。

```hcl
image = "${azurerm_container_registry.eeg.login_server}/eeg-backend:${var.backend_image_tag}"
image = "${azurerm_container_registry.eeg.login_server}/eeg-frontend:${var.frontend_image_tag}"
```

## Frontend公開URL確認

```powershell
az containerapp show `
  --name ca-eeg-frontend `
  --resource-group eeg-rg `
  --query properties.configuration.ingress.fqdn `
  --output tsv
```

現在の公開URL:

```text
https://ca-eeg-frontend.victoriousocean-5b02e89c.japaneast.azurecontainerapps.io
```

## Backendログ確認

```powershell
az containerapp logs show `
  -n ca-eeg-backend `
  -g eeg-rg `
  --tail 100 `
  --format text
```

## Frontendログ確認

```powershell
az containerapp logs show `
  -n ca-eeg-frontend `
  -g eeg-rg `
  --tail 100 `
  --format text
```

## 普段の使い方

Backendだけ修正した場合:

```powershell
.\deploy.ps1 backend
```

Frontendだけ修正した場合:

```powershell
.\deploy.ps1 frontend
```

両方修正した場合:

```powershell
.\deploy.ps1 all
```
