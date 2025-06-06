import React, { useState } from 'react';
import { Download, Upload, Trash2, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import podoLogo from '../assets/podo_logo.png';

interface DataManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: 'objects' | 'week' | 'analytics' | 'assistant';
}

const DataManager: React.FC<DataManagerProps> = ({ isOpen, onClose, currentTab }) => {
  const { exportTabData, importTabData, clearAllData } = useAppContext();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  if (!isOpen) return null;



  const getTabDisplayName = () => {
    switch (currentTab) {
      case 'objects': return 'My Objects';
      case 'week': return 'My Week';
      case 'analytics': return 'My Analytics';
      case 'assistant': return 'My Assistant';
      default: return 'Current Tab';
    }
  };

  const getTabDescription = () => {
    switch (currentTab) {
      case 'objects': return 'recipes, workouts, and todo lists';
      case 'week': return 'scheduled items and week settings';
      case 'analytics': return 'objects, scheduled items, and analytics data';
      case 'assistant': return 'chat conversations (not available for backup)';
      default: return 'current tab data';
    }
  };

  const isDataManagementAvailable = currentTab !== 'assistant';

  const handleExport = () => {
    try {
      // Assistant tab doesn't support export/import, so we skip it
      if (currentTab === 'assistant') {
        alert('Data export is not available for the Assistant tab.');
        return;
      }
      
      const data = exportTabData(currentTab);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `podo-${currentTab}-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Assistant tab doesn't support export/import, so we skip it
    if (currentTab === 'assistant') {
      alert('Data import is not available for the Assistant tab.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const success = importTabData(currentTab, data);
        
        if (success) {
          setImportStatus('success');
          setImportMessage('Data imported successfully! Your app has been updated.');
          setTimeout(() => {
            setImportStatus('idle');
            onClose();
          }, 2000);
        } else {
          setImportStatus('error');
          setImportMessage('Failed to import data. Please check the file format.');
        }
      } catch (error) {
        setImportStatus('error');
        setImportMessage('Invalid file format. Please select a valid backup file.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const handleClearData = () => {
    if (currentTab === 'assistant') {
      // For assistant tab, we don't clear anything since conversations are session-only
      alert('Assistant conversations are session-only and will be cleared when you refresh the page.');
      setShowClearConfirm(false);
      return;
    }
    
    // For now, we still clear all data since we don't have tab-specific clear functions
    // This could be enhanced in the future to only clear tab-specific data
    clearAllData();
    setShowClearConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 dark:bg-black dark:bg-opacity-70">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img 
                src={podoLogo} 
                alt="Podo Logo" 
                className="h-10 w-10 object-cover rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm"
              />
              <h3 className="text-subheading">Data Management - {getTabDisplayName()}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Import Status */}
          {importStatus !== 'idle' && (
            <div className={`p-4 rounded-lg mb-6 ${
              importStatus === 'success' 
                ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-700' 
                : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-700'
            }`}>
              <div className="flex items-center gap-2">
                {importStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
                <span className={`text-sm font-medium ${
                  importStatus === 'success' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                }`}>
                  {importMessage}
                </span>
              </div>
            </div>
          )}

          {/* Assistant Tab Notice */}
          {!isDataManagementAvailable && (
            <div className="p-4 rounded-lg mb-6 bg-brand-50 border border-brand-200 dark:bg-brand-900/20 dark:border-brand-700">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span className="text-sm font-medium text-brand-800 dark:text-brand-300">
                  Chat conversations are stored locally in your browser session and are not included in data backups.
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Export Data */}
            {isDataManagementAvailable && (
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-start gap-4">
                  <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 dark:bg-brand-900/30 dark:border-brand-700 dark:text-brand-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Export Data</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Download a backup of your {getTabDescription()}.
                    </p>
                    <button
                      onClick={handleExport}
                      className="button-primary text-sm"
                    >
                      Download Backup
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Import Data */}
            {isDataManagementAvailable && (
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-start gap-4">
                  <div className="icon-container bg-green-50 border-green-100 text-green-600 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Import Data</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Restore your {getTabDescription()} from a previously exported backup file.
                    </p>
                    <label className="button-secondary text-sm cursor-pointer inline-block">
                      Choose Backup File
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Clear All Data */}
            <div className="p-4 border border-red-200 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div className="flex items-start gap-4">
                <div className="icon-container bg-red-100 border-red-200 text-red-600 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-red-900 dark:text-red-300 mb-2">
                    {currentTab === 'assistant' ? 'Clear Chat History' : 'Clear All Data'}
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                    {currentTab === 'assistant' 
                      ? 'Chat conversations are stored in your browser session and will be cleared when you refresh the page.'
                      : `Permanently delete all your data including ${getTabDescription()}.`
                    }
                  </p>
                  {!showClearConfirm ? (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-600"
                      disabled={currentTab === 'assistant'}
                    >
                      {currentTab === 'assistant' ? 'No Action Needed' : 'Clear All Data'}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        Are you sure? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleClearData}
                          className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Yes, Delete All
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="button-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-gray-200">Note:</strong> {
                currentTab === 'assistant' 
                  ? 'Chat conversations are stored locally in your browser session and are automatically cleared when you refresh the page or close the browser.'
                  : `Your ${getTabDescription()} are stored locally in your browser. Regular backups are recommended to prevent data loss.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManager; 