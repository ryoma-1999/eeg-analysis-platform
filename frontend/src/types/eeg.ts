export type EEGData = {
  fileName: string
  samplingRate: number
  duration: number
  channels: string[]
  data: number[][]
}