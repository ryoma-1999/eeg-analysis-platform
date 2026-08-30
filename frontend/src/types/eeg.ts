// -------------------------
// EEG
// -------------------------
export type EEGData = {
  fileName: string
  samplingRate: number
  duration: number
  channels: string[]
  data: (number | null)[][]
  missingData: EEGMissingDataInfo
}

export type EEGMissingSegment = {
  startSample: number
  endSample: number
  sampleCount: number
  startTime: number
  endTime: number
}

export type EEGChannelMissingInfo = {
  channel: string
  missingCount: number
  missingRate: number
  segments: EEGMissingSegment[]
}

export type EEGMissingDataInfo = {
  hasMissing: boolean
  totalMissingCount: number
  totalValueCount: number
  missingRate: number
  channels: EEGChannelMissingInfo[]
}
export type EEGFilterSettings = {
  highpassHz: number | null
  lowpassHz: number | null
  notchHz: number | null
}

// -------------------------
// Filtered EEG
// -------------------------
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

// -------------------------
// Band Power
// -------------------------
export type EEGBandPowerData = {
  fileName: string
  samplingRate: number
  channels: string[]

  bandPower: {
    delta: number[]
    theta: number[]
    alpha: number[]
    beta: number[]
    gamma: number[]
  }
}
