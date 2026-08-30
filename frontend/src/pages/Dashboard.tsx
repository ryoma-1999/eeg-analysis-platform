import { useState } from 'react'

import {
  Activity,
  BrainCircuit,
  Clock3,
  FileText,
  Radio,
} from 'lucide-react'

import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'

import EEGChart from '../components/eeg/EEGChart'
import FileUpload from '../components/eeg/FileUpload'
import FilterPanel from '../components/eeg/FilterPanel'
import ReconstructionPanel from '../components/eeg/ReconstructionPanel'
import PSDPanel from '../components/eeg/PSDPanel'
import BandPowerPanel from '../components/eeg/BandPowerPanel'

import type {
  EEGData,
  EEGFilteredData,
  EEGReconstructedData,
} from '../types/eeg'


function Dashboard() {

  /* =========================================================
     Original EEG
  ========================================================= */

  const [
    eegData,
    setEEGData,
  ] = useState<EEGData | null>(
    null
  )


  /* =========================================================
     Reconstructed EEG
  ========================================================= */

  const [
    reconstructedData,
    setReconstructedData,
  ] = useState<
    EEGReconstructedData | null
  >(
    null
  )


  /* =========================================================
     Filtered EEG
  ========================================================= */

  const [
    filteredData,
    setFilteredData,
  ] = useState<
    EEGFilteredData | null
  >(
    null
  )


  /* =========================================================
     Current Display Source
  ========================================================= */

  const [
    displaySource,
    setDisplaySource,
  ] = useState<
    'original'
    | 'reconstructed'
    | 'filtered'
  >(
    'original'
  )


  /* =========================================================
     CSV Upload Success
  ========================================================= */

  const handleUploadSuccess = (
    data: EEGData
  ) => {

    /*
     * 新しいOriginal EEGを保存
     */
    setEEGData(
      data
    )


    /*
     * 以前のReconstructed EEGは削除
     */
    setReconstructedData(
      null
    )


    /*
     * 以前のFiltered EEGは削除
     */
    setFilteredData(
      null
    )


    /*
     * Original表示へ戻す
     */
    setDisplaySource(
      'original'
    )

  }


  /* =========================================================
     Reconstruction Success
  ========================================================= */

  const handleReconstructionSuccess = (
    data: EEGReconstructedData
  ) => {

    setReconstructedData(
      data
    )

    setFilteredData(
      null
    )

    setDisplaySource(
      'reconstructed'
    )

  }


  /* =========================================================
     Filter Success
  ========================================================= */

  const handleFilterSuccess = (
    data: EEGFilteredData
  ) => {

    /*
     * Filter結果を保存
     */
    setFilteredData(
      data
    )


    /*
     * Filter成功後は
     * Filtered EEGを表示
     */
    setDisplaySource(
      'filtered'
    )

  }


  /* =========================================================
     Display EEG
  ========================================================= */

  let displayData:
    EEGData | null = eegData


  /*
   * Reconstructed表示
   */
  if (
    displaySource
      === 'reconstructed'
    && reconstructedData
  ) {

    displayData =
      reconstructedData

  }


  /*
   * Filtered表示
   */
  if (
    displaySource
      === 'filtered'
    && filteredData
  ) {

    displayData =
      filteredData

  }


  /*
   * 元データに欠損がある場合、
   * FilterはReconstructed EEGに対して実行する。
   *
   * 欠損がない場合はOriginal EEGを使用する。
   */
  const filterInputData =
    eegData
      ?.missingData
      .hasMissing
      ? reconstructedData
      : eegData


  /* =========================================================
     UI
  ========================================================= */

  return (

    <div className="dashboard">

      {/* =====================================================
          Sidebar
      ===================================================== */}

      <Sidebar />


      {/* =====================================================
          Right Content
      ===================================================== */}

      <div className="dashboard-content">


        {/* ===================================================
            Header
        =================================================== */}

        <Header
          onUploadClick={() => {

            document
              .getElementById(
                'eeg-file-input'
              )
              ?.click()

          }}
        />


        <main className="dashboard-main">


          {/* =================================================
              Dataset Summary
          ================================================= */}

          <section className="dataset-summary">


            {/* File Name */}

            <div className="dataset-summary-item">

              <div className="dataset-summary-icon">

                <FileText
                  size={19}
                />

              </div>


              <div className="dataset-summary-text">

                <span>
                  File Name
                </span>

                <strong>
                  {
                    eegData
                      ? eegData.fileName
                      : 'No file loaded'
                  }
                </strong>

              </div>

            </div>


            {/* Channels */}

            <div className="dataset-summary-item">

              <div className="dataset-summary-icon">

                <Activity
                  size={19}
                />

              </div>


              <div className="dataset-summary-text">

                <span>
                  Channels
                </span>

                <strong>
                  {
                    eegData
                      ? eegData
                          .channels
                          .length
                      : '—'
                  }
                </strong>

              </div>

            </div>


            {/* Sampling Rate */}

            <div className="dataset-summary-item">

              <div className="dataset-summary-icon">

                <Radio
                  size={19}
                />

              </div>


              <div className="dataset-summary-text">

                <span>
                  Sampling Rate
                </span>

                <strong>
                  {
                    eegData
                      ? `${eegData.samplingRate} Hz`
                      : '—'
                  }
                </strong>

              </div>

            </div>


            {/* Duration */}

            <div className="dataset-summary-item">

              <div className="dataset-summary-icon">

                <Clock3
                  size={19}
                />

              </div>


              <div className="dataset-summary-text">

                <span>
                  Duration
                </span>

                <strong>
                  {
                    eegData
                      ? `${eegData.duration.toFixed(1)} sec`
                      : '—'
                  }
                </strong>

              </div>

            </div>

          </section>


          {/* =================================================
              Signal Source
          ================================================= */}

          <div className="signal-source-row">

            <span className="signal-source-label">
              Signal Source
            </span>


            <div className="signal-source-control">


              {/* Original */}

              <button
                type="button"
                className={
                  displaySource
                    === 'original'
                    ? 'active'
                    : ''
                }
                disabled={
                  !eegData
                }
                onClick={() =>
                  setDisplaySource(
                    'original'
                  )
                }
              >
                Original
              </button>


              {/* Reconstructed */}

              <button
                type="button"
                className={
                  displaySource
                    === 'reconstructed'
                    ? 'active'
                    : ''
                }
                disabled={
                  !reconstructedData
                }
                onClick={() =>
                  setDisplaySource(
                    'reconstructed'
                  )
                }
              >
                Reconstructed
              </button>


              {/* Filtered */}

              <button
                type="button"
                className={
                  displaySource
                    === 'filtered'
                    ? 'active'
                    : ''
                }
                disabled={
                  !filteredData
                }
                onClick={() =>
                  setDisplaySource(
                    'filtered'
                  )
                }
              >
                Filtered
              </button>

            </div>

          </div>


          {/* =================================================
              EEG Waveform
          ================================================= */}

          <EEGChart
            eegData={
              displayData
            }
          />


          {/* =================================================
              Preprocessing
          ================================================= */}

          <section className="workspace-section">

            <div className="workspace-section-title">

              <h2>
                Preprocessing
              </h2>

            </div>


            <div className="preprocessing-grid">


              {/* Filter */}

              <FilterPanel
                eegData={
                  filterInputData
                }
                onFilterSuccess={
                  handleFilterSuccess
                }
              />


              {/* Missing Data / Reconstruction */}

              <ReconstructionPanel
                eegData={
                  eegData
                }
                reconstructedData={
                  reconstructedData
                }
                onReconstructionSuccess={
                  handleReconstructionSuccess
                }
              />

            </div>

          </section>


          {/* =================================================
              Analysis
          ================================================= */}

          <section className="workspace-section">

            <div className="workspace-section-title">

              <h2>
                Analysis
              </h2>

            </div>


            <div className="analysis-grid">


              {/* PSD */}

              <PSDPanel
                eegData={
                  displayData
                }
              />


              {/* Band Power */}

              <BandPowerPanel
                eegData={
                  displayData
                }
              />

            </div>

          </section>


          {/* =================================================
              AI Analysis
          ================================================= */}

          <section className="ai-analysis-card">

            <div className="ai-analysis-header">


              <div>

                <div className="ai-analysis-title">

                  <BrainCircuit
                    size={20}
                  />

                  <h3>
                    AI Analysis
                  </h3>

                </div>


                <p>
                  Analyze EEG data using
                  registered AI models.
                </p>

              </div>


              <span className="feature-coming-soon">
                Coming Soon
              </span>

            </div>


            <div className="ai-analysis-content">


              {/* Model Select */}

              <div className="ai-model-select">

                <label>
                  Model
                </label>

                <select
                  disabled
                  defaultValue=""
                >

                  <option value="">
                    No AI model available
                  </option>

                </select>

              </div>


              {/* Run AI */}

              <button
                type="button"
                className="ai-run-button"
                disabled
              >

                <BrainCircuit
                  size={17}
                />

                Run AI Analysis

              </button>


              {/* Prediction */}

              <div className="ai-result-placeholder">

                <span>
                  Prediction
                </span>

                <strong>
                  —
                </strong>

                <span>
                  Confidence
                </span>

                <strong>
                  —
                </strong>

              </div>

            </div>

          </section>


          {/* =================================================
              Hidden File Upload

              HeaderのUpload New CSVから
              このinputをクリックする
          ================================================= */}

          <div className="background-file-upload">

            <FileUpload
              onUploadSuccess={
                handleUploadSuccess
              }
            />

          </div>


        </main>

      </div>

    </div>

  )

}


export default Dashboard