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