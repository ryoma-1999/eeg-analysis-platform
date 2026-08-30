# Terraform Run Script

Azureログイン確認からTerraformの実行までを `run.ps1` でまとめて行います。

## 実行方法

```powershell
cd infra
.\run.ps1
```

未ログインの場合は自動で `az login` が実行されます。

## 実行内容

`run.ps1` では以下を順番に実行します。

```text
Azure Login Check
↓
terraform init
↓
terraform fmt
↓
terraform validate
↓
terraform plan
↓
terraform apply
```
