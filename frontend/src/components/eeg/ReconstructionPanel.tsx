import { useState } from 'react'
import { Sparkles } from 'lucide-react'

import {
  reconstructEEGData,
} from '../../services/api'

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
    isReconstructing,
    setIsReconstructing,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const hasMissing =
    eegData?.missingData.hasMissing
    ?? false

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
    </section>
  )
}


export default ReconstructionPanel
