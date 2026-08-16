from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import numpy as np
import pandas as pd


app = FastAPI(
    title="EEG Analysis API",
    version="0.1.0",
)


# -------------------------
# CORS
# -------------------------

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# Response Model
# -------------------------

class EEGUploadResponse(BaseModel):
    fileName: str
    samplingRate: float
    duration: float
    channels: list[str]
    data: list[list[float]]


# -------------------------
# Basic API
# -------------------------

@app.get("/")
def root():
    return {
        "message": "EEG Analysis API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }


# -------------------------
# EEG Upload API
# -------------------------

@app.post(
    "/api/eeg/upload",
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
            detail="CSV must contain a 'time' column.",
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

    # 数値データに変換
    try:
        time_values = df["time"].astype(float).to_numpy()
        eeg_values = df[channels].astype(float)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail="EEG data must contain numeric values.",
        ) from exc

    # 今は欠損値をエラー扱い
    if eeg_values.isnull().values.any():
        raise HTTPException(
            status_code=400,
            detail="Missing EEG values are not supported yet.",
        )

    # 最低2サンプル必要
    if len(time_values) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least two samples are required.",
        )

    # サンプリング間隔
    time_diff = np.diff(time_values)

    if np.any(time_diff <= 0):
        raise HTTPException(
            status_code=400,
            detail="Time values must be increasing.",
        )

    # 中央値からサンプリング周波数を計算
    sampling_rate = float(
        1.0 / np.median(time_diff)
    )

    # 記録時間
    duration = float(
        time_values[-1] - time_values[0]
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