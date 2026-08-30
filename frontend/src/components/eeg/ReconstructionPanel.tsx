import {
  useEffect,
  useState,
} from 'react'
import { Sparkles } from 'lucide-react'

import {
  evaluateLinearReconstruction,
  evaluateMLPReconstruction,
  reconstructEEGData,
  reconstructEEGDataMLP,
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
  const [reconstructingMethod, setReconstructingMethod] =
    useState<'linear' | 'mlp' | null>(null)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const [evaluatingMethod, setEvaluatingMethod] =
    useState<'linear' | 'mlp' | null>(null)

  const [evaluations, setEvaluations] = useState<{
    linear: EEGReconstructionEvaluation | null
    mlp: EEGReconstructionEvaluation | null
  }>({ linear: null, mlp: null })

  const hasMissing =
    eegData?.missingData.hasMissing
    ?? false

  useEffect(() => {
    setEvaluations({ linear: null, mlp: null })
    setError(null)
  }, [eegData])

  const handleReconstruct = async (
    method: 'linear' | 'mlp'
  ) => {
    if (!eegData || !hasMissing) {
      return
    }

    setError(null)
    setReconstructingMethod(method)

    try {
      const result = method === 'linear'
        ? await reconstructEEGData(eegData)
        : await reconstructEEGDataMLP(eegData)

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
      setReconstructingMethod(null)
    }
  }

  const handleEvaluate = async (
    method: 'linear' | 'mlp'
  ) => {
    if (!eegData || hasMissing) {
      return
    }

    setError(null)
    setEvaluatingMethod(method)

    try {
      const result = method === 'linear'
        ? await evaluateLinearReconstruction(eegData)
        : await evaluateMLPReconstruction(eegData)

      setEvaluations(current => ({
        ...current,
        [method]: result,
      }))

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(
          'Failed to evaluate reconstruction'
        )
      }

    } finally {
      setEvaluatingMethod(null)
    }
  }

  return (
    <section className="reconstruction-card">
      <div className="reconstruction-card-header">
        <div className="reconstruction-icon">
          <Sparkles size={20} />
        </div>

        <span className="reconstruction-method">
          Linear / AI
        </span>
      </div>

      <h3>Reconstruction</h3>

      <p>
        Compare channel-wise linear interpolation
        with a bidirectional autoregressive MLP.
      </p>

      {reconstructedData && (
        <div className="reconstruction-result">
          Reconstructed{' '}
          <strong>
            {reconstructedData.reconstructedCount}
          </strong>{' '}
          samples
          {' '}with{' '}
          <strong>
            {reconstructedData.reconstructionMethod === 'mlp'
              ? 'AI (MLP)'
              : 'Linear'}
          </strong>
        </div>
      )}

      {error && (
        <div className="reconstruction-error">
          {error}
        </div>
      )}

      {(evaluations.linear || evaluations.mlp) && (
        <div className="reconstruction-comparison">
          {(['linear', 'mlp'] as const).map(method => {
            const evaluation = evaluations[method]

            return evaluation && (
              <div className="reconstruction-evaluation" key={method}>
                <h4>{method === 'linear' ? 'Linear' : 'AI (MLP)'}</h4>
                <div className="reconstruction-metrics">
                  <div><span>RMSE</span><strong>{evaluation.rmse.toFixed(4)}</strong></div>
                  <div><span>MAE</span><strong>{evaluation.mae.toFixed(4)}</strong></div>
                  <div>
                    <span>Correlation</span>
                    <strong>{evaluation.correlation === null ? '—' : evaluation.correlation.toFixed(4)}</strong>
                  </div>
                </div>
                <small>{evaluation.maskedCount} known samples were hidden and reconstructed.</small>
              </div>
            )
          })}
        </div>
      )}

      <div className="reconstruction-actions">
        <button
          type="button"
          onClick={() => handleReconstruct('linear')}
          disabled={!eegData || !hasMissing || reconstructingMethod !== null}
        >
          {reconstructingMethod === 'linear' ? 'Reconstructing...' : 'Run Linear Reconstruction'}
        </button>
        <button
          type="button"
          onClick={() => handleReconstruct('mlp')}
          disabled={!eegData || !hasMissing || reconstructingMethod !== null}
        >
          {reconstructingMethod === 'mlp' ? 'Training AI...' : 'Run AI Reconstruction'}
        </button>
      </div>

      <div className="reconstruction-actions">
        <button
          type="button"
          className="reconstruction-evaluate-button"
          onClick={() => handleEvaluate('linear')}
          disabled={!eegData || hasMissing || evaluatingMethod !== null}
        >
          {evaluatingMethod === 'linear' ? 'Evaluating...' : 'Evaluate Linear'}
        </button>
        <button
          type="button"
          className="reconstruction-evaluate-button"
          onClick={() => handleEvaluate('mlp')}
          disabled={!eegData || hasMissing || evaluatingMethod !== null}
        >
          {evaluatingMethod === 'mlp' ? 'Training & Evaluating...' : 'Evaluate AI'}
        </button>
      </div>
    </section>
  )
}


export default ReconstructionPanel
