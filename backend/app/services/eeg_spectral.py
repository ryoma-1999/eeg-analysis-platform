import numpy as np

from scipy.signal import welch


def calculate_psd(
    data: list[list[float]],
    sampling_rate: float,
) -> tuple[
    list[float],
    list[list[float]],
]:
    """
    EEGデータからWelch法でPSDを計算する。

    data:
        EEGデータ
        [channel][sample]

    sampling_rate:
        サンプリング周波数

    returns:
        frequencies:
            [frequency]

        psd:
            [channel][frequency]
    """

    # -------------------------
    # 基本チェック
    # -------------------------

    if sampling_rate <= 0:
        raise ValueError(
            "Sampling rate must be greater than 0."
        )

    if not data:
        raise ValueError(
            "EEG data is empty."
        )

    # -------------------------
    # NumPy配列へ変換
    # -------------------------

    eeg_array = np.asarray(
        data,
        dtype=float,
    )

    if eeg_array.ndim != 2:
        raise ValueError(
            "EEG data must be a 2D array."
        )

    channel_count = eeg_array.shape[0]
    sample_count = eeg_array.shape[1]

    if channel_count == 0:
        raise ValueError(
            "No EEG channels found."
        )

    if sample_count < 2:
        raise ValueError(
            "At least two samples are required."
        )

    if not np.all(
        np.isfinite(eeg_array)
    ):
        raise ValueError(
            "EEG data contains invalid values."
        )

    # -------------------------
    # Welch法の設定
    # -------------------------

    # 1区間を2秒分にする
    segment_samples = int(
        sampling_rate * 2
    )

    # データ全体が2秒未満なら
    # 存在するサンプル数を使う
    nperseg = min(
        segment_samples,
        sample_count,
    )

    # 50% overlap
    noverlap = nperseg // 2

    # -------------------------
    # PSD計算
    # -------------------------

    frequencies, psd = welch(
        eeg_array,
        fs=sampling_rate,
        nperseg=nperseg,
        noverlap=noverlap,
        axis=1,
        detrend="constant",
        scaling="density",
    )

    # -------------------------
    # Python listへ戻す
    # -------------------------

    return (
        frequencies.tolist(),
        psd.tolist(),
    )