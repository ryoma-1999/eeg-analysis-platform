import {
  useEffect,
  useState,
} from 'react'
import { Sparkles } from 'lucide-react'

import {
  evaluateLinearReconstruction,
  reconstructEEGData,
} from '../../services/api'

import type {
  EEGData,
  EEGReconstructionEvaluation,
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
    isReconstructing,
    setIsReconstructing,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const [
    isEvaluating,
    setIsEvaluating,
  ] = useState(false)

  const [
    evaluation,
    setEvaluation,
  ] = useState<
    EEGReconstructionEvaluation | null
  >(null)

  const hasMissing =
    eegData?.missingData.hasMissing
    ?? false

  useEffect(() => {
    setEvaluation(null)
    setError(null)
  }, [eegData])

  const handleReconstruct = async () => {
    if (!eegData || !hasMissing) {
      return
    }

    setError(null)
    setIsReconstructing(true)

    try {
      const result =
        await reconstructEEGData(eegData)

      onReconstructionSuccess(result)

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(
          'Failed to reconstruct EEG data'
        )
      }

    } finally {
      setIsReconstructing(false)
    }
  }

  const handleEvaluate = async () => {
    if (!eegData || hasMissing) {
      return
    }

    setError(null)
    setIsEvaluating(true)

    try {
      const result =
        await evaluateLinearReconstruction(
          eegData
        )

      setEvaluation(result)

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(
          'Failed to evaluate reconstruction'
        )
      }

    } finally {
      setIsEvaluating(false)
    }
  }

  return (
    <section className="reconstruction-card">
      <div className="reconstruction-card-header">
        <div className="reconstruction-icon">
          <Sparkles size={20} />
        </div>

        <span className="reconstruction-method">
          Linear Baseline
        </span>
      </div>

      <h3>Reconstruction</h3>

      <p>
        Reconstruct missing samples using
        channel-wise linear interpolation.
      </p>

      {reconstructedData && (
        <div className="reconstruction-result">
          Reconstructed{' '}
          <strong>
            {reconstructedData.reconstructedCount}
          </strong>{' '}
          samples
        </div>
      )}

      {error && (
        <div className="reconstruction-error">
          {error}
        </div>
      )}

      {evaluation && (
        <div className="reconstruction-metrics">
          <div>
            <span>RMSE</span>
            <strong>
              {evaluation.rmse.toFixed(4)}
            </strong>
          </div>

          <div>
            <span>MAE</span>
            <strong>
              {evaluation.mae.toFixed(4)}
            </strong>
          </div>

          <div>
            <span>Correlation</span>
            <strong>
              {evaluation.correlation === null
                ? '—'
                : evaluation.correlation.toFixed(4)}
            </strong>
          </div>

          <small>
            {evaluation.maskedCount} known samples
            were hidden and reconstructed.
          </small>
        </div>
      )}

      <button
        type="button"
        onClick={handleReconstruct}
        disabled={
          !eegData
          || !hasMissing
          || isReconstructing
        }
      >
        {isReconstructing
          ? 'Reconstructing...'
          : reconstructedData
            ? 'Run Again'
            : 'Run Reconstruction'}
      </button>

      <button
        type="button"
        className="reconstruction-evaluate-button"
        onClick={handleEvaluate}
        disabled={
          !eegData
          || hasMissing
          || isEvaluating
        }
      >
        {isEvaluating
          ? 'Evaluating...'
          : 'Evaluate Linear Baseline'}
      </button>
    </section>
  )
}


export default ReconstructionPanel
