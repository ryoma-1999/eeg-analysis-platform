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


def evaluate_linear_reconstruction(
    data: list[list[float]],
    sampling_rate: float,
    mask_rate: float = 0.1,
    gap_duration_seconds: float = 0.2,
    random_seed: int = 42,
) -> dict:
    """既知データを人工的に欠損させ線形補間精度を測る。"""

    if sampling_rate <= 0:
        raise ValueError(
            "Sampling rate must be greater than 0."
        )

    if not 0 < mask_rate < 1:
        raise ValueError(
            "Mask rate must be between 0 and 1."
        )

    if gap_duration_seconds <= 0:
        raise ValueError(
            "Gap duration must be greater than 0."
        )

    original = np.asarray(
        data,
        dtype=float,
    )

    if original.ndim != 2:
        raise ValueError(
            "EEG data must be a 2D array."
        )

    channel_count, sample_count = original.shape

    if channel_count == 0 or sample_count < 3:
        raise ValueError(
            "Evaluation requires at least one channel "
            "and three samples."
        )

    if not np.all(np.isfinite(original)):
        raise ValueError(
            "Evaluation requires EEG data without "
            "missing or invalid values."
        )

    target_per_channel = max(
        1,
        int(round(sample_count * mask_rate)),
    )
    gap_samples = max(
        1,
        int(round(
            sampling_rate * gap_duration_seconds
        )),
    )
    gap_samples = min(
        gap_samples,
        max(1, sample_count - 2),
    )

    rng = np.random.default_rng(
        random_seed
    )
    artificial_missing = np.zeros_like(
        original,
        dtype=bool,
    )

    for channel_index in range(channel_count):
        masked_count = 0
        attempts = 0
        max_attempts = sample_count * 10

        while (
            masked_count < target_per_channel
            and attempts < max_attempts
        ):
            remaining = (
                target_per_channel - masked_count
            )
            current_gap = min(
                gap_samples,
                remaining,
            )
            latest_start = (
                sample_count - current_gap - 1
            )

            if latest_start < 1:
                break

            start = int(
                rng.integers(
                    1,
                    latest_start + 1,
                )
            )
            end = start + current_gap
            gap_slice = artificial_missing[
                channel_index,
                start:end,
            ]

            if not gap_slice.any():
                artificial_missing[
                    channel_index,
                    start:end,
                ] = True
                masked_count += current_gap

            attempts += 1

        if masked_count < target_per_channel:
            available = np.flatnonzero(
                ~artificial_missing[channel_index]
            )
            available = available[
                (available > 0)
                & (available < sample_count - 1)
            ]
            needed = min(
                target_per_channel - masked_count,
                available.size,
            )

            if needed > 0:
                selected = rng.choice(
                    available,
                    size=needed,
                    replace=False,
                )
                artificial_missing[
                    channel_index,
                    selected,
                ] = True

    masked = original.copy()
    masked[artificial_missing] = np.nan

    reconstructed, reconstructed_count = (
        reconstruct_eeg_linear(
            masked.tolist()
        )
    )
    reconstructed_array = np.asarray(
        reconstructed,
        dtype=float,
    )

    original_values = original[
        artificial_missing
    ]
    predicted_values = reconstructed_array[
        artificial_missing
    ]

    if original_values.size == 0:
        raise ValueError(
            "No samples could be masked for evaluation."
        )

    errors = predicted_values - original_values
    rmse = float(
        np.sqrt(np.mean(errors ** 2))
    )
    mae = float(
        np.mean(np.abs(errors))
    )

    if (
        original_values.size >= 2
        and np.std(original_values) > 0
        and np.std(predicted_values) > 0
    ):
        correlation = float(
            np.corrcoef(
                original_values,
                predicted_values,
            )[0, 1]
        )
    else:
        correlation = None

    channel_metrics = []

    for channel_index in range(channel_count):
        channel_mask = artificial_missing[
            channel_index
        ]
        channel_original = original[
            channel_index,
            channel_mask,
        ]
        channel_predicted = reconstructed_array[
            channel_index,
            channel_mask,
        ]
        channel_errors = (
            channel_predicted - channel_original
        )

        channel_metrics.append({
            "channelIndex": channel_index,
            "maskedCount": int(channel_original.size),
            "rmse": float(np.sqrt(
                np.mean(channel_errors ** 2)
            )),
            "mae": float(np.mean(
                np.abs(channel_errors)
            )),
        })

    return {
        "method": "linear",
        "maskRate": mask_rate,
        "gapDurationSeconds": (
            gap_duration_seconds
        ),
        "maskedCount": int(
            reconstructed_count
        ),
        "rmse": rmse,
        "mae": mae,
        "correlation": correlation,
        "channelMetrics": channel_metrics,
    }
