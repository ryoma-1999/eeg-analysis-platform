import numpy as np

from scipy.signal import (
    butter,
    filtfilt,
    iirnotch,
    sosfiltfilt,
)


def apply_eeg_filter(
    data: list[list[float]],
    sampling_rate: float,
    highpass_hz: float | None = None,
    lowpass_hz: float | None = None,
    notch_hz: float | None = None,
) -> list[list[float]]:
    """
    EEGデータにフィルタを適用する。

    data:
        EEGデータ
        [channel][sample]

    sampling_rate:
        サンプリング周波数
        例: 250 Hz

    highpass_hz:
        High-pass filterのカットオフ周波数
        Noneの場合はOFF

    lowpass_hz:
        Low-pass filterのカットオフ周波数
        Noneの場合はOFF

    notch_hz:
        Notch filterの中心周波数
        Noneの場合はOFF
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

    # [channel][sample] の
    # 2次元データになっているか
    if eeg_array.ndim != 2:
        raise ValueError(
            "EEG data must be a 2D array."
        )

    # チャンネル数・サンプル数
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

    # NaNやinfが含まれていないか
    if not np.all(
        np.isfinite(eeg_array)
    ):
        raise ValueError(
            "EEG data contains invalid values."
        )

    # -------------------------
    # Nyquist周波数
    # -------------------------

    nyquist = sampling_rate / 2.0

    # -------------------------
    # High-passチェック
    # -------------------------

    if highpass_hz is not None:
        if highpass_hz <= 0:
            raise ValueError(
                "High-pass frequency "
                "must be greater than 0 Hz."
            )

        if highpass_hz >= nyquist:
            raise ValueError(
                "High-pass frequency "
                "must be below the "
                "Nyquist frequency."
            )

    # -------------------------
    # Low-passチェック
    # -------------------------

    if lowpass_hz is not None:
        if lowpass_hz <= 0:
            raise ValueError(
                "Low-pass frequency "
                "must be greater than 0 Hz."
            )

        if lowpass_hz >= nyquist:
            raise ValueError(
                "Low-pass frequency "
                "must be below the "
                "Nyquist frequency."
            )

    # -------------------------
    # High-passとLow-passの
    # 関係チェック
    # -------------------------

    if (
        highpass_hz is not None
        and lowpass_hz is not None
    ):
        if highpass_hz >= lowpass_hz:
            raise ValueError(
                "High-pass frequency "
                "must be lower than "
                "low-pass frequency."
            )

    # -------------------------
    # Notchチェック
    # -------------------------

    if notch_hz is not None:
        if notch_hz <= 0:
            raise ValueError(
                "Notch frequency "
                "must be greater than 0 Hz."
            )

        if notch_hz >= nyquist:
            raise ValueError(
                "Notch frequency "
                "must be below the "
                "Nyquist frequency."
            )

    # -------------------------
    # 元データをコピー
    # -------------------------

    filtered_data = eeg_array.copy()

    # -------------------------
    # Band-pass Filter
    # -------------------------

    if (
        highpass_hz is not None
        and lowpass_hz is not None
    ):
        sos = butter(
            N=4,
            Wn=[
                highpass_hz,
                lowpass_hz,
            ],
            btype="bandpass",
            fs=sampling_rate,
            output="sos",
        )

        filtered_data = sosfiltfilt(
            sos,
            filtered_data,
            axis=1,
        )

    # -------------------------
    # High-pass Filter
    # -------------------------

    elif highpass_hz is not None:
        sos = butter(
            N=4,
            Wn=highpass_hz,
            btype="highpass",
            fs=sampling_rate,
            output="sos",
        )

        filtered_data = sosfiltfilt(
            sos,
            filtered_data,
            axis=1,
        )

    # -------------------------
    # Low-pass Filter
    # -------------------------

    elif lowpass_hz is not None:
        sos = butter(
            N=4,
            Wn=lowpass_hz,
            btype="lowpass",
            fs=sampling_rate,
            output="sos",
        )

        filtered_data = sosfiltfilt(
            sos,
            filtered_data,
            axis=1,
        )

    # -------------------------
    # Notch Filter
    # -------------------------

    if notch_hz is not None:
        quality_factor = 30.0

        b, a = iirnotch(
            w0=notch_hz,
            Q=quality_factor,
            fs=sampling_rate,
        )

        filtered_data = filtfilt(
            b,
            a,
            filtered_data,
            axis=1,
        )

    # -------------------------
    # Python listへ戻す
    # -------------------------

    return filtered_data.tolist()