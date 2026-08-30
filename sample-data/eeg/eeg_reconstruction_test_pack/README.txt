EEG Reconstruction test pack
Sampling rate: 250 Hz
Duration: 30 s
Channels: Fp1, Fp2, F3, F4, C3, C4, O1, O2
Format: time + 8 EEG channels, compatible with the current sample CSV format.

Recommended order:
01_easy_clean_periodic:
  Very predictable periodic signal. MLP should perform extremely well.

02_medium_eeg_like:
  Multi-band, amplitude modulation, baseline drift, colored/random noise.
  Better approximation of ordinary synthetic EEG.

03_hard_nonstationary:
  Bursts, transient artifacts, changing local structure.
  Tests whether reconstruction degrades gracefully.

04_very_hard_transients:
  Abrupt state changes and unpredictable sharp events.
  Designed to expose the limits of reconstruction. A model cannot recover
  truly unpredictable events that happen entirely inside a missing segment.

Current app evaluation settings observed in the repository:
  maskRate = 0.10
  gapDurationSeconds = 0.20
  randomSeed = 42

Start by uploading each complete CSV and run:
  Evaluate Linear
  Evaluate AI

Record RMSE, MAE, Correlation for each file.
