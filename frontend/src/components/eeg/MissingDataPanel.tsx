import {
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

import type {
  EEGData,
} from '../../types/eeg'


type MissingDataPanelProps = {
  eegData: EEGData | null
}


function MissingDataPanel({
  eegData,
}: MissingDataPanelProps) {
  if (!eegData) {
    return null
  }

  const missing = eegData.missingData

  if (!missing.hasMissing) {
    return (
      <section className="missing-data-card complete">
        <CheckCircle2 size={20} />

        <div>
          <strong>No missing EEG data</strong>
          <p>
            All {missing.totalValueCount.toLocaleString()}
            {' '}EEG values are available.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="missing-data-card warning">
      <div className="missing-data-header">
        <div className="missing-data-title">
          <AlertTriangle size={20} />

          <div>
            <strong>Missing EEG data detected</strong>
            <p>
              Reconstruction is required before
              signal processing.
            </p>
          </div>
        </div>

        <span className="missing-data-rate">
          {(missing.missingRate * 100).toFixed(2)}%
        </span>
      </div>

      <div className="missing-data-summary">
        <span>
          Missing values
          <strong>
            {missing.totalMissingCount.toLocaleString()}
            {' / '}
            {missing.totalValueCount.toLocaleString()}
          </strong>
        </span>

        <span>
          Affected channels
          <strong>
            {missing.channels.length}
            {' / '}
            {eegData.channels.length}
          </strong>
        </span>
      </div>

      <div className="missing-channel-list">
        {missing.channels.map((channel) => (
          <div
            className="missing-channel-item"
            key={channel.channel}
          >
            <strong>{channel.channel}</strong>

            <span>
              {channel.missingCount} samples
              {' · '}
              {(channel.missingRate * 100).toFixed(2)}%
              {' · '}
              {channel.segments.length} gap(s)
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}


export default MissingDataPanel
