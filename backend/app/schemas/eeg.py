from pydantic import BaseModel


# -------------------------
# EEG Upload
# -------------------------

class EEGUploadResponse(BaseModel):
    fileName: str
    samplingRate: float
    duration: float
    channels: list[str]
    data: list[list[float]]


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