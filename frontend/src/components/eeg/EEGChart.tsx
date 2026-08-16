import { useEffect, useState } from 'react'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { EEGData } from '../../types/eeg'

type EEGChartProps = {
  eegData: EEGData | null
}

const WINDOW_SECONDS = 10

function EEGChart({ eegData }: EEGChartProps) {
  /*
   * 現在表示している開始秒
   *
   * 0  →  0〜10秒
   * 10 → 10〜20秒
   * 20 → 20〜30秒
   */
  const [startSecond, setStartSecond] = useState(0)

  /*
   * 新しいCSVを読み込んだら
   * 最初の0秒へ戻す
   */
  useEffect(() => {
    setStartSecond(0)
  }, [eegData?.fileName])

  if (!eegData) {
    return (
      <section className="eeg-card">
        <div className="eeg-card-header">
          <div>
            <h3>EEG Waveform</h3>

            <p>
              Uploaded EEG data will be displayed here.
            </p>
          </div>

          <div className="eeg-meta">
            <span>Channels: --</span>
            <span>Sampling Rate: -- Hz</span>
            <span>Duration: -- s</span>
          </div>
        </div>

        <div className="eeg-chart-placeholder">
          No EEG data loaded
        </div>
      </section>
    )
  }

  /*
   * ==============================
   * EEG基本情報
   * ==============================
   */

  const sampleCount =
    eegData.data[0]?.length ?? 0

  const totalDuration =
    sampleCount / eegData.samplingRate

  /*
   * 全ページ数
   *
   * 120秒なら
   *
   * 120 / 10 = 12ページ
   */
  const pageCount = Math.max(
    1,
    Math.ceil(
      totalDuration / WINDOW_SECONDS
    )
  )

  /*
   * 最後に表示できる開始秒
   *
   * 120秒なら
   *
   * 110秒
   *
   * → 110〜120秒
   */
  const maxStartSecond = Math.max(
    0,
    (pageCount - 1) * WINDOW_SECONDS
  )

  /*
   * 現在のページ番号
   *
   * startSecond = 0
   * → page 0
   *
   * startSecond = 10
   * → page 1
   */
  const currentPage = Math.floor(
    startSecond / WINDOW_SECONDS
  )

  /*
   * 現在表示する時間
   */
  const windowStart = startSecond

  const windowEnd = Math.min(
    startSecond + WINDOW_SECONDS,
    totalDuration
  )

  /*
   * 秒 → サンプル番号
   */
  const startSample = Math.floor(
    windowStart * eegData.samplingRate
  )

  const endSample = Math.min(
    Math.ceil(
      windowEnd * eegData.samplingRate
    ),
    sampleCount
  )

  /*
   * ==============================
   * 表示用EEGデータ
   * ==============================
   */

  const channelData =
    eegData.channels.map(
      (channel, channelIndex) => {
        const values =
          eegData.data[channelIndex].slice(
            startSample,
            endSample
          )

        /*
         * 平均値を計算
         */
        let sum = 0

        for (const value of values) {
          sum += value
        }

        const mean =
          values.length > 0
            ? sum / values.length
            : 0

        /*
         * Recharts用データ
         */
        const points = values.map(
          (value, index) => ({
            time:
              (startSample + index) /
              eegData.samplingRate,

            /*
             * 表示用に平均値を引く
             */
            value: value - mean,
          })
        )

        return {
          channel,
          points,
        }
      }
    )

  /*
   * ==============================
   * Y軸
   * ==============================
   *
   * 全チャンネルで同じ振幅スケール
   */
  let maxAmplitude = 0

  for (const channel of channelData) {
    for (const point of channel.points) {
      maxAmplitude = Math.max(
        maxAmplitude,
        Math.abs(point.value)
      )
    }
  }

  const yLimit = Math.max(
    maxAmplitude * 1.1,
    1
  )

  /*
   * ==============================
   * 前の10秒
   * ==============================
   */

  const movePrevious = () => {
    setStartSecond((current) => {
      const next =
        current - WINDOW_SECONDS

      return Math.max(
        0,
        next
      )
    })
  }

  /*
   * ==============================
   * 次の10秒
   * ==============================
   */

  const moveNext = () => {
    setStartSecond((current) => {
      const next =
        current + WINDOW_SECONDS

      return Math.min(
        maxStartSecond,
        next
      )
    })
  }

  /*
   * ==============================
   * 画面
   * ==============================
   */

  return (
    <section className="eeg-card">
      <div className="eeg-card-header">
        <div>
          <h3>EEG Waveform</h3>

          <p>
            Loaded: {eegData.fileName}
          </p>
        </div>

        <div className="eeg-header-right">
          {/* EEG情報 */}
          <div className="eeg-meta">
            <span>
              Channels:{' '}
              {eegData.channels.length}
            </span>

            <span>
              Sampling Rate:{' '}
              {eegData.samplingRate.toFixed(1)} Hz
            </span>

            <span>
              Duration:{' '}
              {totalDuration.toFixed(1)} s
            </span>
          </div>

          {/* ページ送り */}
          <div className="time-window-control">
            <button
              type="button"
              onClick={movePrevious}
              disabled={startSecond <= 0}
            >
              ←
            </button>

            <strong>
              {currentPage + 1} / {pageCount}
            </strong>

            <button
              type="button"
              onClick={moveNext}
              disabled={
                startSecond >= maxStartSecond
              }
            >
              →
            </button>
          </div>

          {/* 全時間スライダー */}
          <div className="time-slider">
            <span>0s</span>

            <input
              type="range"
              min={0}
              max={maxStartSecond}
              step={WINDOW_SECONDS}
              value={startSecond}
              onChange={(event) => {
                setStartSecond(
                  Number(event.target.value)
                )
              }}
            />

            <span>
              {totalDuration.toFixed(0)}s
            </span>
          </div>
        </div>
      </div>

      {/* EEG波形領域 */}
      <div className="eeg-lanes">
        {/* 固定時間軸 */}
        <div className="eeg-time-axis">
          <div className="eeg-time-axis-label" />

          <div className="eeg-time-axis-scale">
            {Array.from({
              length: 6,
            }).map((_, index) => {
              const time =
                windowStart +
                ((windowEnd - windowStart) *
                  index) /
                  5

              return (
                <span key={index}>
                  {time.toFixed(1)}s
                </span>
              )
            })}
          </div>
        </div>

        {/* EEGチャンネル */}
        {channelData.map(
          ({ channel, points }) => (
            <div
              className="eeg-lane"
              key={channel}
            >
              {/* チャンネル名 */}
              <div
                className="eeg-channel-label"
                translate="no"
              >
                {channel}
              </div>

              {/* 波形 */}
              <div className="eeg-lane-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={points}
                    syncId="eeg"
                    margin={{
                      top: 4,
                      right: 10,
                      bottom: 0,
                      left: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical
                      horizontal={false}
                    />

                    <XAxis
                      dataKey="time"
                      type="number"
                      domain={[
                        windowStart,
                        windowEnd,
                      ]}
                      allowDataOverflow
                      hide
                    />

                    <YAxis
                      hide
                      domain={[
                        -yLimit,
                        yLimit,
                      ]}
                    />

                    <Tooltip
                      labelFormatter={(value) =>
                        `${Number(value).toFixed(
                          3
                        )} s`
                      }
                      formatter={(value) => [
                        `${Number(value).toFixed(
                          2
                        )} µV`,
                        channel,
                      ]}
                    />

                    <Line
                      type="linear"
                      dataKey="value"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  )
}

export default EEGChart