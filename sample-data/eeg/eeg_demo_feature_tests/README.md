# EEG解析アプリ用 デモ・機能確認テストデータ

## 1. 目的

本テストデータは、EEG解析アプリの各機能が想定どおり動作していることを、デモ時に分かりやすく確認するための**合成データ**です。

実際の臨床EEGではなく、以下の機能を明確に確認できるよう、意図的に特徴を持たせています。

- 波形表示
- PSD（Power Spectral Density）
- Band Power
- フィルタ処理
- 欠損検出
- 線形補完
- AI補完
- RMSE / MAE / 相関係数による補完性能評価

---

## 2. 共通仕様

- サンプリング周波数：250 Hz
- 記録時間：30秒
- チャンネル数：8
- チャンネル：
  - Fp1
  - Fp2
  - F3
  - F4
  - C3
  - C4
  - O1
  - O2
- CSV形式：

```text
time,Fp1,Fp2,F3,F4,C3,C4,O1,O2
```

- `time`：秒
- EEG値：合成された振幅値
- `index`列は使用していません

> 本データはアプリの機能確認・デモ用に作成した合成EEGであり、実測脳波ではありません。

---

# 3. 各テストデータ

## 01_psd_bandpower_channel_test.csv

### 目的

PSDおよびBand Powerの計算が正しく動作しているか確認します。

各チャンネルに、あらかじめ異なる周波数成分を強く入れています。

| Channel | 主成分 | 周波数 | 想定Band |
|---|---:|---:|---|
| Fp1 | 低周波成分 | 2 Hz | Delta |
| Fp2 | 低周波成分 | 6 Hz | Theta |
| F3 | Alpha成分 | 10 Hz | Alpha |
| F4 | Alpha成分 | 10 Hz | Alpha |
| C3 | Beta成分 | 20 Hz | Beta |
| C4 | Beta成分 | 20 Hz | Beta |
| O1 | Gamma成分 | 35 Hz | Gamma |
| O2 | Alpha成分 | 10 Hz | Alpha |

### 期待される結果

PSDでは、それぞれのチャンネルで上記周波数付近に明確なピークが出ることを確認します。

Band Powerでは、例えば以下のような結果が期待されます。

```text
Fp1 → Delta が最大
Fp2 → Theta が最大
F3  → Alpha が最大
C3  → Beta が最大
O1  → Gamma が最大
```

### デモ時の説明例

「各チャンネルに既知の周波数成分を入れており、解析結果がその設計どおりになるかを確認しています。」

---

## 02_filter_50hz_and_drift_test.csv

### 目的

フィルタ処理によって不要な周波数成分が除去されることを確認します。

主に以下の成分を含んでいます。

- 10 Hz：残したい信号
- 50 Hz：電源ノイズを模擬した成分
- 0.4 Hz：ベースラインドリフトを模擬した低周波成分

### 期待される結果

フィルタ前：

- 波形に低周波ドリフトが見える
- PSDに50 Hz成分が強く現れる
- 10 Hz成分も存在する

フィルタ後：

- 低周波ドリフトが抑制される
- 50 Hz成分が抑制される
- 10 Hz付近の信号成分が残る

### デモ時の説明例

「意図的に50 Hzノイズと低周波ドリフトを加え、フィルタ処理前後で不要成分が除去されることを確認しています。」

---

## 03_reconstruction_ground_truth.csv

### 目的

欠損補完性能を評価するための**正解データ（Ground Truth）**です。

このデータ自体には欠損はありません。

### 使用方法

`04_reconstruction_missing.csv` に対して補完処理を行った後、欠損区間における補完結果を本ファイルと比較します。

評価指標：

- RMSE
- MAE
- 相関係数

---

## 04_reconstruction_missing.csv

### 目的

欠損検出、線形補完、AI補完の機能確認に使用します。

### 欠損区間

以下の区間で全EEGチャンネルを欠損させています。

| Start | End | 欠損時間 |
|---:|---:|---:|
| 5.0 s | 5.5 s | 0.5 s |
| 12.0 s | 13.0 s | 1.0 s |
| 20.0 s | 21.5 s | 1.5 s |

### 期待される結果

アプリ側で以下が確認できます。

