import React, { useState } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, X, Check, Trash2, ChefHat, Dumbbell, CheckSquare, User, Clock, Database, Settings } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import type { ScheduledItem, TimeCategory, ObjectType, IndividualTodo, TimeSection } from '../types';
import TimeSectionsManager from './TimeSectionsManager';

interface MyWeekProps {
  onOpenDataManager: () => void;
}

const MyWeek: React.FC<MyWeekProps> = ({ onOpenDataManager }) => {
  const { 
    objects, 
    addScheduledItem, 
    deleteScheduledItem, 
    toggleItemCompletion,
    currentWeekStart, 
    setCurrentWeekStart,
    getWeekData,
    timeSections,
    getDefaultTimeSections,
    getTimeSectionForTime,
    scheduledItems
  } = useAppContext();
  const { showToast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTimeSectionsManager, setShowTimeSectionsManager] = useState(false);
  const [addType, setAddType] = useState<'recipe' | 'workout' | 'todoList' | 'individualTodo'>('recipe');
  const [selectedObject, setSelectedObject] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [individualTodoText, setIndividualTodoText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedScheduledItem, setSelectedScheduledItem] = useState<ScheduledItem | null>(null);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDaysFull = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newWeekStart);
  };

  const goToToday = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const weekData = getWeekData(currentWeekStart);

  // Get active time sections (custom or default)
  const activeTimeSections = timeSections.length > 0 ? timeSections : getDefaultTimeSections();

  // Debug logging for section overlays
  if (timeSections.length > 0) {
    console.log('Rendering section overlays:', timeSections.length, 'sections:', activeTimeSections);
  }

  // Group items by time sections
  const groupItemsByTimeSection = (items: ScheduledItem[]) => {
    const grouped: { [sectionId: string]: ScheduledItem[] } = {};
    
    // Initialize groups for all sections
    activeTimeSections.forEach(section => {
      grouped[section.id] = [];
    });
    
    // Group items by their time section
    items.forEach(item => {
      if (item.time) {
        // New time-based system
        const section = getTimeSectionForTime(item.time);
        if (section) {
          grouped[section.id] = grouped[section.id] || [];
          grouped[section.id].push(item);
        }
      } else if (item.timeCategory) {
        // Legacy timeCategory system - map to default sections
        const legacyMapping: { [key in TimeCategory]: string } = {
          'Morning': '1',
          'Afternoon': '2', 
          'Evening': '3',
          'Night': '4'
        };
        const sectionId = legacyMapping[item.timeCategory];
        if (grouped[sectionId]) {
          grouped[sectionId].push(item);
        }
      }
    });
    
    return grouped;
  };

  const handleAddItem = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsLoading(true);
    setError('');

    try {
      if (addType === 'individualTodo') {
        if (!individualTodoText.trim()) return;

        const newTodo: IndividualTodo = {
          id: generateId(),
          type: 'individualTodo',
          text: individualTodoText,
          completed: false,
          createdAt: new Date()
        };

        const scheduledItem: ScheduledItem = {
          id: generateId(),
          objectId: newTodo.id,
          objectType: 'individualTodo',
          date: selectedDate,
          time: selectedTime,
          order: 0,
          data: newTodo
        };

        await addScheduledItem(scheduledItem);
        setIndividualTodoText('');
      } else {
        if (!selectedObject) return;

        const objectData = objects.find(obj => obj.id === selectedObject);
        if (!objectData) return;

        const scheduledItem: ScheduledItem = {
          id: generateId(),
          objectId: selectedObject,
          objectType: objectData.type,
          date: selectedDate,
          time: selectedTime,
          order: 0,
          data: objectData
        };

        await addScheduledItem(scheduledItem);
      }

      setShowAddModal(false);
      setSelectedObject('');
      setIndividualTodoText('');
      showToast('Item added to schedule successfully', 'success');
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Failed to add item. Please try again.');
      showToast('Failed to add item. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'recipe':
        return <ChefHat className="w-4 h-4" />;
      case 'workout':
        return <Dumbbell className="w-4 h-4" />;
      case 'todoList':
        return <CheckSquare className="w-4 h-4" />;
      case 'individualTodo':
        return <User className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case 'recipe':
        return 'bg-emerald-100 border-emerald-200 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/40';
      case 'workout':
        return 'bg-brand-50 border-brand-100 text-brand-800 hover:bg-brand-100 dark:bg-brand-900/30 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/40';
      case 'todoList':
        return 'bg-purple-100 border-purple-200 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/40';
      case 'individualTodo':
        return 'bg-amber-100 border-amber-200 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600';
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Generate hourly bars for the time sidebar
  const generateHourlyBars = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0') + ':00';
      const displayHour = i === 0 ? 12 : i > 12 ? i - 12 : i;
      const ampm = i >= 12 ? 'PM' : 'AM';
      hours.push({
        time: hour,
        display: `${displayHour} ${ampm}`,
        position: (i / 24) * 100
      });
    }
    return hours;
  };

  const hourlyBars = generateHourlyBars();

  // Check if a time falls within a user-defined section
  const isTimeInSection = (hour: string, section: TimeSection) => {
    const hourNum = parseInt(hour.split(':')[0]);
    const startHour = parseInt(section.startTime.split(':')[0]);
    const endHour = parseInt(section.endTime.split(':')[0]);
    
    if (startHour <= endHour) {
      return hourNum >= startHour && hourNum < endHour;
    } else {
      // Overnight section
      return hourNum >= startHour || hourNum < endHour;
    }
  };

  const filteredObjects = objects.filter(obj => obj.type === addType);

  // Calculate dynamic height based on available space
  const calculateHourHeight = () => {
    if (typeof window !== 'undefined') {
      return Math.max(60, (window.innerHeight - 400) / 24);
    }
    return 60; // Default height for SSR
  };

  const getCurrentWeekRange = () => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);
    
    const startMonth = currentWeekStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = currentWeekStart.getDate();
    const endDay = endDate.getDate();
    const year = currentWeekStart.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  };

  return (
    <div className="space-y-3">
      {/* Compact Header Section */}
      <div className="space-compact">
        <div className="section-header-compact">
          <div>
            <h2 className="text-heading">My Week</h2>
            <p className="text-caption mt-0.5">Plan and organize your weekly schedule</p>
          </div>
          <div className="mobile-flex gap-2">
            <button 
              onClick={goToToday}
              className="button-secondary text-xs px-2.5 py-1.5"
            >
              Today
            </button>
            <button 
              onClick={() => setShowTimeSectionsManager(true)}
              className="button-secondary flex items-center gap-1.5 text-xs px-2.5 py-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sections</span>
            </button>
            <button 
              onClick={onOpenDataManager}
              className="button-secondary flex items-center gap-1.5 text-xs px-2.5 py-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Data</span>
            </button>
            <button 
              onClick={() => {
                setSelectedDate(formatDate(new Date()));
                setShowAddModal(true);
              }}
              className="button-primary flex items-center gap-1.5 text-xs px-2.5 py-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Compact Week Navigation */}
        <div className="card p-2">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigateWeek('prev')}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ minHeight: '32px', minWidth: '32px' }}
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="text-center">
              <h3 className="text-xs font-semibold text-gray-900">
                {getCurrentWeekRange()}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Week {Math.ceil((currentWeekStart.getTime() - new Date(currentWeekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}
              </p>
            </div>
            
            <button 
              onClick={() => navigateWeek('next')}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ minHeight: '32px', minWidth: '32px' }}
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Week View - Grid Layout with Hourly Bars */}
      <div className="week-grid">
        {/* Week Header */}
        <div className="week-header grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
          {/* Time column header */}
          <div className="time-column-header">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Time
            </div>
          </div>
          
          {/* Day headers */}
          {getWeekDates().map((date, index) => {
            const dateStr = formatDate(date);
            const todayClass = isToday(date);
            
            return (
              <div
                key={dateStr}
                className={`day-header ${
                  todayClass ? 'bg-brand-50 dark:bg-brand-900/20' : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <div className={`text-xs font-medium uppercase tracking-wide ${
                  todayClass ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {weekDays[index]}
                </div>
                <div className={`text-sm font-bold mt-0.5 ${
                  todayClass ? 'text-brand-900 dark:text-brand-300' : 'text-gray-900 dark:text-white'
                }`}>
                  {date.getDate()}
                </div>
                {todayClass && (
                  <div className="text-xs text-brand-600 dark:text-brand-400 font-medium">Today</div>
                )}
                
                {/* Add button for each day */}
                <button
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setShowAddModal(true);
                  }}
                  className={`mt-1 p-0.5 rounded transition-colors ${
                    todayClass 
                      ? 'hover:bg-brand-200 text-brand-600' 
                      : 'hover:bg-gray-200 text-gray-400'
                  }`}
                  title={`Add item to ${weekDaysFull[index]}`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Time Grid with Hourly Bars */}
        <div className="relative flex-1">
          {/* Generate a full 24-hour grid as the base */}
          <div className="grid grid-cols-8">
            {/* Time column with all 24 hours */}
            <div className="relative border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {/* User-defined section overlays */}
              {timeSections.length > 0 && timeSections.map(section => {
                const startHour = parseInt(section.startTime.split(':')[0]);
                const endHour = parseInt(section.endTime.split(':')[0]);
                const startMinute = parseInt(section.startTime.split(':')[1]);
                const endMinute = parseInt(section.endTime.split(':')[1]);
                
                // Calculate position and height
                const startPosition = (startHour + startMinute / 60) * calculateHourHeight();
                const endPosition = (endHour + endMinute / 60) * calculateHourHeight();
                const height = endPosition - startPosition;
                
                return (
                  <div
                    key={section.id}
                    className="absolute left-0 right-0 pointer-events-none flex items-start justify-end pr-2 pt-1"
                    style={{
                      top: `${startPosition}px`,
                      height: `${height}px`,
                      backgroundColor: `${section.color}14`, // 8% opacity
                      borderLeft: `3px solid ${section.color}`,
                    }}
                  >
                    <span className="text-xs font-medium relative z-20" style={{ color: section.color }}>
                      {section.name}
                    </span>
                  </div>
                );
              })}

              {/* Original 24-hour grid */}
              {hourlyBars.map((hour, index) => {
                const isInUserSection = timeSections.some(section => 
                  isTimeInSection(hour.time, section)
                );
                
                return (
                  <div
                    key={hour.time}
                    className={`flex items-start justify-start pl-2 pt-1 border-b border-gray-100 dark:border-gray-700 relative ${
                      isInUserSection && timeSections.length === 0 ? 'time-section-highlight' : ''
                    }`}
                    style={{ 
                      minHeight: `${calculateHourHeight()}px`
                    }}
                  >
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono relative z-10">
                      {hour.display}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Day columns with hourly divisions */}
            {getWeekDates().map((date, dayIndex) => {
              const dateStr = formatDate(date);
              const dayItems = weekData[dateStr] || [];
              const groupedItems = groupItemsByTimeSection(dayItems);
              const todayClass = isToday(date);
              
              return (
                <div key={dateStr} className="border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                  {hourlyBars.map((hour, hourIndex) => {
                    // Find which user-defined section this hour belongs to
                    const belongsToSection = activeTimeSections.find(section => 
                      isTimeInSection(hour.time, section)
                    );
                    
                    // Get ALL items for this specific hour, regardless of sections
                    const hourItems = dayItems.filter(item => {
                      if (!item.time) {
                        // For items without time, show them in the first hour of their section (if any)
                        if (item.timeCategory && hourIndex === 0) {
                          return true;
                        }
                        return false;
                      }
                      const itemHour = parseInt(item.time.split(':')[0]);
                      const currentHour = parseInt(hour.time.split(':')[0]);
                      return itemHour === currentHour;
                    });
                    
                    return (
                      <div
                        key={`${dateStr}-${hour.time}`}
                        className={`border-b border-gray-100 dark:border-gray-700 p-1 ${
                          todayClass ? 'bg-brand-25 dark:bg-brand-950' : 'bg-white dark:bg-gray-900'
                        } hover:bg-gray-25 dark:hover:bg-gray-850 transition-colors`}
                        style={{ 
                          minHeight: `${calculateHourHeight()}px`,
                          backgroundColor: todayClass && belongsToSection
                            ? `${belongsToSection.color || '#3B82F6'}05` 
                            : undefined 
                        }}
                      >
                        <div className="space-y-1">
                          {hourItems.map((scheduledItem) => (
                            <div
                              key={scheduledItem.id}
                              className={`group relative p-1.5 rounded border text-xs transition-all duration-200 cursor-pointer hover:shadow-sm ${getItemColor(scheduledItem.objectType)}`}
                              onClick={() => setSelectedScheduledItem(scheduledItem)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-1 flex-1 min-w-0">
                                  <div className="mt-0.5 flex-shrink-0">
                                    {getItemIcon(scheduledItem.objectType)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <h4 className="font-medium text-xs truncate">
                                        {scheduledItem.data.type === 'individualTodo' 
                                          ? (scheduledItem.data as IndividualTodo).text
                                          : (scheduledItem.data as ObjectType).title
                                        }
                                      </h4>
                                      {scheduledItem.time && (
                                        <span className="text-xs opacity-60 font-mono flex-shrink-0">
                                          {formatTime(scheduledItem.time)}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Compact Item Details */}
                                    {scheduledItem.data.type === 'recipe' && (
                                      <p className="text-xs opacity-75">
                                        {(scheduledItem.data as any).ingredients.length} ingredients
                                      </p>
                                    )}
                                    
                                    {scheduledItem.data.type === 'workout' && (
                                      <div className="space-y-0.5">
                                        {(scheduledItem.data as any).exercises.slice(0, 2).map((exercise: any) => (
                                          <div key={exercise.id} className="flex items-center gap-1">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleItemCompletion(scheduledItem.id, exercise.id);
                                              }}
                                              className={`w-2 h-2 rounded border flex items-center justify-center transition-colors ${
                                                exercise.completed 
                                                  ? 'bg-green-500 border-green-500 text-white' 
                                                  : 'border-gray-300 hover:border-green-500'
                                              }`}
                                            >
                                              {exercise.completed && <Check className="w-1 h-1" />}
                                            </button>
                                            <span className={`text-xs truncate ${exercise.completed ? 'line-through opacity-60' : ''}`}>
                                              {exercise.name}
                                            </span>
                                          </div>
                                        ))}
                                        {(scheduledItem.data as any).exercises.length > 2 && (
                                          <div className="text-xs text-gray-500">
                                            +{(scheduledItem.data as any).exercises.length - 2} more
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {scheduledItem.data.type === 'todoList' && (
                                      <div className="space-y-0.5">
                                        {(scheduledItem.data as any).items.slice(0, 2).map((item: any) => (
                                          <div key={item.id} className="flex items-center gap-1">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleItemCompletion(scheduledItem.id, item.id);
                                              }}
                                              className={`w-2 h-2 rounded border flex items-center justify-center transition-colors ${
                                                item.completed 
                                                  ? 'bg-purple-500 border-purple-500 text-white' 
                                                  : 'border-gray-300 hover:border-purple-500'
                                              }`}
                                            >
                                              {item.completed && <Check className="w-1 h-1" />}
                                            </button>
                                            <span className={`text-xs truncate ${item.completed ? 'line-through opacity-60' : ''}`}>
                                              {item.text}
                                            </span>
                                          </div>
                                        ))}
                                        {(scheduledItem.data as any).items.length > 2 && (
                                          <div className="text-xs text-gray-500">
                                            +{(scheduledItem.data as any).items.length - 2} more
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {scheduledItem.data.type === 'individualTodo' && (
                                      <div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleItemCompletion(scheduledItem.id);
                                          }}
                                          className={`flex items-center gap-1 transition-opacity ${
                                            (scheduledItem.data as IndividualTodo).completed ? 'opacity-60' : ''
                                          }`}
                                        >
                                          <div className={`w-2 h-2 rounded border flex items-center justify-center transition-colors ${
                                            (scheduledItem.data as IndividualTodo).completed 
                                              ? 'bg-green-500 border-green-500 text-white' 
                                              : 'border-gray-300 hover:border-green-500'
                                          }`}>
                                            {(scheduledItem.data as IndividualTodo).completed && <Check className="w-1 h-1" />}
                                          </div>
                                          <span className={`text-xs ${
                                            (scheduledItem.data as IndividualTodo).completed ? 'line-through' : ''
                                          }`}>
                                            {(scheduledItem.data as IndividualTodo).completed ? 'Done' : 'Mark done'}
                                          </span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteScheduledItem(scheduledItem.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-600 transition-all ml-1 flex-shrink-0"
                                  aria-label="Delete item"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedScheduledItem && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="modal-header">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                    selectedScheduledItem.data.type === 'recipe' 
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                      : selectedScheduledItem.data.type === 'workout'
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                      : selectedScheduledItem.data.type === 'todoList'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                      : 'bg-gradient-to-br from-amber-500 to-orange-600'
                  }`}>
                    <div className="text-white">
                      {getItemIcon(selectedScheduledItem.objectType)}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedScheduledItem.data.type === 'individualTodo' 
                        ? (selectedScheduledItem.data as IndividualTodo).text
                        : (selectedScheduledItem.data as ObjectType).title
                      }
                    </h2>
                    <p className="text-caption mt-1">
                      {selectedScheduledItem.time && `Scheduled for ${formatTime(selectedScheduledItem.time)}`}
                      {selectedScheduledItem.timeCategory && !selectedScheduledItem.time && `Scheduled for ${selectedScheduledItem.timeCategory}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedScheduledItem(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(92vh-120px)]">
              <div className="modal-body">
                {(() => {
                  // Get the current state of the selected item from scheduledItems
                  const currentItem = scheduledItems.find(item => item.id === selectedScheduledItem.id);
                  if (!currentItem) return <div>Item not found</div>;

                  // Recipe Details
                  if (currentItem.data.type === 'recipe') {
                    return (
                      <div className="space-y-6">
                        {/* Ingredients Section */}
                        {(currentItem.data as any).ingredients && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                              Ingredients ({(currentItem.data as any).ingredients.length})
                            </h3>
                            <div className="space-y-2">
                              {(currentItem.data as any).ingredients.map((ingredient: any, index: number) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {typeof ingredient === 'string' ? ingredient : ingredient.name || ingredient.text || 'Unknown ingredient'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Instructions Section */}
                        {(currentItem.data as any).instructions && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                              Instructions ({(currentItem.data as any).instructions.length})
                            </h3>
                            <div className="space-y-3">
                              {(currentItem.data as any).instructions.map((instruction: any, index: number) => {
                                const instructionId = instruction.id || `instruction-${index}`;
                                const instructionText = instruction.text || instruction.step || instruction;
                                const isCompleted = instruction.completed || false;
                                
                                return (
                                  <div key={instructionId} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <button
                                      onClick={() => toggleItemCompletion(currentItem.id, instructionId)}
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 flex-shrink-0 ${
                                        isCompleted 
                                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                                          : 'border-gray-300 hover:border-emerald-500'
                                      }`}
                                    >
                                      {isCompleted && <Check className="w-3 h-3" />}
                                    </button>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                          Step {index + 1}
                                        </span>
                                      </div>
                                      <p className={`text-sm text-gray-700 dark:text-gray-300 ${
                                        isCompleted ? 'line-through opacity-60' : ''
                                      }`}>
                                        {typeof instructionText === 'string' ? instructionText : 'No instruction text'}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Debug info if no ingredients or instructions */}
                        {!(currentItem.data as any).ingredients && !(currentItem.data as any).instructions && (
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              This recipe doesn't have ingredients or instructions data. 
                            </p>
                            <details className="mt-2">
                              <summary className="text-xs text-yellow-600 dark:text-yellow-400 cursor-pointer">
                                Debug: Show raw data
                              </summary>
                              <pre className="text-xs mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded overflow-auto">
                                {JSON.stringify(currentItem.data, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Workout Details
                  if (currentItem.data.type === 'workout') {
                    return (
                      <div className="space-y-6">
                        {(currentItem.data as any).exercises && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                              Exercises ({(currentItem.data as any).exercises.length})
                            </h3>
                            <div className="space-y-3">
                              {(currentItem.data as any).exercises.map((exercise: any) => (
                                <div key={exercise.id} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <button
                                    onClick={() => toggleItemCompletion(currentItem.id, exercise.id)}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 flex-shrink-0 ${
                                      exercise.completed 
                                        ? 'bg-blue-500 border-blue-500 text-white' 
                                        : 'border-gray-300 hover:border-blue-500'
                                    }`}
                                  >
                                    {exercise.completed && <Check className="w-3 h-3" />}
                                  </button>
                                  <div className="flex-1">
                                    <h4 className={`font-medium text-gray-900 dark:text-white mb-1 ${
                                      exercise.completed ? 'line-through opacity-60' : ''
                                    }`}>
                                      {exercise.name || 'Unnamed exercise'}
                                    </h4>
                                    {exercise.sets && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {exercise.sets} sets
                                        {exercise.reps && ` × ${exercise.reps} reps`}
                                        {exercise.weight && ` @ ${exercise.weight}`}
                                      </p>
                                    )}
                                    {exercise.duration && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Duration: {exercise.duration}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Debug info if no exercises */}
                        {!(currentItem.data as any).exercises && (
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              This workout doesn't have exercises data.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Todo List Details
                  if (currentItem.data.type === 'todoList') {
                    return (
                      <div className="space-y-6">
                        {(currentItem.data as any).items && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                              Tasks ({(currentItem.data as any).items.length})
                            </h3>
                            <div className="space-y-3">
                              {(currentItem.data as any).items.map((item: any) => (
                                <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <button
                                    onClick={() => toggleItemCompletion(currentItem.id, item.id)}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 flex-shrink-0 ${
                                      item.completed 
                                        ? 'bg-purple-500 border-purple-500 text-white' 
                                        : 'border-gray-300 hover:border-purple-500'
                                    }`}
                                  >
                                    {item.completed && <Check className="w-3 h-3" />}
                                  </button>
                                  <div className="flex-1">
                                    <p className={`text-sm text-gray-700 dark:text-gray-300 ${
                                      item.completed ? 'line-through opacity-60' : ''
                                    }`}>
                                      {item.text || 'Unnamed task'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Debug info if no items */}
                        {!(currentItem.data as any).items && (
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              This todo list doesn't have items data.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Individual Todo Details
                  if (currentItem.data.type === 'individualTodo') {
                    return (
                      <div className="space-y-6">
                        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <button
                            onClick={() => toggleItemCompletion(currentItem.id)}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors mt-0.5 flex-shrink-0 ${
                              (currentItem.data as IndividualTodo).completed 
                                ? 'bg-amber-500 border-amber-500 text-white' 
                                : 'border-gray-300 hover:border-amber-500'
                            }`}
                          >
                            {(currentItem.data as IndividualTodo).completed && <Check className="w-4 h-4" />}
                          </button>
                          <div className="flex-1">
                            <p className={`text-base text-gray-700 dark:text-gray-300 ${
                              (currentItem.data as IndividualTodo).completed ? 'line-through opacity-60' : ''
                            }`}>
                              {(currentItem.data as IndividualTodo).text}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {(currentItem.data as IndividualTodo).completed ? 'Completed' : 'Click to mark as done'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return <div>Unknown item type</div>;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Sections Manager Modal */}
      {showTimeSectionsManager && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="modal-header">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Time Sections Manager
                    </h2>
                    <p className="text-caption mt-1">
                      Customize your daily time sections
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTimeSectionsManager(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(92vh-120px)]">
              <div className="modal-body">
                <TimeSectionsManager />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Add Item Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            {/* Modal Header */}
            <div className="modal-header">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Add New Item
                    </h2>
                    <p className="text-caption mt-1">
                      Schedule something for your week
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(92vh-120px)]">
              <div className="modal-body">
                {/* Date Selection */}
                <div className="form-group">
                  <div className="flex items-center gap-2">
                    <label className="form-label">Select Date</label>
                    <span className="text-red-500 text-xs">*</span>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="input-field appearance-none cursor-pointer"
                    >
                      <option value="">Choose a date</option>
                      {getWeekDates().map((date) => {
                        const dateStr = formatDate(date);
                        const isDateToday = isToday(date);
                        return (
                          <option key={dateStr} value={dateStr}>
                            {date.toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                            {isDateToday ? ' (Today)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Time Selection */}
                <div className="form-group">
                  <div className="flex items-center gap-2">
                    <label className="form-label">Time</label>
                    <span className="text-red-500 text-xs">*</span>
                  </div>
                  <div className="relative">
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="input-field"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  {selectedTime && (
                    <p className="text-xs text-gray-500 mt-1">
                      Will be placed in: {getTimeSectionForTime(selectedTime)?.name || 'No matching section'}
                    </p>
                  )}
                </div>

                {/* Item Type Selection */}
                <div className="form-group">
                  <div className="flex items-center gap-2">
                    <label className="form-label">What would you like to add?</label>
                    <span className="text-red-500 text-xs">*</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: 'recipe', label: 'Recipe', icon: ChefHat, color: 'emerald', bgColor: 'bg-emerald-500' },
                      { type: 'workout', label: 'Workout', icon: Dumbbell, color: 'blue', bgColor: 'bg-blue-500' },
                      { type: 'todoList', label: 'Todo List', icon: CheckSquare, color: 'purple', bgColor: 'bg-purple-500' },
                      { type: 'individualTodo', label: 'Quick Todo', icon: User, color: 'amber', bgColor: 'bg-amber-500' }
                    ].map(({ type, label, icon: Icon, color, bgColor }) => (
                      <button
                        key={type}
                        onClick={() => setAddType(type as any)}
                        className={`group relative p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                          addType === type
                            ? `border-${color}-500 bg-${color}-50 text-${color}-700 shadow-sm scale-105 dark:border-${color}-400 dark:bg-${color}-900/30 dark:text-${color}-300`
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 hover:scale-102 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                        style={{ minHeight: '44px' }}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            addType === type
                              ? bgColor + ' text-white'
                              : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs">{label}</span>
                        </div>
                        {addType === type && (
                          <div className={`absolute -top-1 -right-1 w-5 h-5 ${bgColor} rounded-full flex items-center justify-center`}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Object Selection or Individual Todo Input */}
                {addType === 'individualTodo' ? (
                  <div className="form-group">
                    <div className="flex items-center gap-2">
                      <label className="form-label">What needs to be done?</label>
                      <span className="text-red-500 text-xs">*</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={individualTodoText}
                        onChange={(e) => setIndividualTodoText(e.target.value)}
                        placeholder="Enter your task..."
                        className="input-field pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <div className="flex items-center gap-2">
                      <label className="form-label">Select {addType}</label>
                      <span className="text-red-500 text-xs">*</span>
                    </div>
                    {filteredObjects.length > 0 ? (
                      <div className="relative">
                        <select
                          value={selectedObject}
                          onChange={(e) => setSelectedObject(e.target.value)}
                          className="input-field appearance-none cursor-pointer"
                        >
                          <option value="">Choose a {addType}</option>
                          {filteredObjects.map((obj) => (
                            <option key={obj.id} value={obj.id}>
                              {obj.title}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          {addType === 'recipe' && <ChefHat className="w-4 h-4 text-gray-400" />}
                          {addType === 'workout' && <Dumbbell className="w-4 h-4 text-gray-400" />}
                          {addType === 'todoList' && <CheckSquare className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 dark:bg-amber-900/20 dark:border-amber-700">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                              No {addType}s available
                            </h4>
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                              Create one in "Library" first, then schedule it here.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 button-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  className="flex-1 button-primary"
                  disabled={
                    !selectedDate || 
                    !selectedTime ||
                    (addType === 'individualTodo' ? !individualTodoText.trim() : !selectedObject)
                  }
                >
                  Add to Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyWeek;