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
  ] = useState<string | null>(null)

  const [
    isEvaluationOpen,
    setIsEvaluationOpen,
  ] = useState(false)


  const hasMissing =
    eegData?.missingData.hasMissing
    ?? false


  useEffect(() => {

    setError(null)

    setIsEvaluationOpen(false)

  }, [eegData])


  const handleReconstruct = async (
    method: 'linear' | 'mlp'
  ) => {

    if (
      !eegData
      || !hasMissing
    ) {
      return
    }

    setError(null)

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


  return (

    <section className="reconstruction-card">

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
        Reconstruction
      </h3>


      <p>
        Compare channel-wise linear interpolation
        with a bidirectional autoregressive MLP.
      </p>


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