1. 欠損区間を検出
2. 線形補完を実行
3. AI補完を実行
4. `03_reconstruction_ground_truth.csv` と比較
5. RMSE / MAE / 相関係数を算出

### 比較の考え方

線形補完では、欠損区間の前後を直線的につなぐため、周期性を持つEEG波形を十分に再現できない場合があります。

AI補完では、周辺波形の特徴や周期性を利用して、より元波形に近い再構成ができるかを確認します。

---

## 05_presentation_demo_clean.csv

### 目的

研究室見学やプレゼンで、アプリ全体を見せるためのデモ用データです。

### 特徴

- 10 Hz付近のAlpha成分を明確に設定
- O1 / O2でAlpha成分を強めに設定
- Fp1 / Fp2に瞬目アーチファクトを模擬した波形を追加
- 適度なノイズを付加

### 期待される結果

- EEGらしい波形表示
- PSDで10 Hz付近にピーク
- Band PowerでAlphaが確認しやすい
- Fp1 / Fp2の8秒付近で瞬目様の大きな変化

### 用途

アプリの基本画面、波形表示、PSD、Band Powerを一通り見せる場合に使用します。

---

## 06_presentation_demo_missing.csv

### 目的

`05_presentation_demo_clean.csv` に欠損区間を追加したデモ用データです。

### 欠損区間

```text
16.0 s ～ 17.0 s
```

### 用途

1つのCSVで、

- 波形表示
- PSD
- Band Power
- 欠損検出
- Reconstruction

まで一連の操作を見せたい場合に使用します。

---

# 4. 推奨デモ手順

## Demo 1：PSD / Band Power

使用ファイル：

```text
01_psd_bandpower_channel_test.csv
```

確認内容：

1. CSVを読み込む
2. チャンネルを変更する
3. PSDのピーク位置を確認する
4. Band Powerの最大帯域を確認する

例：

```text
Fp1 → Delta
Fp2 → Theta
F3  → Alpha
C3  → Beta
O1  → Gamma
```

このデータは「正しい結果が事前に分かっている」ため、解析機能の動作確認に適しています。

---

## Demo 2：Filtering

使用ファイル：

```text
02_filter_50hz_and_drift_test.csv
```

確認内容：

1. フィルタ前の波形・PSDを表示
2. フィルタを適用
3. 低周波ドリフトの減少を確認
4. 50 Hz成分の減少を確認
5. 10 Hz成分が残っていることを確認

---

## Demo 3：Reconstruction

使用ファイル：

```text
03_reconstruction_ground_truth.csv
04_reconstruction_missing.csv
```

確認内容：

1. 欠損データを読み込む
2. 欠損区間を検出
3. 線形補完
4. AI補完
5. Ground Truthと比較
6. RMSE / MAE / 相関係数を比較

---

# 5. 評価指標

## RMSE

Root Mean Squared Error。

元波形と補完波形の誤差を二乗して平均し、平方根を取った値です。

```text
小さいほど良い
```

大きな誤差の影響を比較的強く受けます。

---

## MAE

Mean Absolute Error。

元波形と補完波形の絶対誤差の平均です。

```text
小さいほど良い
```

RMSEよりも外れ値の影響を受けにくい指標です。

---

## 相関係数

元波形と補完波形の波形形状の類似度を確認します。

```text
1に近いほど波形形状が似ている
0付近では相関が弱い
-1に近いほど逆方向の形状
```

---

# 6. 注意事項

- 本データは**機能確認のための合成EEG**です。
- 実際の臨床EEGや研究用EEGの代替ではありません。
- PSDやBand Powerの境界周波数は、アプリ側の帯域定義によって判定が変わる可能性があります。
- フィルタ結果は、ButterworthフィルタやNotchフィルタなど、アプリ側の設定によって変化します。
- AI補完が常に線形補完より高性能になることを保証するデータではありません。
- Reconstruction評価では、**欠損区間のみを対象にGround Truthと比較する**ことを推奨します。

---

# 7. ファイル一覧

```text
01_psd_bandpower_channel_test.csv
02_filter_50hz_and_drift_test.csv
03_reconstruction_ground_truth.csv
04_reconstruction_missing.csv
05_presentation_demo_clean.csv
06_presentation_demo_missing.csv
```

研究室見学やプレゼンでは、用途に応じてデータを切り替えることで、各機能を分かりやすく説明できます。
