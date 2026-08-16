import { useState } from 'react'

import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import EEGChart from '../components/eeg/EEGChart'
import FileUpload from '../components/eeg/FileUpload'

import type { EEGData } from '../types/eeg'

function Dashboard() {
  const [eegData, setEEGData] = useState<EEGData | null>(null)

  const handleUploadSuccess = (data: EEGData) => {
    setEEGData(data)
  }

  return (
    <div className="dashboard">
      <Header />

      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main">
          <h2>脳波記録</h2>

          <EEGChart eegData={eegData} />

          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </main>
      </div>
    </div>
  )
}

export default Dashboard