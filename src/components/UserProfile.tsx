import React, { useState } from 'react';
import { User, Settings, LogOut, Save, X, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';

const UserProfile: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">No user data available</p>
      </div>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      name: user.name,
      email: user.email
    });
    setMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: user.name,
      email: user.email
    });
    setMessage(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Simple validation
      if (!editForm.name.trim()) {
        setMessage({ type: 'error', text: 'Name is required' });
        setIsLoading(false);
        return;
      }

      if (!editForm.email.trim()) {
        setMessage({ type: 'error', text: 'Email is required' });
        setIsLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email)) {
        setMessage({ type: 'error', text: 'Please enter a valid email address' });
        setIsLoading(false);
        return;
      }

      // Update user data
      updateUser({
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase()
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-brand-600" />
        </div>
        <div>
          <h1 className="text-heading">User Profile</h1>
          <p className="text-body">Manage your account settings</p>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="card p-6 mb-6">
        <h2 className="text-subheading mb-4">Appearance</h2>
        <div className="flex items-center justify-between p-4 bg-gray-50-dark rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-brand-600" />
              ) : (
                <Sun className="w-5 h-5 text-brand-600" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900-dark">Dark Mode</h3>
              <p className="text-sm text-gray-600-dark">
                {isDarkMode ? 'Dark theme is enabled' : 'Light theme is enabled'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
              isDarkMode ? 'bg-brand' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDarkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Profile Information */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-subheading">Profile Information</h2>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="form-label">
                Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="form-label">
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="input-field"
                placeholder="Enter your email"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="button-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="button-secondary flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
              <p className="text-gray-900-dark font-medium">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
              <p className="text-gray-900-dark">{user.email}</p>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`mt-4 p-4 rounded-xl ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' 
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
          }`}>
            <p className="text-sm">{message.text}</p>
          </div>
        )}
      </div>

      {/* Account Information */}
      <div className="card p-6 mb-6">
        <h2 className="text-subheading mb-4">Account Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600-dark">User ID</span>
            <span className="text-gray-900-dark font-mono text-sm">{user.id}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600-dark">Member Since</span>
            <span className="text-gray-900-dark">{user.createdAt.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600-dark">Last Login</span>
            <span className="text-gray-900-dark">{user.lastLoginAt.toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="card p-6">
        <h2 className="text-subheading mb-4">Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50-dark rounded-xl">
            <div>
              <h3 className="font-medium text-gray-900-dark">Password</h3>
              <p className="text-sm text-gray-600-dark">Last updated when you registered</p>
            </div>
            <button className="px-4 py-2 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-100 rounded-lg transition-colors">
              Change
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100-dark">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors w-full justify-center"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 