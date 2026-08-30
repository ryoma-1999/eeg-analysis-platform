import numpy as np


def reconstruct_eeg_linear(
    data: list[list[float | None]],
) -> tuple[list[list[float]], int]:
    """欠損EEG値をチャンネルごとに線形補間する。"""

    if not data:
        raise ValueError(
            "EEG data is empty."
        )

    eeg_array = np.asarray(
        data,
        dtype=float,
    )

    if eeg_array.ndim != 2:
        raise ValueError(
            "EEG data must be a 2D array."
        )

    channel_count, sample_count = (
        eeg_array.shape
    )

    if channel_count == 0:
        raise ValueError(
            "No EEG channels found."
        )

    if sample_count < 2:
        raise ValueError(
            "At least two samples are required."
        )

    if np.isinf(eeg_array).any():
        raise ValueError(
            "EEG data contains invalid values."
        )

    reconstructed = eeg_array.copy()
    sample_indices = np.arange(
        sample_count
    )
    reconstructed_count = 0

    for channel_index in range(
        channel_count
    ):
        channel_data = reconstructed[
            channel_index
        ]
        missing_mask = np.isnan(
            channel_data
        )
        missing_count = int(
            missing_mask.sum()
        )

        if missing_count == 0:
            continue

        valid_mask = ~missing_mask
        valid_count = int(
            valid_mask.sum()
        )

        if valid_count < 2:
            raise ValueError(
                "Each channel requires at least "
                "two valid samples for linear "
                "reconstruction."
            )

        channel_data[missing_mask] = np.interp(
            sample_indices[missing_mask],
            sample_indices[valid_mask],
            channel_data[valid_mask],
        )

        reconstructed_count += missing_count

    return (
        reconstructed.tolist(),
        reconstructed_count,
    )
