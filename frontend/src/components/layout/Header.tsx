import { useEffect, useState } from 'react'
import { checkAPIHealth } from '../../services/api'

function Header() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const checkHealth = async () => {
      const online = await checkAPIHealth()

      setIsOnline(online)
    }

    checkHealth()
  }, [])

  return (
    <header className="app-header">
      <h1 className="app-title">
        EEG Analysis Platform
      </h1>

      <div
        className={`api-status ${
          isOnline ? 'online' : 'offline'
        }`}
      >
        <span className="status-dot" />

        <span>
          API {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </header>
  )
}

export default Header