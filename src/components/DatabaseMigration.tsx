import React, { useState } from 'react';
import { Database, Upload, Download, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { migrationApi } from '../services/api';

interface DatabaseMigrationProps {
  isOpen: boolean;
  onClose: () => void;
}

const DatabaseMigration: React.FC<DatabaseMigrationProps> = ({ isOpen, onClose }) => {
  const { syncToDatabase, syncFromDatabase, isOnline, objects, scheduledItems } = useAppContext();
  const { user, isOnline: authIsOnline } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSyncToDatabase = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await syncToDatabase();
      if (result.success) {
        setMessage({
          type: 'success',
          text: `Successfully synced ${objects.length} objects and ${scheduledItems.length} scheduled items to database.`
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to sync to database'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred during sync'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncFromDatabase = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await syncFromDatabase();
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Successfully loaded data from database.'
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to sync from database'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred during sync'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrateFromLocal = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await migrationApi.migrateFromLocalStorage();
      if (result.success && result.data) {
        setMessage({
          type: 'success',
          text: `Successfully migrated ${result.data.objectsCount} objects and ${result.data.weekObjectsCount} scheduled items from local storage to database.`
        });
        // Refresh data from database
        await syncFromDatabase();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to migrate from local storage'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred during migration'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToLocal = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await migrationApi.exportToLocalStorage();
      if (result.success && result.data) {
        setMessage({
          type: 'success',
          text: `Successfully exported ${result.data.objectsCount} objects and ${result.data.weekObjectsCount} scheduled items to local storage.`
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to export to local storage'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred during export'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canUseDatabase = user && authIsOnline && isOnline;
  const hasLocalData = objects.length > 0 || scheduledItems.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4 dark:bg-black dark:bg-opacity-70">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-heading">Database Migration</h3>
              <p className="text-body text-gray-600 dark:text-gray-400">Sync your data with PostgreSQL database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Connection Status</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {user ? (
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  User Authentication: {user ? 'Connected' : 'Not authenticated'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {authIsOnline ? (
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Auth Service: {authIsOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Database API: {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Data Summary */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Local Data Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{objects.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Objects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{scheduledItems.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Scheduled Items</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Database Operations</h4>
            
            {/* Sync to Database */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Upload to Database</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Sync your current local data to the PostgreSQL database. This will overwrite any existing data in the database.
                  </p>
                </div>
                <Upload className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-1 ml-3" />
              </div>
              <button
                onClick={handleSyncToDatabase}
                disabled={!canUseDatabase || !hasLocalData || isLoading}
                className="button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    Uploading...
                  </div>
                ) : (
                  'Upload to Database'
                )}
              </button>
            </div>

            {/* Sync from Database */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Download from Database</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Load data from the PostgreSQL database. This will replace your current local data.
                  </p>
                </div>
                <Download className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-1 ml-3" />
              </div>
              <button
                onClick={handleSyncFromDatabase}
                disabled={!canUseDatabase || isLoading}
                className="button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    Downloading...
                  </div>
                ) : (
                  'Download from Database'
                )}
              </button>
            </div>

            {/* Migration Actions */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">One-time Migration</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Migrate existing localStorage data to database (for first-time setup).
                  </p>
                </div>
                <Database className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-1 ml-3" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleMigrateFromLocal}
                  disabled={!canUseDatabase || !hasLocalData || isLoading}
                  className="button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Migrate to Database
                </button>
                <button
                  onClick={handleExportToLocal}
                  disabled={!canUseDatabase || isLoading}
                  className="button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export to Local
                </button>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`rounded-xl p-4 ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700' :
              message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700' :
              'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700'
            }`}>
              <div className="flex items-start gap-2">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : message.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          )}

          {/* Help */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
            <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">How it works</h5>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• Your data is automatically synced when you make changes (if online)</li>
              <li>• Use "Upload to Database" to manually sync local changes</li>
              <li>• Use "Download from Database" to get the latest data</li>
              <li>• Migration tools are for one-time setup or backup purposes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseMigration; 