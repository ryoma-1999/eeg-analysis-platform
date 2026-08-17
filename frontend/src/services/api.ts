import type {
  EEGData,
  EEGFilteredData,
  EEGFilterSettings,
} from '../types/eeg'


const API_BASE_URL = 'http://localhost:8000'


// -------------------------
// EEG Upload
// -------------------------

export async function uploadEEGFile(
  file: File
): Promise<EEGData> {
  const formData = new FormData()

  formData.append('file', file)

  const response = await fetch(
    `${API_BASE_URL}/api/eeg/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error(
      'Failed to upload EEG file'
    )
  }

  const data: EEGData =
    await response.json()

  return data
}


// -------------------------
// EEG Filter
// -------------------------

export async function filterEEGData(
  eegData: EEGData,
  settings: EEGFilterSettings
): Promise<EEGFilteredData> {

  /*
   * Backendへ送るデータ
   *
   * 元EEGデータ
   * +
   * Filter設定
   */
  const requestBody = {
    fileName: eegData.fileName,

    samplingRate:
      eegData.samplingRate,

    duration:
      eegData.duration,

    channels:
      eegData.channels,

    data:
      eegData.data,

    highpassHz:
      settings.highpassHz,

    lowpassHz:
      settings.lowpassHz,

    notchHz:
      settings.notchHz,
  }

  const response = await fetch(
    `${API_BASE_URL}/api/eeg/filter`,
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify(
        requestBody
      ),
    }
  )

  /*
   * Backendでエラーになった場合
   *
   * 例：
   * Low-pass 150Hz
   * ↓
   * Nyquist 125Hzを超える
   * ↓
   * HTTP 400
   */
  if (!response.ok) {
    const errorData =
      await response.json()

    throw new Error(
      errorData.detail ??
        'Failed to filter EEG data'
    )
  }

  /*
   * Filter後EEG
   */
  const filteredData:
    EEGFilteredData =
      await response.json()

  return filteredData
}


// -------------------------
// API Health
// -------------------------

export async function checkAPIHealth():
Promise<boolean> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/health`
    )

    return response.ok

  } catch {
    return false
  }
}