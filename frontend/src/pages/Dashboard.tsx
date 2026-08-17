import { useState } from 'react'

import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'

import EEGChart from '../components/eeg/EEGChart'
import FileUpload from '../components/eeg/FileUpload'
import FilterPanel from '../components/eeg/FilterPanel'

import type {
  EEGData,
  EEGFilteredData,
} from '../types/eeg'

import PSDPanel from '../components/eeg/PSDPanel'


function Dashboard() {
  /*
   * CSVから読み込んだ元EEG
   *
   * Original EEGは絶対に上書きしない。
   */
  const [
    eegData,
    setEEGData,
  ] = useState<EEGData | null>(
    null
  )


  /*
   * Filter後のEEG
   *
   * Originalとは別に保持する。
   */
  const [
    filteredData,
    setFilteredData,
  ] = useState<
    EEGFilteredData | null
  >(
    null
  )


  /*
   * 現在画面に表示するデータ
   *
   * original
   * または
   * filtered
   */
  const [
    displaySource,
    setDisplaySource,
  ] = useState<
    'original' | 'filtered'
  >(
    'original'
  )


  /*
   * -------------------------
   * CSV Upload成功
   * -------------------------
   */
  const handleUploadSuccess = (
    data: EEGData
  ) => {
    /*
     * 新しいOriginal EEGを保存
     */
    setEEGData(data)

    /*
     * 前のCSVから作ったFiltered EEGは
     * もう使えないので削除
     */
    setFilteredData(null)

    /*
     * Original表示へ戻す
     */
    setDisplaySource(
      'original'
    )
  }


  /*
   * -------------------------
   * Filter成功
   * -------------------------
   */
  const handleFilterSuccess = (
    data: EEGFilteredData
  ) => {
    /*
     * Filter結果を保存
     */
    setFilteredData(data)

    /*
     * Filter成功後は
     * Filtered EEGを表示する
     */
    setDisplaySource(
      'filtered'
    )
  }


  /*
   * -------------------------
   * 実際にEEGChartへ渡すデータ
   * -------------------------
   */

  let displayData:
    EEGData | null = eegData

  if (
    displaySource === 'filtered'
    && filteredData
  ) {
    displayData =
      filteredData
  }


  return (
    <div className="dashboard">
      <Header />

      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main">
          <h2>
            脳波記録
          </h2>


          {/* -------------------------
              Original / Filtered切替
          ------------------------- */}

          {eegData && (
            <div className="signal-source-control">
              <span>
                Signal:
              </span>

              <button
                type="button"
                className={
                  displaySource ===
                  'original'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setDisplaySource(
                    'original'
                  )
                }
              >
                Original
              </button>

              <button
                type="button"
                className={
                  displaySource ===
                  'filtered'
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
          )}


          {/* EEG波形 */}
          <EEGChart
            eegData={
              displayData
            }
          />

          {/* PSD */}
          <PSDPanel
            eegData={
            displayData
            }
          />


          {/* Filter設定 */}
          <FilterPanel
            eegData={
              eegData
            }
            onFilterSuccess={
              handleFilterSuccess
            }
          />


          {/* CSV Upload */}
          <FileUpload
            onUploadSuccess={
              handleUploadSuccess
            }
          />
        </main>
      </div>
    </div>
  )
}


export default Dashboard