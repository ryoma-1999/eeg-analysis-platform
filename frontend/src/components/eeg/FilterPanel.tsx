import { useState } from 'react'

import {
  filterEEGData,
} from '../../services/api'

import type {
  EEGData,
  EEGFilteredData,
  EEGFilterSettings,
} from '../../types/eeg'


type FilterPanelProps = {
  eegData: EEGData | null

  onFilterSuccess: (
    data: EEGFilteredData
  ) => void
}


function FilterPanel({
  eegData,
  onFilterSuccess,
}: FilterPanelProps) {

  // -------------------------
  // Filter ON / OFF
  // -------------------------

  const [
    highpassEnabled,
    setHighpassEnabled,
  ] = useState(false)

  const [
    lowpassEnabled,
    setLowpassEnabled,
  ] = useState(false)

  const [
    notchEnabled,
    setNotchEnabled,
  ] = useState(false)


  // -------------------------
  // Filter周波数
  // -------------------------

  const [
    highpassHz,
    setHighpassHz,
  ] = useState(0.5)

  const [
    lowpassHz,
    setLowpassHz,
  ] = useState(40)

  const [
    notchHz,
    setNotchHz,
  ] = useState(50)


  // -------------------------
  // UI状態
  // -------------------------

  const [
    isFiltering,
    setIsFiltering,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  )


  // -------------------------
  // Nyquist周波数
  // -------------------------

  const nyquist =
    eegData
      ? eegData.samplingRate / 2
      : null

  const hasMissing =
    eegData?.missingData.hasMissing
    ?? false


  // -------------------------
  // Filter実行
  // -------------------------

  const handleApplyFilter =
    async () => {

      if (!eegData) {
        return
      }

      setError(null)
      setIsFiltering(true)

      /*
       * OFFになっているFilterは
       * nullとしてBackendへ送る。
       */
      const settings:
        EEGFilterSettings = {

        highpassHz:
          highpassEnabled
            ? highpassHz
            : null,

        lowpassHz:
          lowpassEnabled
            ? lowpassHz
            : null,

        notchHz:
          notchEnabled
            ? notchHz
            : null,
      }

      try {

        const filteredData =
          await filterEEGData(
            eegData,
            settings
          )

        onFilterSuccess(
          filteredData
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
            'Failed to apply filter'
          )
        }

      } finally {

        setIsFiltering(false)

      }
    }


  return (
    <section className="filter-card">

      {/* Header */}
      <div className="filter-card-header">

        <div>
          <h3>
            Signal Filter
          </h3>

          <p>
            Apply optional filters
            to the original EEG data.
          </p>
        </div>

        {nyquist !== null && (
          <span className="nyquist-info">
            Nyquist:{' '}
            {nyquist.toFixed(1)} Hz
          </span>
        )}

      </div>


      {/* Filter設定 */}
      <div className="filter-settings">

        {/* High-pass */}
        <div className="filter-setting">

          <label className="filter-toggle">

            <input
              type="checkbox"
              checked={
                highpassEnabled
              }
              onChange={(event) =>
                setHighpassEnabled(
                  event.target.checked
                )
              }
            />

            <strong>
              High-pass
            </strong>

          </label>

          <div className="filter-frequency">

            <input
              type="number"
              min="0.1"
              step="0.1"
              value={highpassHz}
              disabled={
                !highpassEnabled
              }
              onChange={(event) =>
                setHighpassHz(
                  Number(
                    event.target.value
                  )
                )
              }
            />

            <span>Hz</span>

          </div>

        </div>


        {/* Low-pass */}
        <div className="filter-setting">

          <label className="filter-toggle">

            <input
              type="checkbox"
              checked={
                lowpassEnabled
              }
              onChange={(event) =>
                setLowpassEnabled(
                  event.target.checked
                )
              }
            />

            <strong>
              Low-pass
            </strong>

          </label>

          <div className="filter-frequency">

            <input
              type="number"
              min="0.1"
              step="0.1"
              value={lowpassHz}
              disabled={
                !lowpassEnabled
              }
              onChange={(event) =>
                setLowpassHz(
                  Number(
                    event.target.value
                  )
                )
              }
            />

            <span>Hz</span>

          </div>

        </div>


        {/* Notch */}
        <div className="filter-setting">

          <label className="filter-toggle">

            <input
              type="checkbox"
              checked={
                notchEnabled
              }
              onChange={(event) =>
                setNotchEnabled(
                  event.target.checked
                )
              }
            />

            <strong>
              Notch
            </strong>

          </label>

          <div className="filter-frequency">

            <input
              type="number"
              min="0.1"
              step="0.1"
              value={notchHz}
              disabled={
                !notchEnabled
              }
              onChange={(event) =>
                setNotchHz(
                  Number(
                    event.target.value
                  )
                )
              }
            />

            <span>Hz</span>

          </div>

        </div>

      </div>


      {/* Error */}
      {error && (
        <div className="filter-error">
          {error}
        </div>
      )}

      {hasMissing && (
        <div className="filter-error">
          Reconstruct missing EEG data before
          applying filters.
        </div>
      )}


      {/* Apply */}
      <div className="filter-actions">

        <button
          type="button"
          onClick={
            handleApplyFilter
          }
          disabled={
            !eegData ||
            hasMissing ||
            isFiltering
          }
        >

          {isFiltering
            ? 'Filtering...'
            : 'Apply Filter'}

        </button>

      </div>

    </section>
  )
}


export default FilterPanel
