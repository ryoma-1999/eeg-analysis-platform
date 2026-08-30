import { useState } from 'react'

import {
  evaluateLinearReconstruction,
  evaluateMLPReconstruction,
} from '../../services/api'

import type {
  EEGData,
  EEGReconstructionEvaluation,
} from '../../types/eeg'


type Props = {
  eegData: EEGData | null
  onClose: () => void
}


function ReconstructionEvaluationModal({
  eegData,
  onClose,
}: Props) {

  const [maskRate, setMaskRate] = useState(0.1)
  const [gapDuration, setGapDuration] = useState(0.2)
  const [randomSeed, setRandomSeed] = useState(42)

  const [linear, setLinear] =
    useState<EEGReconstructionEvaluation | null>(null)

  const [mlp, setMLP] =
    useState<EEGReconstructionEvaluation | null>(null)

  const [running, setRunning] = useState(false)

  const handleRun = async () => {
    if (!eegData) {
      return
    }

    setRunning(true)

    try {
      const settings = {
        maskRate,
        gapDurationSeconds: gapDuration,
        randomSeed,
      }

      const linearResult =
        await evaluateLinearReconstruction(
          eegData,
          settings
        )

      const mlpResult =
        await evaluateMLPReconstruction(
          eegData,
          settings
        )

      setLinear(linearResult)
      setMLP(mlpResult)

    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="reconstruction-modal-overlay">

      <div className="reconstruction-modal">

        <div className="reconstruction-modal-header">
          <h3>
            Reconstruction Evaluation
          </h3>

          <button
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="reconstruction-modal-settings">

          <label>
            Mask Rate

            <select
              value={maskRate}
              onChange={(event) =>
                setMaskRate(
                  Number(event.target.value)
                )
              }
            >
              <option value={0.05}>5%</option>
              <option value={0.1}>10%</option>
              <option value={0.2}>20%</option>
            </select>
          </label>

          <label>
            Gap Duration

            <select
              value={gapDuration}
              onChange={(event) =>
                setGapDuration(
                  Number(event.target.value)
                )
              }
            >
              <option value={0.1}>
                0.1 sec
              </option>

              <option value={0.2}>
                0.2 sec
              </option>

              <option value={0.5}>
                0.5 sec
              </option>
            </select>
          </label>

          <label>
            Random Seed

            <input
              type="number"
              value={randomSeed}
              onChange={(event) =>
                setRandomSeed(
                  Number(event.target.value)
                )
              }
            />
          </label>

          <button
            type="button"
            onClick={handleRun}
            disabled={!eegData || running}
          >
            {running
              ? 'Running...'
              : 'Run Comparison'}
          </button>

        </div>

        {(linear || mlp) && (

          <table className="reconstruction-evaluation-table">

            <thead>
              <tr>
                <th>Method</th>
                <th>RMSE</th>
                <th>MAE</th>
                <th>Correlation</th>
              </tr>
            </thead>

            <tbody>

              {linear && (
                <tr>
                  <td>Linear</td>
                  <td>{linear.rmse.toFixed(4)}</td>
                  <td>{linear.mae.toFixed(4)}</td>
                  <td>
                    {linear.correlation === null
                      ? '—'
                      : linear.correlation.toFixed(4)}
                  </td>
                </tr>
              )}

              {mlp && (
                <tr>
                  <td>AI (MLP)</td>
                  <td>{mlp.rmse.toFixed(4)}</td>
                  <td>{mlp.mae.toFixed(4)}</td>
                  <td>
                    {mlp.correlation === null
                      ? '—'
                      : mlp.correlation.toFixed(4)}
                  </td>
                </tr>
              )}

            </tbody>

          </table>
        )}

      </div>

    </div>
  )
}


export default ReconstructionEvaluationModal