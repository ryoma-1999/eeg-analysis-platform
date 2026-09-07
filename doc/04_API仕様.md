# API仕様

## 1. 共通

- Framework: FastAPI
- Router prefix: `/api/eeg`
- 解析用EEG配列: `[channel][sample]`
- 正常時: JSON
- 入力・処理エラー: HTTP 400と`detail`
- Pydantic形式エラー: HTTP 422

## 2. Endpoint一覧

| Method | Path | 用途 |
|---|---|---|
| GET | `/` | APIメッセージ |
| GET | `/health` | Health Check |
| POST | `/api/eeg/upload` | CSV読込・欠損検出 |
| POST | `/api/eeg/reconstruct` | 線形補間 |
| POST | `/api/eeg/reconstruct-mlp` | MLP補完 |
| POST | `/api/eeg/reconstruction/evaluate-linear` | 線形補間評価 |
| POST | `/api/eeg/reconstruction/evaluate-mlp` | MLP補完評価 |
| POST | `/api/eeg/filter` | EEG Filter |
| POST | `/api/eeg/psd` | PSD計算 |
| POST | `/api/eeg/band-power` | Band Power計算 |

## 3. Upload

`POST /api/eeg/upload`へ`multipart/form-data`の`file`としてCSVを送る。

```json
{
  "fileName": "sample.csv",
  "samplingRate": 250.0,
  "duration": 30.0,
  "channels": ["Fp1", "Fp2"],
  "data": [[1.0, null], [2.0, 2.1]],
  "missingData": {
    "hasMissing": true,
    "totalMissingCount": 1,
    "totalValueCount": 4,
    "missingRate": 0.25,
    "channels": []
  }
}
```

実際の`missingData.channels`には欠損のあるチャンネルと連続区間が格納される。

## 4. 再構築

LinearとMLPは共通Requestを使用する。

```json
{
  "fileName": "sample.csv",
  "samplingRate": 250.0,
  "duration": 30.0,
  "channels": ["Fp1", "Fp2"],
  "data": [[1.0, null, 1.2], [2.0, 2.1, 2.2]]
}
```

Responseには欠損のない`data`、`reconstructionMethod`（`linear`または`mlp`）、`reconstructedCount`が含まれる。

## 5. 再構築評価

```json
{
  "fileName": "complete.csv",
  "samplingRate": 250.0,
  "channels": ["Fp1", "Fp2"],
  "data": [[1.0, 1.1, 1.2], [2.0, 2.1, 2.2]],
  "maskRate": 0.1,
  "gapDurationSeconds": 0.2,
  "randomSeed": 42
}
```

```json
{
  "method": "mlp",
  "maskRate": 0.1,
  "gapDurationSeconds": 0.2,
  "maskedCount": 100,
  "rmse": 9.979,
  "mae": 7.7837,
  "correlation": 0.6271,
  "channelMetrics": []
}
```

`correlation`は分散不足などで計算不能な場合`null`となる。チャンネル別指標は`channelIndex`、`maskedCount`、`rmse`、`mae`を持つ。

## 6. Filter

RequestはEEG共通情報に`highpassHz`、`lowpassHz`、`notchHz`を追加する。使用しないFilterは`null`とする。ResponseはFilter後の`data`と適用設定を返す。

## 7. PSD

Requestは`fileName`、`samplingRate`、`channels`、`data`。Responseは`frequencies`と、チャンネルごとの`psd`を返す。

## 8. Band Power

RequestはPSDと同じ。Responseの`bandPower`は`delta`、`theta`、`alpha`、`beta`、`gamma`ごとにチャンネル数分の値を返す。

## 9. Health Check

`GET /health`

```json
{"status": "ok"}
```
