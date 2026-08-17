import numpy as np

from scipy.integrate import trapezoid
from scipy.signal import welch


# -------------------------
# EEGスペクトル解析
# -------------------------

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
        例: 250 Hz

    returns:
        frequencies:
            周波数軸
            [frequency]

        psd:
            各チャンネルのPSD
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


# -------------------------
# Band Power
# -------------------------

def calculate_band_power(
    data: list[list[float]],
    sampling_rate: float,
) -> dict[
    str,
    list[float],
]:
    """
    EEGデータから各周波数帯域の
    Band Powerを計算する。

    returns:
        {
            "delta": [channelごとのpower],
            "theta": [channelごとのpower],
            "alpha": [channelごとのpower],
            "beta":  [channelごとのpower],
            "gamma": [channelごとのpower],
        }
    """

    # -------------------------
    # PSDを計算
    # -------------------------

    frequencies, psd = calculate_psd(
        data=data,
        sampling_rate=sampling_rate,
    )

    frequencies_array = np.asarray(
        frequencies,
        dtype=float,
    )

    psd_array = np.asarray(
        psd,
        dtype=float,
    )

    # -------------------------
    # EEG周波数帯
    # -------------------------

    bands = {
        "delta": (0.5, 4.0),
        "theta": (4.0, 8.0),
        "alpha": (8.0, 13.0),
        "beta": (13.0, 30.0),
        "gamma": (30.0, 45.0),
    }

    # -------------------------
    # Band Power計算
    # -------------------------

    band_power: dict[
        str,
        list[float],
    ] = {}

    for (
        band_name,
        (
            low_frequency,
            high_frequency,
        ),
    ) in bands.items():

        # -------------------------
        # 対象周波数帯を抽出
        # -------------------------

        frequency_mask = (
            (frequencies_array >= low_frequency)
            & (frequencies_array < high_frequency)
        )

        band_frequencies = (
            frequencies_array[
                frequency_mask
            ]
        )

        band_psd = (
            psd_array[
                :,
                frequency_mask
            ]
        )

        # -------------------------
        # 周波数点チェック
        # -------------------------

        if band_frequencies.size < 2:
            raise ValueError(
                f"Not enough frequency points "
                f"to calculate {band_name} power."
            )

        # -------------------------
        # PSDを積分
        # -------------------------

        power = trapezoid(
            band_psd,
            band_frequencies,
            axis=1,
        )

        # -------------------------
        # 結果保存
        # -------------------------

        band_power[
            band_name
        ] = power.tolist()

    return band_power