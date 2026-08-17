import { useEffect, useState } from 'react'
import { Upload } from 'lucide-react'

import { checkAPIHealth } from '../../services/api'


type HeaderProps = {
  onUploadClick: () => void
}


function Header({
  onUploadClick,
}: HeaderProps) {
  const [
    isOnline,
    setIsOnline,
  ] = useState(false)


  useEffect(() => {
    const checkHealth = async () => {
      const online =
        await checkAPIHealth()

      setIsOnline(online)
    }

    checkHealth()
  }, [])


  return (
    <header className="page-header">

      <div className="page-header-title">

        <h1>
          CSV Analysis
        </h1>

        <p>
          Upload, preprocess, analyze,
          and classify EEG data
        </p>

      </div>


      <div className="page-header-actions">

        <div
          className={
            `api-status ${
              isOnline
                ? 'online'
                : 'offline'
            }`
          }
        >

          <span className="status-dot" />

          <span>
            API {
              isOnline
                ? 'Online'
                : 'Offline'
            }
          </span>

        </div>


        <button
          type="button"
          className="header-upload-button"
          onClick={onUploadClick}
        >
          <Upload size={17} />

          Upload New CSV
        </button>

      </div>

    </header>
  )
}


export default Header