import {
  useEffect,
  useRef,
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
   * 下部スクロールバー本体
   */
  const horizontalScrollRef =
    useRef<HTMLDivElement | null>(null)

  /*
   * スクロールイベントが大量に発生しても、
   * 1フレームに1回だけReactを更新するために使う。
   */
  const animationFrameRef =
    useRef<number | null>(null)

  const pendingStartSecondRef =
    useRef(0)

  /*
   * 新しいCSVを読み込んだら、
   * 横スクロール位置を最初へ戻す。
   */
  useEffect(() => {
    setStartSecond(0)

    if (horizontalScrollRef.current) {
      horizontalScrollRef.current.scrollLeft = 0
    }
  }, [eegData])

  /*
   * コンポーネントを破棄するとき、
   * 残っているrequestAnimationFrameを解除。
   */
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(
          animationFrameRef.current
        )
      }
    }
  }, [])

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
   * 10秒より短いデータの場合は、
   * データ全体を表示。
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

        for (const value of values) {
          sum += value
        }

        const mean =
          values.length > 0
            ? sum / values.length
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
          value: number
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

          for (
            let index = bucketStart;
            index < bucketEnd;
            index++
          ) {
            const centeredValue =
              values[index] - mean

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
          if (minIndex < maxIndex) {
            points.push({
              time:
                (startSample + minIndex) /
                eegData.samplingRate,
              value: minValue,
            })

            if (maxIndex !== minIndex) {
              points.push({
                time:
                  (startSample + maxIndex) /
                  eegData.samplingRate,
                value: maxValue,
              })
            }
          } else {
            points.push({
              time:
                (startSample + maxIndex) /
                eegData.samplingRate,
              value: maxValue,
            })

            if (maxIndex !== minIndex) {
              points.push({
                time:
                  (startSample + minIndex) /
                  eegData.samplingRate,
                value: minValue,
              })
            }
          }
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
   * =====================================
   * 横スクロール処理
   * =====================================
   */

  const handleHorizontalScroll = (
    event: React.UIEvent<HTMLDivElement>
  ) => {
    const element = event.currentTarget

    /*
     * 横スクロール可能な総距離
     */
    const maxScrollLeft =
      element.scrollWidth -
      element.clientWidth

    if (maxScrollLeft <= 0) {
      return
    }

    /*
     * スクロール位置を
     * 0〜1へ変換。
     *
     * 左端 = 0
     * 右端 = 1
     */
    const scrollRatio =
      element.scrollLeft /
      maxScrollLeft

    /*
     * 0〜1を、
     * 0〜maxStartSecondへ変換。
     */
    const nextStartSecond =
      scrollRatio *
      maxStartSecond

    pendingStartSecondRef.current =
      nextStartSecond

    /*
     * scrollイベントは非常に大量に発生するため、
     * Reactの更新を1フレーム1回に制限。
     */
    if (
      animationFrameRef.current !== null
    ) {
      return
    }

    animationFrameRef.current =
      requestAnimationFrame(() => {
        setStartSecond(
          pendingStartSecondRef.current
        )

        animationFrameRef.current = null
      })
  }

  /*
   * =====================================
   * 横スクロールバー内部の仮想的な幅
   * =====================================
   *
   * 120秒データを10秒表示なら
   *
   * 120 / 10 = 12
   *
   * → 表示領域の1200%幅
   *
   * 実際の波形を1200%に引き伸ばすのではなく、
   * スクロール位置を取得するための透明な領域。
   */
  const timelineWidthPercent =
    visibleDuration > 0
      ? Math.max(
          100,
          (
            totalDuration /
            visibleDuration
          ) * 100
        )
      : 100

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
          }) => (
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
                      dot={false}
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

      {/* 下部横スクロールバー */}
      <div className="eeg-time-scrollbar">
        {/* チャンネル名部分と幅を合わせる */}
        <div className="eeg-time-scrollbar-label" />

        <div
          ref={horizontalScrollRef}
          className="eeg-horizontal-scroll"
          onScroll={
            handleHorizontalScroll
          }
        >
          <div
            className="eeg-horizontal-scroll-content"
            style={{
              width: `${timelineWidthPercent}%`,
            }}
          />
        </div>
      </div>
    </section>
  )
}

export default EEGChart