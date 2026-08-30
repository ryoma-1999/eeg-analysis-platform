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

import {
  calculatePSD,
} from '../../services/api'

import type {
  EEGData,
  EEGPSDData,
} from '../../types/eeg'


type PSDPanelProps = {
  eegData: EEGData | null
}


function PSDPanel({
  eegData,
}: PSDPanelProps) {

  const hasMissing =
    eegData?.missingData.hasMissing
    ?? false

  // -------------------------
  // PSD計算結果
  // -------------------------

  const [
    psdData,
    setPSDData,
  ] = useState<EEGPSDData | null>(
    null
  )


  // -------------------------
  // 表示するチャンネル
  // -------------------------

  const [
    selectedChannelIndex,
    setSelectedChannelIndex,
  ] = useState(0)


  // -------------------------
  // UI状態
  // -------------------------

  const [
    isCalculating,
    setIsCalculating,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  )


  /*
   * EEGデータが変わったら、
   * 前のPSD結果を消す。
   *
   * Original → Filtered
   * CSV A → CSV B
   *
   * などの切替時に古いPSDを
   * 表示し続けないため。
   */
  useEffect(() => {
    setPSDData(null)
    setSelectedChannelIndex(0)
    setError(null)
  }, [eegData])


  // -------------------------
  // PSD実行
  // -------------------------

  const handleCalculatePSD =
    async () => {

      if (!eegData) {
        return
      }

      setError(null)
      setIsCalculating(true)

      try {

        const result =
          await calculatePSD(
            eegData
          )

        setPSDData(
          result
        )

      } catch (error) {

        if (
          error instanceof Error
        ) {
          setError(
            error.message
          )
        } else {
          setError(
            'Failed to calculate PSD'
          )
        }

      } finally {

        setIsCalculating(false)

      }
    }


  // -------------------------
  // グラフ用データ
  // -------------------------

  const chartData =
    psdData
      ? psdData.frequencies.map(
          (frequency, index) => ({
            frequency,
            power:
              psdData.psd[
                selectedChannelIndex
              ]?.[index] ?? 0,
          })
        )
      : []


  // -------------------------
  // Peak Frequency
  // -------------------------

  let peakFrequency:
    number | null = null

  let peakPower = -Infinity

  for (const point of chartData) {

    /*
     * 0 HzはDC成分なので
     * Peak探索から除外する。
     */
    if (
      point.frequency <= 0
    ) {
      continue
    }

    if (
      point.power > peakPower
    ) {
      peakPower =
        point.power

      peakFrequency =
        point.frequency
    }
  }


  return (
    <section className="psd-card">

      {/* -------------------------
          Header
      ------------------------- */}

      <div className="psd-card-header">

        <div>
          <h3>
            Power Spectral Density
          </h3>

          <p>
            Welch PSD analysis
            of the EEG signal.
          </p>
        </div>


        <button
          type="button"
          onClick={
            handleCalculatePSD
          }
          disabled={
            !eegData ||
            hasMissing ||
            isCalculating
          }
        >

          {isCalculating
            ? 'Calculating...'
            : 'Calculate PSD'}

        </button>

      </div>


      {/* -------------------------
          Error
      ------------------------- */}

      {error && (
        <div className="psd-error">
          {error}
        </div>
      )}


      {/* -------------------------
          PSD未計算
      ------------------------- */}

      {!psdData && (
        <div className="psd-placeholder">

          {eegData
            ? hasMissing
              ? 'Reconstruct missing EEG data before calculating PSD.'
              : 'Click Calculate PSD to analyze the EEG signal.'
            : 'Load EEG data before calculating PSD.'}

        </div>
      )}


      {/* -------------------------
          PSD計算済み
      ------------------------- */}

      {psdData && (
        <>

          {/* Channel選択 */}
          <div className="psd-controls">

            <label>
              Channel:{' '}

              <select
                value={
                  selectedChannelIndex
                }
                onChange={(event) =>
                  setSelectedChannelIndex(
                    Number(
                      event.target.value
                    )
                  )
                }
              >

                {psdData.channels.map(
                  (
                    channel,
                    index
                  ) => (
                    <option
                      key={channel}
                      value={index}
                    >
                      {channel}
                    </option>
                  )
                )}

              </select>
            </label>


            {/* Peak表示 */}
            {peakFrequency !== null && (
              <span className="psd-peak">
                Peak Frequency:{' '}
                {peakFrequency.toFixed(
                  1
                )}{' '}
                Hz
              </span>
            )}

          </div>


          {/* PSD Graph */}
          <div
            className="psd-chart"
            style={{
              width: '100%',
              height: 170,
            }}
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 20,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="frequency"
                  type="number"
                  domain={[
                    'dataMin',
                    'dataMax',
                  ]}
                  tickFormatter={(
                    value
                  ) =>
                    `${Number(
                      value
                    ).toFixed(0)}`
                  }
                  label={{
                    value:
                      'Frequency (Hz)',
                    position:
                      'insideBottom',
                    offset: -10,
                  }}
                />

                <YAxis
                  label={{
                    value:
                      'PSD',
                    angle: -90,
                    position:
                      'insideLeft',
                  }}
                />

                <Tooltip
                  labelFormatter={(
                    value
                  ) =>
                    `${Number(
                      value
                    ).toFixed(
                      1
                    )} Hz`
                  }
                  formatter={(
                    value
                  ) => [
                    Number(
                      value
                    ).toExponential(
                      3
                    ),
                    'PSD',
                  ]}
                />

                <Line
                  type="linear"
                  dataKey="power"
                  dot={false}
                  isAnimationActive={
                    false
                  }
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        </>
      )}

    </section>
  )
}


export default PSDPanel
