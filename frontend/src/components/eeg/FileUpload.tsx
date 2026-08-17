import { useState } from 'react'
import { uploadEEGFile } from '../../services/api'
import type { EEGData } from '../../types/eeg'

type FileUploadProps = {
  onUploadSuccess: (data: EEGData) => void
}

function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setFileName(file.name)

    try {
      const eegData = await uploadEEGFile(file)

      onUploadSuccess(eegData)
    } catch (error) {
      console.error('EEG upload failed:', error)
    }
  }

  return (
    <section className="upload-card">
      <div className="upload-card-header">
        <h3>EEG Data Upload</h3>
        <p>Upload an EEG CSV file to start analysis.</p>
      </div>

      <label className="upload-area">
      <input
          id="eeg-file-input"
          className="upload-input"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
        />

        <div className="upload-content">
          <div className="upload-icon">↑</div>

          <strong>
            {fileName ?? 'Choose an EEG CSV file'}
          </strong>

          <span>
            {fileName
              ? 'File selected'
              : 'or drag and drop it here'}
          </span>

          <small>CSV files only</small>
        </div>
      </label>
    </section>
  )
}

export default FileUpload