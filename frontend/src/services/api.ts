import type {
  EEGBandPowerData,
  EEGData,
  EEGFilteredData,
  EEGFilterSettings,
  EEGPSDData,
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

  const requestBody = {
    fileName:
      eegData.fileName,

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

  if (!response.ok) {
    const errorData =
      await response.json()

    throw new Error(
      errorData.detail ??
        'Failed to filter EEG data'
    )
  }

  const filteredData:
    Omit<EEGFilteredData, 'missingData'> =
      await response.json()

  return {
    ...filteredData,
    missingData: eegData.missingData,
  }
}


// -------------------------
// EEG PSD
// -------------------------

export async function calculatePSD(
  eegData: EEGData
): Promise<EEGPSDData> {

  const requestBody = {
    fileName:
      eegData.fileName,

    samplingRate:
      eegData.samplingRate,

    channels:
      eegData.channels,

    data:
      eegData.data,
  }

  const response = await fetch(
    `${API_BASE_URL}/api/eeg/psd`,
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

  if (!response.ok) {
    const errorData =
      await response.json()

    throw new Error(
      errorData.detail ??
        'Failed to calculate PSD'
    )
  }

  const psdData:
    EEGPSDData =
      await response.json()

  return psdData
}


// -------------------------
// EEG Band Power
// -------------------------

export async function calculateBandPower(
  eegData: EEGData
): Promise<EEGBandPowerData> {

  /*
   * Backendの
   * EEGBandPowerRequestに合わせる
   */
  const requestBody = {
    fileName:
      eegData.fileName,

    samplingRate:
      eegData.samplingRate,

    channels:
      eegData.channels,

    data:
      eegData.data,
  }

  const response = await fetch(
    `${API_BASE_URL}/api/eeg/band-power`,
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
   * BackendでBand Power計算に
   * 失敗した場合
   */
  if (!response.ok) {
    const errorData =
      await response.json()

    throw new Error(
      errorData.detail ??
        'Failed to calculate band power'
    )
  }

  /*
   * Delta / Theta / Alpha /
   * Beta / Gamma の結果
   */
  const bandPowerData:
    EEGBandPowerData =
      await response.json()

  return bandPowerData
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
