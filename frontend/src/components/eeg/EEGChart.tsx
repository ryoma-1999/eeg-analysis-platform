import {
  useEffect,
  useState,
} from 'react'

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

/*
 * 一度に画面へ表示する秒数
 */
const WINDOW_SECONDS = 10

/*
 * 1チャンネルあたり、
 * 表示用に何区間くらいまで残すか。
 *
 * 元データ自体は削除しない。
 * Rechartsへ渡すデータだけ軽くする。
 */
const DISPLAY_BUCKETS = 300

/*
 * チャンネルごとの波形色。
 * チャンネル数が色数を超えた場合は先頭から繰り返す。
 */
const CHANNEL_COLORS = [
  '#2563eb',
  '#f97316',
  '#16a34a',
  '#ef4444',
  '#8b5cf6',
  '#8b5a4a',
  '#ec4899',
  '#64748b',
  '#06b6d4',
  '#eab308',
  '#14b8a6',
  '#a855f7',
]

function EEGChart({ eegData }: EEGChartProps) {
  /*
   * 現在画面に表示している開始秒
   *
   * 例：
   * 0      → 0〜10秒
   * 15.5   → 15.5〜25.5秒
   * 78.2   → 78.2〜88.2秒
   */
  const [startSecond, setStartSecond] =
    useState(0)

  /*
   * 新しいCSVを読み込んだら、
   * 横スクロール位置を最初へ戻す。
   */
  useEffect(() => {
    setStartSecond(0)
  }, [eegData])

  /*
   * EEGデータ未読込
   */
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
   * =====================================
   * EEG基本情報
   * =====================================
   */

  const sampleCount =
    eegData.data[0]?.length ?? 0

  /*
   * バックエンドが計算したdurationを使用。
   */
  const totalDuration =
    eegData.duration

  /*
   * 常に10秒分を表示する。
   * 10秒未満のデータは全体を表示する。
   */
  const visibleDuration = Math.min(
    WINDOW_SECONDS,
    totalDuration
  )

  /*
   * 横スクロールできる最大の開始秒
   *
   * 120秒なら
   * 120 - 10 = 110秒
   *
   * つまり最後は
   * 110〜120秒。
   */
  const maxStartSecond = Math.max(
    0,
    totalDuration - visibleDuration
  )

  /*
   * 万が一データ変更などで範囲外になっても
   * startSecondを正常範囲へ収める。
   */
  const windowStart = Math.min(
    startSecond,
    maxStartSecond
  )

  const windowEnd = Math.min(
    windowStart + visibleDuration,
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
   * =====================================
   * 表示用EEGデータ
   * =====================================
   */

  const channelData =
    eegData.channels.map(
      (channel, channelIndex) => {
        /*
         * 今見えている時間範囲だけ取得
         */
        const values =
          eegData.data[channelIndex].slice(
            startSample,
            endSample
          )

        /*
         * 平均値計算
         */
        let sum = 0
        let validCount = 0

        for (const value of values) {
          if (value !== null) {
            sum += value
            validCount++
          }
        }

        const mean =
          validCount > 0
            ? sum / validCount
            : 0

        /*
         * =================================
         * 表示用ダウンサンプリング
         * =================================
         *
         * 2500点すべてをRechartsへ渡すと、
         * 32chではかなり重い。
         *
         * そこで数点ずつのグループに分け、
         * 各グループの最小値・最大値だけ残す。
         *
         * これなら瞬目などの大きなピークも
         * 消えにくい。
         */

        const bucketSize = Math.max(
          1,
          Math.ceil(
            values.length /
              DISPLAY_BUCKETS
          )
        )

        const points: {
          time: number
          value: number | null
        }[] = []

        for (
          let bucketStart = 0;
          bucketStart < values.length;
          bucketStart += bucketSize
        ) {
          const bucketEnd = Math.min(
            bucketStart + bucketSize,
            values.length
          )

          let minValue = Infinity
          let maxValue = -Infinity

          let minIndex = bucketStart
          let maxIndex = bucketStart
          let firstMissingIndex:
            number | null = null

          for (
            let index = bucketStart;
            index < bucketEnd;
            index++
          ) {
            const rawValue = values[index]

            if (rawValue === null) {
              if (firstMissingIndex === null) {
                firstMissingIndex = index
              }
              continue
            }

            const centeredValue =
              rawValue - mean

            if (centeredValue < minValue) {
              minValue = centeredValue
              minIndex = index
            }

            if (centeredValue > maxValue) {
              maxValue = centeredValue
              maxIndex = index
            }
          }

          /*
           * 時系列順になるように
           * min/maxの順番を調整。
           */
          const bucketPoints: {
            index: number
            value: number | null
          }[] = []

          if (minValue !== Infinity) {
            bucketPoints.push({
              index: minIndex,
              value: minValue,
            })

            if (maxIndex !== minIndex) {
              bucketPoints.push({
                index: maxIndex,
                value: maxValue,
              })
            }
          }

          if (firstMissingIndex !== null) {
            bucketPoints.push({
              index: firstMissingIndex,
              value: null,
            })
          }

          bucketPoints
            .sort((a, b) => a.index - b.index)
            .forEach((point) => {
              points.push({
                time:
                  (startSample + point.index) /
                  eegData.samplingRate,
                value: point.value,
              })
            })
        }

        return {
          channel,
          points,
        }
      }
    )

  /*
   * =====================================
   * 全チャンネル共通Y軸
   * =====================================
   */

  let maxAmplitude = 0

  for (const channel of channelData) {
    for (const point of channel.points) {
        if (point.value !== null) {
          maxAmplitude = Math.max(
            maxAmplitude,
            Math.abs(point.value)
          )
        }
    }
  }

  const yLimit = Math.max(
    maxAmplitude * 1.1,
    1
  )

  /*
   * =====================================
   * 画面
   * =====================================
   */

  return (
    <section className="eeg-card">
      {/* ヘッダー */}
      <div className="eeg-card-header">
        <div>
          <h3>
            EEG Waveform
          </h3>

          <p>
            Loaded: {eegData.fileName}
          </p>
        </div>

        <div className="eeg-meta">
          <span>
            Channels:{' '}
            {eegData.channels.length}
          </span>

          <span>
            Sampling Rate:{' '}
            {eegData.samplingRate.toFixed(
              1
            )}{' '}
            Hz
          </span>

          <span>
            Duration:{' '}
            {totalDuration.toFixed(
              1
            )}{' '}
            s
          </span>
        </div>
      </div>

      {/* EEG波形エリア */}
      <div className="eeg-lanes">
        {/* 上部固定時間軸 */}
        <div className="eeg-time-axis">
          <div className="eeg-time-axis-label" />

          <div className="eeg-time-axis-scale">
            {Array.from({
              length: 6,
            }).map(
              (_, index) => {
                const time =
                  windowStart +
                  (
                    (
                      windowEnd -
                      windowStart
                    ) *
                    index
                  ) /
                    5

                return (
                  <span key={index}>
                    {time.toFixed(1)}s
                  </span>
                )
              }
            )}
          </div>
        </div>

        {/* EEGチャンネル */}
        {channelData.map(
          ({
            channel,
            points,
          }, channelIndex) => (
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
                      labelFormatter={(
                        value
                      ) =>
                        `${Number(
                          value
                        ).toFixed(
                          3
                        )} s`
                      }
                      formatter={(
                        value
                      ) => [
                        `${Number(
                          value
                        ).toFixed(
                          2
                        )} µV`,
                        channel,
                      ]}
                    />

                    <Line
                      type="linear"
                      dataKey="value"
                      stroke={
                        CHANNEL_COLORS[
                          channelIndex %
                          CHANNEL_COLORS.length
                        ]
                      }
                      strokeWidth={1.25}
                      dot={false}
                      connectNulls={false}
                      isAnimationActive={
                        false
                      }
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )
        )}
      </div>

      {/* 下部時間スライダー */}
      <div className="eeg-time-scrollbar">
        <div className="eeg-time-scrollbar-label" />

        <input
          className="eeg-time-slider"
          type="range"
          min={0}
          max={maxStartSecond}
          step={0.1}
          value={windowStart}
          disabled={maxStartSecond <= 0}
          aria-label="EEG display start time"
          onChange={(event) =>
            setStartSecond(
              Number(event.target.value)
            )
          }
        />
      </div>
    </section>
  )
}

export default EEGChart
