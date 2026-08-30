# API仕様

## 目次

- [1. 本文書の目的](#1-本文書の目的)
- [2. API共通仕様](#2-api共通仕様)
- [3. エンドポイント一覧](#3-エンドポイント一覧)
- [4. Root API](#4-root-api)
- [5. Health API](#5-health-api)
- [6. EEG Upload API](#6-eeg-upload-api)
- [7. EEG Filter API](#7-eeg-filter-api)
- [8. EEG PSD API](#8-eeg-psd-api)
- [9. EEG Band Power API](#9-eeg-band-power-api)
- [10. 共通エラー仕様](#10-共通エラー仕様)
- [11. Frontendとの対応](#11-frontendとの対応)
- [12. 現在の制約](#12-現在の制約)

## 1. 本文書の目的

本文書では、EEG Analysis PlatformのBackendが提供するREST APIについて、HTTPメソッド、URL、Request、Responseおよびエラー条件を定義する。

データが各API間をどのように流れるかは[03_データフロー.md](./03_データフロー.md)、Filter・PSD・Band Powerの計算内容は[05_EEG信号処理.md](./05_EEG信号処理.md)に記載する。

## 2. API共通仕様

| 項目 | 内容 |
|---|---|
| Backend URL | `http://localhost:8000` |
| API形式 | REST API |
| データ形式 | JSON。ただしCSV Uploadのみ`multipart/form-data` |
| EEG配列形式 | `[channel][sample]` |
| 認証 | 未実装 |
| APIバージョン | `0.1.0` |
| CORS許可Origin | `http://localhost:5173` |

FastAPIがOpenAPI仕様を自動生成するため、Backend起動中は以下からもAPI仕様を確認できる。

| URL | 内容 |
|---|---|
| `http://localhost:8000/docs` | Swagger UI |
| `http://localhost:8000/redoc` | ReDoc |
| `http://localhost:8000/openapi.json` | OpenAPI JSON |

### 2.1 共通EEG項目

| 項目 | JSON型 | 内容 |
|---|---|---|
| `fileName` | string | アップロード元のCSVファイル名 |
| `samplingRate` | number | サンプリング周波数（Hz） |
| `duration` | number | 記録時間（秒） |
| `channels` | string[] | EEGチャンネル名 |
| `data` | number[][] | EEG値。第1添字がチャンネル、第2添字がサンプル |

例えば、2チャンネル・3サンプルの`data`は以下の形式になる。

```json
[
  [1.0, 1.1, 1.2],
  [2.0, 2.1, 2.2]
]
```

## 3. エンドポイント一覧

| Method | Path | Content-Type | 用途 |
|---|---|---|---|
| GET | `/` | なし | Backendの起動確認 |
| GET | `/health` | なし | Frontendからのヘルスチェック |
| POST | `/api/eeg/upload` | `multipart/form-data` | CSVの検証・EEGデータ化 |
| POST | `/api/eeg/filter` | `application/json` | EEGへのFilter適用 |
| POST | `/api/eeg/psd` | `application/json` | Welch法によるPSD計算 |
| POST | `/api/eeg/band-power` | `application/json` | 周波数帯域別Power計算 |

## 4. Root API

Backendが起動していることを簡易確認する。

```http
GET /
```

### Response `200 OK`

```json
{
  "message": "EEG Analysis API is running"
}
```

## 5. Health API

FrontendのAPI Online表示に使用する。

```http
GET /health
```

### Response `200 OK`

```json
{
  "status": "ok"
}
```

Frontendの`checkAPIHealth()`は、レスポンス本文ではなくHTTPステータスが成功かどうかを示す`response.ok`を確認する。通信失敗時は`false`を返す。

## 6. EEG Upload API

CSVファイルを検証し、Frontendと信号処理で使用する共通EEG形式へ変換する。

```http
POST /api/eeg/upload
Content-Type: multipart/form-data
```

### 6.1 Request

| Form field | 型 | 必須 | 内容 |
|---|---|---|---|
| `file` | CSV file | 必須 | `time`列と1列以上のEEGチャンネルを持つCSV |

CSV例：

```csv
time,Fp1,Fp2
0.000,1.0,2.0
0.004,1.1,2.1
0.008,1.2,2.2
```

`time`以外の全列をEEGチャンネルとして扱う。サンプリング周波数は`time`差分の中央値から、記録時間は先頭時刻と末尾時刻の差から算出する。

### 6.2 Response `200 OK`

```json
{
  "fileName": "sample.csv",
  "samplingRate": 250.0,
  "duration": 0.008,
  "channels": ["Fp1", "Fp2"],
  "data": [
    [1.0, 1.1, 1.2],
    [2.0, 2.1, 2.2]
  ]
}
```

### 6.3 `400 Bad Request`

| 条件 | `detail` |
|---|---|
| ファイル名が`.csv`で終わらない | `Only CSV files are supported.` |
| pandasでCSVを読み込めない | `Failed to read CSV file.` |
| CSVにデータ行がない | `CSV file is empty.` |
| `time`列がない | `CSV must contain a 'time' column.` |
| `time`以外の列がない | `No EEG channels found.` |
| 時刻またはEEG値を数値へ変換できない | `EEG data must contain numeric values.` |
| EEG値に欠損がある | `Missing EEG values are not supported yet.` |
| サンプル数が2未満 | `At least two samples are required.` |
| 時刻が増加していない | `Time values must be increasing.` |

## 7. EEG Filter API

EEGデータへHigh-pass、Low-passおよびNotch Filterを任意に適用する。

```http
POST /api/eeg/filter
Content-Type: application/json
```

### 7.1 Request

| 項目 | JSON型 | 必須 | 内容 |
|---|---|---|---|
| `fileName` | string | 必須 | CSVファイル名 |
| `samplingRate` | number | 必須 | サンプリング周波数（Hz） |
| `duration` | number | 必須 | 記録時間（秒） |
| `channels` | string[] | 必須 | チャンネル名 |
| `data` | number[][] | 必須 | Original EEG `[channel][sample]` |
| `highpassHz` | number / null | 任意 | High-pass cutoff。省略時・`null`はOFF |
| `lowpassHz` | number / null | 任意 | Low-pass cutoff。省略時・`null`はOFF |
| `notchHz` | number / null | 任意 | Notch中心周波数。省略時・`null`はOFF |

```json
{
  "fileName": "sample.csv",
  "samplingRate": 250.0,
  "duration": 10.0,
  "channels": ["Fp1", "Fp2"],
  "data": [
    [1.0, 1.1, 1.2],
    [2.0, 2.1, 2.2]
  ],
  "highpassHz": 0.5,
  "lowpassHz": 40.0,
  "notchHz": 50.0
}
```

### 7.2 Response `200 OK`

Requestの基本情報とFilter設定を引き継ぎ、`data`をFilter済み配列へ置き換えて返す。

```json
{
  "fileName": "sample.csv",
  "samplingRate": 250.0,
  "duration": 10.0,
  "channels": ["Fp1", "Fp2"],
  "data": [
    [0.01, 0.08, 0.03],
    [-0.02, 0.05, 0.01]
  ],
  "highpassHz": 0.5,
  "lowpassHz": 40.0,
  "notchHz": 50.0
}
```

### 7.3 `400 Bad Request`

主な条件は以下のとおりである。

- `samplingRate`が0以下
- EEGデータが空、2次元でない、2サンプル未満、または非有限値を含む
- 各Filter周波数が0以下またはNyquist周波数以上
- `highpassHz >= lowpassHz`

エラー本文は以下の形式で、信号処理Serviceの`ValueError`メッセージを`detail`へ設定する。

```json
{
  "detail": "High-pass frequency must be lower than low-pass frequency."
}
```

Nyquist周波数は`samplingRate / 2`である。例えば250 Hzで収録した信号では、各Filter周波数を125 Hz未満にする必要がある。

## 8. EEG PSD API

Welch法を使用して、各チャンネルのPower Spectral Densityを計算する。

```http
POST /api/eeg/psd
Content-Type: application/json
```

### 8.1 Request

```json
{
  "fileName": "sample.csv",
  "samplingRate": 250.0,
  "channels": ["Fp1", "Fp2"],
  "data": [
    [1.0, 1.1, 1.2],
    [2.0, 2.1, 2.2]
  ]
}
```

| 項目 | JSON型 | 必須 | 内容 |
|---|---|---|---|
| `fileName` | string | 必須 | CSVファイル名 |
| `samplingRate` | number | 必須 | サンプリング周波数（Hz） |
| `channels` | string[] | 必須 | チャンネル名 |
| `data` | number[][] | 必須 | 選択中のEEG `[channel][sample]` |

### 8.2 Response `200 OK`

```json
{
  "fileName": "sample.csv",
  "samplingRate": 250.0,
  "channels": ["Fp1", "Fp2"],
  "frequencies": [0.0, 0.5, 1.0],
  "psd": [
    [0.01, 0.04, 0.02],
    [0.02, 0.03, 0.01]
  ]
}
```

`frequencies[frequencyIndex]`と`psd[channelIndex][frequencyIndex]`が対応する。`psd`の単位は、入力EEG値の単位を`U`とすると`U²/Hz`になる。

### 8.3 `400 Bad Request`

`samplingRate`が0以下、またはEEGデータが空、2次元でない、2サンプル未満、非有限値を含む場合に返す。形式はFilter APIと同じく`{"detail": "..."}`である。

## 9. EEG Band Power API

Welch法で計算したPSDを周波数帯域ごとに数値積分し、チャンネル別のBand Powerを返す。

```http
POST /api/eeg/band-power
Content-Type: application/json
```

### 9.1 Request

Request形式はPSD APIと同じである。

```json
{
  "fileName": "sample.csv",
  "samplingRate": 250.0,
  "channels": ["Fp1", "Fp2"],
  "data": [
    [1.0, 1.1, 1.2],
    [2.0, 2.1, 2.2]
  ]
}
```

### 9.2 Response `200 OK`

```json
{
  "fileName": "sample.csv",
  "samplingRate": 250.0,
  "channels": ["Fp1", "Fp2"],
  "bandPower": {
    "delta": [0.12, 0.10],
    "theta": [0.08, 0.07],
    "alpha": [0.30, 0.25],
    "beta": [0.15, 0.14],
    "gamma": [0.04, 0.03]
  }
}
```

| キー | 周波数範囲 | 上限の扱い |
|---|---:|---|
| `delta` | 0.5–4 Hz | 4 Hz未満 |
| `theta` | 4–8 Hz | 8 Hz未満 |
| `alpha` | 8–13 Hz | 13 Hz未満 |
| `beta` | 13–30 Hz | 30 Hz未満 |
| `gamma` | 30–45 Hz | 45 Hz未満 |

各配列の添字は`channels`と対応する。例えば`bandPower.alpha[0]`は`channels[0]`のAlpha Powerである。

### 9.3 `400 Bad Request`

PSD APIと同じ入力検証に加え、ある帯域に数値積分可能な周波数点が2点以上存在しない場合に返す。

```json
{
  "detail": "Not enough frequency points to calculate gamma power."
}
```

## 10. 共通エラー仕様

### 10.1 `400 Bad Request`

Routerまたは信号処理Serviceが、データ内容や解析条件を不正と判定した場合に返す。

```json
{
  "detail": "エラー内容"
}
```

### 10.2 `422 Unprocessable Entity`

JSONの必須項目不足や型不一致など、RequestがPydanticモデルに合わない場合はFastAPIが自動で返す。処理関数は実行されない。

例：`samplingRate`を省略した場合

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "samplingRate"],
      "msg": "Field required"
    }
  ]
}
```

Pydanticのバージョンによって、エラー項目が追加される場合がある。

### 10.3 `500 Internal Server Error`

想定外の例外が発生した場合にFastAPIが返す。現在は共通例外ハンドラーを実装していない。

## 11. Frontendとの対応

| API | Frontend関数 | 戻り値のTypeScript型 |
|---|---|---|
| `/health` | `checkAPIHealth()` | `boolean` |
| `/api/eeg/upload` | `uploadEEGFile()` | `EEGData` |
| `/api/eeg/filter` | `filterEEGData()` | `EEGFilteredData` |
| `/api/eeg/psd` | `calculatePSD()` | `EEGPSDData` |
| `/api/eeg/band-power` | `calculateBandPower()` | `EEGBandPowerData` |

BackendのPydanticモデルが実行時の入出力検証を担当し、FrontendのTypeScript型が開発・ビルド時の型確認を担当する。両者は自動同期されないため、API項目を変更する場合は双方を更新する必要がある。

Upload API以外の解析APIは、エラー時にBackendの`detail`をFrontendへ表示する。Upload APIのFrontend実装は現在、固定メッセージ`Failed to upload EEG file`を使用するため、Backendの具体的な`detail`を画面へ伝達しない。

## 12. 現在の制約

- 認証・認可およびAPIキーを実装していない。
- APIのURLはFrontendで`http://localhost:8000`に固定している。
- CORSは`http://localhost:5173`だけを許可している。
- Request上の`channels`数と`data`のチャンネル数が一致するかを明示的に検証していない。
- 全チャンネルのサンプル数が同じかをPydanticモデルでは明示的に検証していない。
- 大きなEEGデータもJSON配列として送受信する。
- Upload APIはCSVのみ対応し、EDF等には対応していない。
- CSVおよび解析結果をBackendへ永続化しない。
- 共通エラーレスポンス形式やログ出力を統一していない。
