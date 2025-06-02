import React, { useState } from 'react';
import { User, Mail, Calendar, LogOut, Edit, Save, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserProfile: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) return 'Email is required';
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      
      case 'name':
        if (!value) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters long';
        return '';
      
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear general messages
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldError = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    errors.name = validateField('name', formData.name);
    errors.email = validateField('email', formData.email);

    // Remove empty errors
    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      name: user?.name || '',
      email: user?.email || ''
    });
    setFieldErrors({});
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || ''
    });
    setFieldErrors({});
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // Check if anything actually changed
    if (formData.name === user?.name && formData.email === user?.email) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const updates: Partial<{ name: string; email: string }> = {};
      
      if (formData.name !== user?.name) {
        updates.name = formData.name;
      }
      
      if (formData.email !== user?.email) {
        updates.email = formData.email;
      }

      const result = await updateProfile(updates);

      if (result.success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getInputClassName = (fieldName: string) => {
    const baseClass = "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand focus:border-brand transition-colors";
    const hasError = fieldErrors[fieldName];
    
    if (hasError) {
      return `${baseClass} border-red-300 focus:ring-red-500 focus:border-red-500`;
    }
    
    return `${baseClass} border-gray-300`;
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Not Signed In</h3>
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading">User Profile</h2>
          <p className="text-body">Manage your account settings and preferences</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="button-secondary flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-brand-600" />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={getInputClassName('name')}
                    placeholder="Enter your full name"
                    disabled={isLoading}
                  />
                  {fieldErrors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-lg font-medium text-gray-900">{user.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={getInputClassName('email')}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                  {fieldErrors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-lg text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user.email}
                </p>
              )}
            </div>

            {/* Account Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <p className="text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {user.createdAt.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Login
                </label>
                <p className="text-gray-600">
                  {user.lastLoginAt.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="button-primary flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
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
            )}

            {/* Messages */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {success}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
        <div className="space-y-4">
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <p className="text-sm text-gray-500">
            You'll be signed out of your account and redirected to the login page.
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="card p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Security & Privacy</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p>• Your data is stored locally in your browser and encrypted</p>
          <p>• We never share your personal information with third parties</p>
          <p>• Your session expires automatically after 7 days for security</p>
          <p>• All passwords are hashed using industry-standard encryption</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 