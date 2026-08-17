import {
  BrainCircuit,
  FileChartColumn,
  Radio,
} from 'lucide-react'


function Sidebar() {
  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="sidebar-brand">

        <div className="sidebar-brand-icon">
          <BrainCircuit size={24} />
        </div>

        <div className="sidebar-brand-text">
          <span>EEG Analysis</span>
          <strong>Platform</strong>
        </div>

      </div>


      {/* Navigation */}
      <nav className="sidebar-nav">

        <ul>

          {/* CSV Analysis */}
          <li className="sidebar-nav-item active">

            <FileChartColumn size={20} />

            <span>
              CSV Analysis
            </span>

          </li>


          {/* Realtime Analysis */}
          <li className="sidebar-nav-item disabled">

            <Radio size={20} />

            <span>
              Realtime Analysis
            </span>

            <span className="coming-soon-badge">
              Coming Soon
            </span>

          </li>


          {/* AI Models */}
          <li className="sidebar-nav-item disabled">

            <BrainCircuit size={20} />

            <span>
              AI Models
            </span>

            <span className="coming-soon-badge">
              Coming Soon
            </span>

          </li>

        </ul>

      </nav>


      {/* Footer */}
      <div className="sidebar-footer">
        v0.1.0
      </div>

    </aside>
  )
}


export default Sidebar