import React, { useState } from 'react';
import { Clock, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { TimeSection } from '../types';

const TimeSectionsManager: React.FC = () => {
  const { 
    timeSections, 
    addTimeSection, 
    updateTimeSection, 
    deleteTimeSection, 
    getDefaultTimeSections 
  } = useAppContext();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    color: '#3B82F6'
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);
  
  const activeSections = timeSections.length > 0 ? timeSections : getDefaultTimeSections();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.startTime || !formData.endTime) {
      return;
    }

    const sectionData: TimeSection = {
      id: editingId || generateId(),
      name: formData.name.trim(),
      startTime: formData.startTime,
      endTime: formData.endTime,
      color: formData.color,
      order: activeSections.length + 1,
      createdAt: new Date()
    };

    if (editingId) {
      updateTimeSection(editingId, sectionData);
      setEditingId(null);
    } else {
      addTimeSection(sectionData);
    }

    setFormData({ name: '', startTime: '', endTime: '', color: '#3B82F6' });
    setShowAddForm(false);
  };

  const handleEdit = (section: TimeSection) => {
    setFormData({
      name: section.name,
      startTime: section.startTime,
      endTime: section.endTime,
      color: section.color || '#3B82F6'
    });
    setEditingId(section.id);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setFormData({ name: '', startTime: '', endTime: '', color: '#3B82F6' });
    setEditingId(null);
    setShowAddForm(false);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-4">
      <div className="section-header">
        <div>
          <h3 className="text-heading">Time Sections</h3>
          <p className="text-body mt-1">
            {timeSections.length === 0 
              ? "Using default time sections. Create custom sections to override."
              : "Manage your custom time sections for scheduling."
            }
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="button-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card p-4 border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900 dark:text-blue-300">
                {editingId ? 'Edit Time Section' : 'Add New Time Section'}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Section Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Morning, Lunch Break, Study Time"
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="input-field h-10"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="button-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Update' : 'Create'} Section
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="button-secondary flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-2">
        {activeSections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <div
              key={section.id}
              className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: section.color || '#3B82F6' }}
                />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {section.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTime(section.startTime)} - {formatTime(section.endTime)}
                    {section.startTime > section.endTime && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        Overnight
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Only show edit/delete for custom sections */}
              {timeSections.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(section)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit section"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTimeSection(section.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>

      {timeSections.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            You're using the default time sections (Morning, Afternoon, Evening, Night).
            <br />
            Create custom sections to better match your schedule.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeSectionsManager; 