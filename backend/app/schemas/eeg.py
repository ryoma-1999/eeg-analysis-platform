from pydantic import BaseModel


class EEGUploadResponse(BaseModel):
    fileName: str
    samplingRate: float
    duration: float
    channels: list[str]
    data: list[list[float]]


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