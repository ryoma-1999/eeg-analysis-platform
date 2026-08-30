import {
  useEffect,
  useState,
} from 'react'

import { Sparkles } from 'lucide-react'

import {
  reconstructEEGData,
  reconstructEEGDataMLP,
} from '../../services/api'

import ReconstructionEvaluationModal
  from './ReconstructionEvaluationModal'

import type {
  EEGData,
  EEGReconstructedData,
} from '../../types/eeg'


type ReconstructionPanelProps = {
  eegData: EEGData | null
  reconstructedData: EEGReconstructedData | null
  onReconstructionSuccess: (
    data: EEGReconstructedData
  ) => void
}


function ReconstructionPanel({
  eegData,
  reconstructedData,
  onReconstructionSuccess,
}: ReconstructionPanelProps) {

  const [
    reconstructingMethod,
    setReconstructingMethod,
  ] = useState<
    'linear'
    | 'mlp'
    | null
  >(null)

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  )

  const [
    isEvaluationOpen,
    setIsEvaluationOpen,
  ] = useState(false)


  /* =========================================================
     Missing Data
  ========================================================= */

  const hasMissing =
    eegData?.missingData.hasMissing
    ?? false


  const missingData =
    eegData?.missingData


  /*
   * 同じ時間帯の欠損が
   * 複数チャンネルに存在しても
   * 1つのSegmentとして数える
   */
  const detectedSegments =
    missingData
      ? new Set(
          missingData.channels.flatMap(
            channel =>
              channel.segments.map(
                segment =>
                  `${segment.startSample}-${segment.endSample}`
              )
          )
        ).size
      : 0


  /* =========================================================
     Reset
  ========================================================= */

  useEffect(() => {

    setError(null)

    setReconstructingMethod(null)

    setIsEvaluationOpen(
      false
    )

  }, [eegData])


  /* =========================================================
     Reconstruction
  ========================================================= */

  const handleReconstruct = async (
    method: 'linear' | 'mlp'
  ) => {

    if (
      !eegData
      || !hasMissing
    ) {
      return
    }

    setError(
      null
    )

    setReconstructingMethod(
      method
    )

    try {

      const result =
        method === 'linear'
          ? await reconstructEEGData(
              eegData
            )
          : await reconstructEEGDataMLP(
              eegData
            )

      onReconstructionSuccess(
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
          'Failed to reconstruct EEG data'
        )

      }

    } finally {

      setReconstructingMethod(
        null
      )

    }

  }


  /* =========================================================
     UI
  ========================================================= */

  return (

    <section className="reconstruction-card">

      {/* =====================================================
          Header
      ===================================================== */}

      <div className="reconstruction-card-header">

        <div className="reconstruction-icon">

          <Sparkles
            size={20}
          />

        </div>


        <span className="reconstruction-method">
          Linear / AI
        </span>

      </div>


      <h3>
        Missing Data / Reconstruction
      </h3>


      <p>
        Detect missing EEG samples and reconstruct
        them using Linear or AI interpolation.
      </p>


      {/* =====================================================
          Missing Data Summary
      ===================================================== */}

      <div className="reconstruction-missing-summary">

        {/* Missing Samples */}

        <div>

          <span>
            Missing Samples
          </span>

          <strong>
            {
              missingData
                ? missingData
                    .totalMissingCount
                    .toLocaleString()
                : '—'
            }
          </strong>

        </div>


        {/* Missing Rate */}

        <div>

          <span>
            Missing Rate
          </span>

          <strong>
            {
              missingData
                ? `${(
                    missingData
                      .missingRate
                    * 100
                  ).toFixed(2)}%`
                : '—'
            }
          </strong>

        </div>


        {/* Detected Segments */}

        <div>

          <span>
            Detected Segments
          </span>

          <strong>
            {
              eegData
                ? detectedSegments
                : '—'
            }
          </strong>

        </div>

      </div>


      {/* =====================================================
          Missing Data Status
      ===================================================== */}

      {eegData && (

        <div
          className={
            hasMissing
              ? (
                  'reconstruction-missing-status '
                  + 'warning'
                )
              : (
                  'reconstruction-missing-status '
                  + 'complete'
                )
          }
        >

          {
            hasMissing
              ? (
                  reconstructedData
                    ? (
                        'Missing EEG data was detected. '
                        + 'Reconstruction has been completed.'
                      )
                    : (
                        'Missing EEG data detected. '
                        + 'Reconstruction is recommended '
                        + 'before signal processing.'
                      )
                )
              : (
                  'No missing EEG data detected.'
                )
          }

        </div>

      )}


      {/* =====================================================
          Reconstruction Result
      ===================================================== */}

      {reconstructedData && (

        <div className="reconstruction-result">

          Reconstructed{' '}

          <strong>
            {
              reconstructedData
                .reconstructedCount
                .toLocaleString()
            }
          </strong>

          {' '}samples with{' '}

          <strong>
            {
              reconstructedData
                .reconstructionMethod
                === 'mlp'
                ? 'AI (MLP)'
                : 'Linear'
            }
          </strong>

        </div>

      )}


      {/* =====================================================
          Error
      ===================================================== */}

      {error && (

        <div className="reconstruction-error">

          {error}

        </div>

      )}


      {/* =====================================================
          Reconstruction Actions
      ===================================================== */}

      <div className="reconstruction-actions">

        {/* Linear */}

        <button
          type="button"
          onClick={() =>
            handleReconstruct(
              'linear'
            )
          }
          disabled={
            !eegData
            || !hasMissing
            || reconstructingMethod
              !== null
          }
        >

          {
            reconstructingMethod
              === 'linear'
              ? 'Reconstructing...'
              : 'Run Linear Reconstruction'
          }

        </button>


        {/* AI */}

        <button
          type="button"
          onClick={() =>
            handleReconstruct(
              'mlp'
            )
          }
          disabled={
            !eegData
            || !hasMissing
            || reconstructingMethod
              !== null
          }
        >

          {
            reconstructingMethod
              === 'mlp'
              ? 'Training AI...'
              : 'Run AI Reconstruction'
          }

        </button>

      </div>


      {/* =====================================================
          Evaluation
      ===================================================== */}

      <div className="reconstruction-actions">

        <button
          type="button"
          className="reconstruction-evaluate-button"
          onClick={() =>
            setIsEvaluationOpen(
              true
            )
          }
          disabled={
            !eegData
            || hasMissing
          }
        >

          Open Evaluation

        </button>

      </div>


      {/* =====================================================
          Evaluation Modal
      ===================================================== */}

      {isEvaluationOpen && (

        <ReconstructionEvaluationModal
          eegData={
            eegData
          }
          onClose={() =>
            setIsEvaluationOpen(
              false
            )
          }
        />

      )}

    </section>

  )

}


export default ReconstructionPanel