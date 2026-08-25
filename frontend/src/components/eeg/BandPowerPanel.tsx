import {
  useEffect,
  useState,
} from 'react'

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  calculateBandPower,
} from '../../services/api'

import type {
  EEGBandPowerData,
  EEGData,
} from '../../types/eeg'


type BandPowerPanelProps = {
  eegData: EEGData | null
}

const BAND_COLORS = {
  Delta: '#8b5cf6',
  Theta: '#3b82f6',
  Alpha: '#16a34a',
  Beta: '#f59e0b',
  Gamma: '#ef4444',
} as const


function BandPowerPanel({
  eegData,
}: BandPowerPanelProps) {

  // -------------------------
  // Band Power計算結果
  // -------------------------

  const [
    bandPowerData,
    setBandPowerData,
  ] = useState<
    EEGBandPowerData | null
  >(
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
   * EEGデータが変わった場合、
   * 古いBand Power結果を削除する。
   *
   * Original → Filtered
   * CSV A → CSV B
   *
   * などの切替に対応。
   */
  useEffect(() => {
    setBandPowerData(null)
    setSelectedChannelIndex(0)
    setError(null)
  }, [eegData])


  // -------------------------
  // Band Power計算
  // -------------------------

  const handleCalculateBandPower =
    async () => {

      if (!eegData) {
        return
      }

      setError(null)
      setIsCalculating(true)

      try {

        const result =
          await calculateBandPower(
            eegData
          )

        setBandPowerData(
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
            'Failed to calculate band power'
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
    bandPowerData
      ? [
          {
            band: 'Delta',
            range: '0.5–4 Hz',
            power:
              bandPowerData
                .bandPower
                .delta[
                  selectedChannelIndex
                ] ?? 0,
          },
          {
            band: 'Theta',
            range: '4–8 Hz',
            power:
              bandPowerData
                .bandPower
                .theta[
                  selectedChannelIndex
                ] ?? 0,
          },
          {
            band: 'Alpha',
            range: '8–13 Hz',
            power:
              bandPowerData
                .bandPower
                .alpha[
                  selectedChannelIndex
                ] ?? 0,
          },
          {
            band: 'Beta',
            range: '13–30 Hz',
            power:
              bandPowerData
                .bandPower
                .beta[
                  selectedChannelIndex
                ] ?? 0,
          },
          {
            band: 'Gamma',
            range: '30–45 Hz',
            power:
              bandPowerData
                .bandPower
                .gamma[
                  selectedChannelIndex
                ] ?? 0,
          },
        ]
      : []


  // -------------------------
  // 最大Bandを探す
  // -------------------------

  let dominantBand:
    string | null = null

  let maxPower = -Infinity

  for (const item of chartData) {

    if (
      item.power > maxPower
    ) {
      maxPower =
        item.power

      dominantBand =
        item.band
    }
  }


  return (
    <section className="band-power-card">

      {/* -------------------------
          Header
      ------------------------- */}

      <div className="band-power-card-header">

        <div>
          <h3>
            EEG Band Power
          </h3>

          <p>
            Delta, Theta, Alpha,
            Beta and Gamma power.
          </p>
        </div>


        <button
          type="button"
          onClick={
            handleCalculateBandPower
          }
          disabled={
            !eegData ||
            isCalculating
          }
        >

          {isCalculating
            ? 'Calculating...'
            : 'Calculate Band Power'}

        </button>

      </div>


      {/* -------------------------
          Error
      ------------------------- */}

      {error && (
        <div className="band-power-error">
          {error}
        </div>
      )}


      {/* -------------------------
          未計算
      ------------------------- */}

      {!bandPowerData && (
        <div className="band-power-placeholder">

          {eegData
            ? (
              'Click Calculate Band Power '
              + 'to analyze the EEG signal.'
            )
            : (
              'Load EEG data before '
              + 'calculating band power.'
            )}

        </div>
      )}


      {/* -------------------------
          計算済み
      ------------------------- */}

      {bandPowerData && (
        <>

          {/* チャンネル選択 */}
          <div className="band-power-controls">

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

                {bandPowerData.channels.map(
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


            {/* 最大Band */}
            {dominantBand && (
              <span className="dominant-band">
                Dominant Band:{' '}
                {dominantBand}
              </span>
            )}

          </div>


          {/* -------------------------
              Bar Chart
          ------------------------- */}

          <div
            className="band-power-chart"
            style={{
              width: '100%',
              height: 170,
            }}
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
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
                  dataKey="band"
                />

                <YAxis
                  label={{
                    value:
                      'Band Power',
                    angle: -90,
                    position:
                      'insideLeft',
                  }}
                />

                <Tooltip
                  formatter={(
                    value
                  ) => [
                    Number(
                      value
                    ).toExponential(
                      3
                    ),
                    'Power',
                  ]}
                  labelFormatter={(
                    label
                  ) => {

                    const item =
                      chartData.find(
                        (data) =>
                          data.band ===
                          label
                      )

                    if (!item) {
                      return label
                    }

                    return (
                      `${item.band} `
                      + `(${item.range})`
                    )
                  }}
                />

                <Bar
                  dataKey="power"
                  isAnimationActive={
                    false
                  }
                  radius={[3, 3, 0, 0]}
                >
                  {chartData.map(
                    (item) => (
                      <Cell
                        key={item.band}
                        fill={
                          BAND_COLORS[
                            item.band as keyof
                              typeof BAND_COLORS
                          ]
                        }
                      />
                    )
                  )}
                </Bar>

              </BarChart>

            </ResponsiveContainer>

          </div>

        </>
      )}

    </section>
  )
}


export default BandPowerPanel