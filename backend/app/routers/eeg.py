from fastapi import (
    APIRouter,
    HTTPException,
    UploadFile,
)

import numpy as np
import pandas as pd

from app.schemas.eeg import (
    EEGBandPowerRequest,
    EEGBandPowerResponse,
    EEGFilterRequest,
    EEGFilterResponse,
    EEGPSDRequest,
    EEGPSDResponse,
    EEGUploadResponse,
)

from app.services.eeg_filter import (
    apply_eeg_filter,
)

from app.services.eeg_spectral import (
    calculate_band_power,
    calculate_psd,
)


router = APIRouter()


# -------------------------
# EEG Upload API
# -------------------------

@router.post(
    "/upload",
    response_model=EEGUploadResponse,
)
def upload_eeg(file: UploadFile):
    filename = file.filename or ""

    # CSV以外は受け付けない
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported.",
        )

    # CSV読み込み
    try:
        df = pd.read_csv(file.file)

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Failed to read CSV file.",
        ) from exc

    # 空CSVチェック
    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="CSV file is empty.",
        )

    # time列チェック
    if "time" not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=(
                "CSV must contain a "
                "'time' column."
            ),
        )

    # time以外をEEGチャンネルとして扱う
    channels = [
        column
        for column in df.columns
        if column != "time"
    ]

    if not channels:
        raise HTTPException(
            status_code=400,
            detail="No EEG channels found.",
        )

    # 数値データへ変換
    try:
        time_values = (
            df["time"]
            .astype(float)
            .to_numpy()
        )

        eeg_values = (
            df[channels]
            .astype(float)
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=(
                "EEG data must contain "
                "numeric values."
            ),
        ) from exc

    # 欠損値チェック
    if eeg_values.isnull().values.any():
        raise HTTPException(
            status_code=400,
            detail=(
                "Missing EEG values "
                "are not supported yet."
            ),
        )

    # 最低2サンプル必要
    if len(time_values) < 2:
        raise HTTPException(
            status_code=400,
            detail=(
                "At least two samples "
                "are required."
            ),
        )

    # サンプリング間隔
    time_diff = np.diff(time_values)

    if np.any(time_diff <= 0):
        raise HTTPException(
            status_code=400,
            detail=(
                "Time values must "
                "be increasing."
            ),
        )

    # サンプリング周波数
    sampling_rate = float(
        1.0 / np.median(time_diff)
    )

    # 記録時間
    duration = float(
        time_values[-1]
        - time_values[0]
    )

    # [sample][channel]
    # ↓
    # [channel][sample]
    data = (
        eeg_values
        .to_numpy()
        .T
        .tolist()
    )

    return EEGUploadResponse(
        fileName=filename,
        samplingRate=sampling_rate,
        duration=duration,
        channels=channels,
        data=data,
    )


# -------------------------
# EEG Filter API
# -------------------------

@router.post(
    "/filter",
    response_model=EEGFilterResponse,
)
def filter_eeg(
    request: EEGFilterRequest,
):
    """
    EEGデータに任意のフィルタを適用する。

    highpassHz:
        High-pass filter

    lowpassHz:
        Low-pass filter

    notchHz:
        Notch filter

    Noneの場合は、そのフィルタを適用しない。
    """

    try:
        filtered_data = apply_eeg_filter(
            data=request.data,
            sampling_rate=request.samplingRate,
            highpass_hz=request.highpassHz,
            lowpass_hz=request.lowpassHz,
            notch_hz=request.notchHz,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    return EEGFilterResponse(
        fileName=request.fileName,
        samplingRate=request.samplingRate,
        duration=request.duration,
        channels=request.channels,
        data=filtered_data,
        highpassHz=request.highpassHz,
        lowpassHz=request.lowpassHz,
        notchHz=request.notchHz,
    )

# -------------------------
# EEG PSD API
# -------------------------

@router.post(
    "/psd",
    response_model=EEGPSDResponse,
)
def calculate_eeg_psd(
    request: EEGPSDRequest,
):
    """
    EEGデータからWelch法を使って
    PSDを計算する。
    """

    try:
        frequencies, psd = calculate_psd(
            data=request.data,
            sampling_rate=request.samplingRate,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    return EEGPSDResponse(
        fileName=request.fileName,
        samplingRate=request.samplingRate,
        channels=request.channels,
        frequencies=frequencies,
        psd=psd,
    )

# -------------------------
# EEG Band Power API
# -------------------------

@router.post(
    "/band-power",
    response_model=EEGBandPowerResponse,
)
def calculate_eeg_band_power(
    request: EEGBandPowerRequest,
):
    """
    EEGデータから各周波数帯域の
    Band Powerを計算する。
    """

    try:
        band_power = calculate_band_power(
            data=request.data,
            sampling_rate=request.samplingRate,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    return EEGBandPowerResponse(
        fileName=request.fileName,
        samplingRate=request.samplingRate,
        channels=request.channels,
        bandPower=band_power,
    )