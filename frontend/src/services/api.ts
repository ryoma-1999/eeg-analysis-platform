import type { EEGData } from '../types/eeg'

const API_BASE_URL = 'http://localhost:8000'

// EEGファイルをアップロードする関数
export async function uploadEEGFile(file: File): Promise<EEGData> {
  const formData = new FormData()

  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/eeg/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to upload EEG file')
  }

  const data: EEGData = await response.json()

  return data
}

// health確認関数
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)

    return response.ok
  } catch {
    return false
  }
}