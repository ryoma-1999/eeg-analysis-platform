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
    EEGChannelMissingInfo,
    EEGMissingDataInfo,
    EEGMissingSegment,
    EEGPSDRequest,
    EEGPSDResponse,
    EEGReconstructionRequest,
    EEGReconstructionResponse,
    EEGUploadResponse,
)

from app.services.eeg_filter import (
    apply_eeg_filter,
)

from app.services.eeg_spectral import (
    calculate_band_power,
    calculate_psd,
)

from app.services.eeg_reconstruction import (
    reconstruct_eeg_linear,
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

    # 欠損情報をチャンネルごとに集計
    missing_channels = []
    total_missing_count = 0
    sample_count = len(time_values)

    for channel in channels:
        missing_mask = (
            eeg_values[channel]
            .isnull()
            .to_numpy()
        )

        missing_count = int(
            missing_mask.sum()
        )
        total_missing_count += missing_count

        segments = []
        segment_start = None

        for index, is_missing in enumerate(
            missing_mask
        ):
            if is_missing and segment_start is None:
                segment_start = index

            is_last_sample = (
                index == sample_count - 1
            )

            if (
                segment_start is not None
                and (
                    not is_missing
                    or is_last_sample
                )
            ):
                segment_end = (
                    index
                    if is_missing and is_last_sample
                    else index - 1
                )

                segments.append(
                    EEGMissingSegment(
                        startSample=segment_start,
                        endSample=segment_end,
                        sampleCount=(
                            segment_end
                            - segment_start
                            + 1
                        ),
                        startTime=float(
                            time_values[segment_start]
                        ),
                        endTime=float(
                            time_values[segment_end]
                        ),
                    )
                )
                segment_start = None

        if missing_count > 0:
            missing_channels.append(
                EEGChannelMissingInfo(
                    channel=channel,
                    missingCount=missing_count,
                    missingRate=(
                        missing_count
                        / sample_count
                    ),
                    segments=segments,
                )
            )

    total_value_count = (
        sample_count * len(channels)
    )

    missing_data = EEGMissingDataInfo(
        hasMissing=total_missing_count > 0,
        totalMissingCount=total_missing_count,
        totalValueCount=total_value_count,
        missingRate=(
            total_missing_count
            / total_value_count
        ),
        channels=missing_channels,
    )

    # [sample][channel]
    # ↓
    # [channel][sample]
    data = [
        [
            None
            if pd.isna(value)
            else float(value)
            for value in eeg_values[channel]
        ]
        for channel in channels
    ]

    return EEGUploadResponse(
        fileName=filename,
        samplingRate=sampling_rate,
        duration=duration,
        channels=channels,
        data=data,
        missingData=missing_data,
    )


# -------------------------
# EEG Reconstruction API
# -------------------------

@router.post(
    "/reconstruct",
    response_model=EEGReconstructionResponse,
)
def reconstruct_eeg(
    request: EEGReconstructionRequest,
):
    try:
        reconstructed_data, reconstructed_count = (
            reconstruct_eeg_linear(
                data=request.data,
            )
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    total_value_count = sum(
        len(channel_data)
        for channel_data in reconstructed_data
    )

    return EEGReconstructionResponse(
        fileName=request.fileName,
        samplingRate=request.samplingRate,
        duration=request.duration,
        channels=request.channels,
        data=reconstructed_data,
        missingData=EEGMissingDataInfo(
            hasMissing=False,
            totalMissingCount=0,
            totalValueCount=total_value_count,
            missingRate=0.0,
            channels=[],
        ),
        reconstructionMethod="linear",
        reconstructedCount=reconstructed_count,
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
