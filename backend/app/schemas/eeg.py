from pydantic import BaseModel


# -------------------------
# EEG Upload
# -------------------------

class EEGMissingSegment(BaseModel):
    startSample: int
    endSample: int
    sampleCount: int
    startTime: float
    endTime: float


class EEGChannelMissingInfo(BaseModel):
    channel: str
    missingCount: int
    missingRate: float
    segments: list[EEGMissingSegment]


class EEGMissingDataInfo(BaseModel):
    hasMissing: bool
    totalMissingCount: int
    totalValueCount: int
    missingRate: float
    channels: list[EEGChannelMissingInfo]


class EEGUploadResponse(BaseModel):
    fileName: str
    samplingRate: float
    duration: float
    channels: list[str]
    data: list[list[float | None]]
    missingData: EEGMissingDataInfo


# -------------------------
# EEG Reconstruction
# -------------------------

class EEGReconstructionRequest(BaseModel):
    fileName: str
    samplingRate: float
    duration: float
    channels: list[str]
    data: list[list[float | None]]


class EEGReconstructionResponse(BaseModel):
    fileName: str
    samplingRate: float
    duration: float
    channels: list[str]
    data: list[list[float]]
    missingData: EEGMissingDataInfo
    reconstructionMethod: str
    reconstructedCount: int


class EEGReconstructionEvaluationRequest(BaseModel):
    fileName: str
    samplingRate: float
    channels: list[str]
    data: list[list[float]]
    maskRate: float = 0.1
    gapDurationSeconds: float = 0.2
    randomSeed: int = 42


class EEGChannelEvaluationMetric(BaseModel):
    channelIndex: int
    maskedCount: int
    rmse: float
    mae: float


class EEGReconstructionEvaluationResponse(BaseModel):
    method: str
    maskRate: float
    gapDurationSeconds: float
    maskedCount: int
    rmse: float
    mae: float
    correlation: float | None
    channelMetrics: list[
        EEGChannelEvaluationMetric
    ]


# -------------------------
# EEG Filter
# -------------------------

class EEGFilterRequest(BaseModel):
    fileName: str
    samplingRate: float
    duration: float
    channels: list[str]
    data: list[list[float]]

    highpassHz: float | None = None
    lowpassHz: float | None = None
    notchHz: float | None = None


class EEGFilterResponse(BaseModel):
    fileName: str
    samplingRate: float
    duration: float
    channels: list[str]
    data: list[list[float]]

    highpassHz: float | None
    lowpassHz: float | None
    notchHz: float | None


# -------------------------
# EEG PSD
# -------------------------

class EEGPSDRequest(BaseModel):
    fileName: str
    samplingRate: float
    channels: list[str]
    data: list[list[float]]


class EEGPSDResponse(BaseModel):
    fileName: str
    samplingRate: float
    channels: list[str]

    frequencies: list[float]
    psd: list[list[float]]


# -------------------------
# EEG Band Power
# -------------------------

class EEGBandPowerRequest(BaseModel):
    fileName: str
    samplingRate: float
    channels: list[str]
    data: list[list[float]]


class EEGBandPowerResponse(BaseModel):
    fileName: str
    samplingRate: float
    channels: list[str]

    bandPower: dict[
        str,
        list[float],
    ]
