export type EEGData = {
  fileName: string
  samplingRate: number
  duration: number
  channels: string[]
  data: number[][]
}


export type EEGFilterSettings = {
  highpassHz: number | null
  lowpassHz: number | null
  notchHz: number | null
}


export type EEGFilteredData = EEGData & {
  highpassHz: number | null
  lowpassHz: number | null
  notchHz: number | null
}

// -------------------------
// PSD
// -------------------------

export type EEGPSDData = {
  fileName: string
  samplingRate: number
  channels: string[]

  frequencies: number[]
  psd: number[][]
}