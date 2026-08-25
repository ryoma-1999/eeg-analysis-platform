# EEG Analysis Prototype

EEG（脳波）データをCSVファイルから読み込み、解析・可視化するためのプロトタイプアプリケーションです。

## 前提環境

本アプリケーションの実行には、以下のソフトウェアが必要です。

- Git
- Docker Desktop
- Webブラウザ

## 実行手順

### 1. リポジトリをクローン

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Docker Desktopを起動

Windowsの場合は、PowerShellで以下を実行します。

```powershell
docker desktop start
```

または、WindowsのスタートメニューからDocker Desktopを起動してください。

### 3. Docker Engineの起動を確認

```powershell
docker info
```

`Server:` 以下にDocker Serverの情報が表示されれば、Docker Engineは正常に起動しています。

以下のようなエラーが表示される場合は、Docker Desktopが起動していません。

```text
failed to connect to the docker API
```

その場合は、再度Docker Desktopを起動してください。

```powershell
docker desktop start
```

### 4. プロジェクトディレクトリへ移動

```powershell
cd "<repository-path>"
```

例：

```powershell
cd "C:\git clone\eeg-analysis-platform"
```

> `docker compose` コマンドは、`compose.yaml` または `docker-compose.yml` が存在するプロジェクトディレクトリ内で実行してください。

### 5. Dockerコンテナを起動

初回起動時、またはDockerイメージを再ビルドする場合：

```bash
docker compose up --build
```

バックグラウンドで起動する場合：

```bash
docker compose up --build -d
```

### 6. ブラウザでアクセス

フロントエンド：

[http://localhost:5173](http://localhost:5173)

## 停止方法

フォアグラウンドで起動している場合は、起動中のターミナルで以下を押します。

```text
Ctrl + C
```

コンテナを停止して削除する場合：

```bash
docker compose down
```

## 再起動

### Docker Desktopが停止している場合

```powershell
docker desktop start
```

### コンテナを再起動

プロジェクトディレクトリへ移動します。

```powershell
cd "<repository-path>"
```

コンテナを起動します。

```bash
docker compose up
```

バックグラウンドで起動する場合：

```bash
docker compose up -d
```

## ログの確認

コンテナのログを確認する場合：

```bash
docker compose logs
```

ログをリアルタイムで確認する場合：

```bash
docker compose logs -f
```

特定のサービスだけ確認する場合：

```bash
docker compose logs -f <service-name>
```

## コンテナの状態確認

```bash
docker compose ps
```

Docker全体のコンテナを確認する場合：

```bash
docker ps -a
```

## 再ビルド

ソースコードや依存関係の変更後に再ビルドする場合：

```bash
docker compose up --build
```

キャッシュを使用せずに完全に再ビルドする場合：

```bash
docker compose build --no-cache
docker compose up
```

## トラブルシューティング

### Docker APIに接続できない

以下のようなエラーが表示される場合：

```text
failed to connect to the docker API at
npipe:////./pipe/dockerDesktopLinuxEngine
```

Docker Desktopを起動します。

```powershell
docker desktop start
```

起動状態を確認します。

```powershell
wsl -l -v
```

正常な場合、`docker-desktop` が `Running` になります。

```text
NAME              STATE      VERSION
docker-desktop    Running    2
```

さらに、Docker Engineへの接続を確認します。

```powershell
docker info
```

### Docker Desktopが起動しない

WSLを一度停止します。

```powershell
wsl --shutdown
```

その後、Docker Desktopを起動します。

```powershell
docker desktop start
```

### Composeファイルが見つからない

以下のエラーが表示される場合：

```text
no configuration file provided: not found
```

現在のディレクトリを確認します。

```powershell
Get-Location
```

ファイル一覧を確認します。

```powershell
Get-ChildItem
```

`compose.yaml` または `docker-compose.yml` が存在するプロジェクトディレクトリへ移動してから、再度実行してください。

```powershell
cd "<repository-path>"
docker compose up --build
```

### コンテナを再作成したい

```bash
docker compose down
docker compose up --build
```

## 開発終了時

コンテナを停止して削除します。

```bash
docker compose down
```

Docker Desktop自体も終了する場合：

```powershell
docker desktop stop
```