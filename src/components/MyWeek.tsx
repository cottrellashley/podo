import React, { useState } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, X, Check, Trash2, ChefHat, Dumbbell, CheckSquare, User, Clock, MoreHorizontal, Database } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import type { ScheduledItem, TimeCategory, ObjectType, IndividualTodo } from '../types';

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
    getWeekData 
  } = useAppContext();
  const { showToast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'recipe' | 'workout' | 'todoList' | 'individualTodo'>('recipe');
  const [selectedObject, setSelectedObject] = useState<string>('');
  const [selectedTimeCategory, setSelectedTimeCategory] = useState<TimeCategory>('Morning');
  const [individualTodoText, setIndividualTodoText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDaysFull = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeCategories: TimeCategory[] = ['Morning', 'Afternoon', 'Evening', 'Night'];

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

  const handleAddItem = async () => {
    if (!selectedDate) return;

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
          timeCategory: selectedTimeCategory,
          order: (weekData[selectedDate]?.filter(item => item.timeCategory === selectedTimeCategory).length || 0) + 1,
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
          timeCategory: selectedTimeCategory,
          order: (weekData[selectedDate]?.filter(item => item.timeCategory === selectedTimeCategory).length || 0) + 1,
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

  const getTimeCategoryColor = (category: TimeCategory) => {
    switch (category) {
      case 'Morning':
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 text-yellow-800 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-700 dark:text-yellow-300';
      case 'Afternoon':
        return 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 text-orange-800 dark:from-orange-900/20 dark:to-red-900/20 dark:border-orange-700 dark:text-orange-300';
      case 'Evening':
        return 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-800 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-700 dark:text-purple-300';
      case 'Night':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300';
    }
  };

  const filteredObjects = objects.filter(obj => obj.type === addType);

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
    <div className="space-y-4">
      {/* Enhanced Header Section */}
      <div className="space-compact">
        <div className="section-header">
          <div>
            <h2 className="text-heading">My Week</h2>
            <p className="text-body mt-1">Plan and organize your weekly schedule</p>
          </div>
          <div className="mobile-flex">
            <button 
              onClick={goToToday}
              className="button-secondary text-sm px-3 py-2"
            >
              Today
            </button>
            <button 
              onClick={onOpenDataManager}
              className="button-secondary flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Data Manager</span>
            </button>
            <button 
              onClick={() => {
                setSelectedDate(formatDate(new Date()));
                setShowAddModal(true);
              }}
              className="button-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Enhanced Week Navigation */}
        <div className="card p-2.5">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigateWeek('prev')}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ minHeight: '36px', minWidth: '36px' }}
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="text-center">
              <h3 className="text-sm font-semibold text-gray-900">
                {getCurrentWeekRange()}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Week {Math.ceil((currentWeekStart.getTime() - new Date(currentWeekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}
              </p>
            </div>
            
            <button 
              onClick={() => navigateWeek('next')}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ minHeight: '36px', minWidth: '36px' }}
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Week View */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-2">
        {getWeekDates().map((date, index) => {
          const dateStr = formatDate(date);
          const dayItems = weekData[dateStr] || [];
          const todayClass = isToday(date);
          
          return (
            <div
              key={dateStr}
              className={`week-day-card ${
                todayClass 
                  ? 'ring-2 ring-brand bg-brand-50 border-brand-200' 
                  : 'hover:shadow-md border-gray-200'
              }`}
            >
              {/* Enhanced Day Header */}
              <div className={`week-day-header ${todayClass ? 'border-brand-200' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <div className={`text-xs font-medium uppercase tracking-wide ${
                      todayClass ? 'text-brand-600' : 'text-gray-500'
                    }`}>
                      {weekDays[index]}
                    </div>
                    <div className={`text-lg font-bold mt-0.5 ${
                      todayClass ? 'text-brand-900' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                    {todayClass && (
                      <div className="text-xs text-brand-600 font-medium">Today</div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setShowAddModal(true);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      todayClass 
                        ? 'hover:bg-brand-200 text-brand-600' 
                        : 'hover:bg-gray-100 text-gray-400'
                    }`}
                    style={{ minHeight: '36px', minWidth: '36px' }}
                    aria-label={`Add item to ${weekDaysFull[index]}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Enhanced Time Categories */}
              <div className="week-day-content">
                {timeCategories.map((category) => {
                  const categoryItems = dayItems.filter(item => item.timeCategory === category);
                  
                  return (
                    <div key={category} className="space-compact-sm">
                      <div className={`time-category-badge ${getTimeCategoryColor(category)}`}>
                        <Clock className="w-3 h-3" />
                        {category}
                      </div>
                      
                      <div className="space-compact-xs pl-1">
                        {categoryItems.map((scheduledItem) => (
                          <div
                            key={scheduledItem.id}
                            className={`scheduled-item ${getItemColor(scheduledItem.objectType)}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <div className="mt-0.5">
                                  {getItemIcon(scheduledItem.objectType)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-sm truncate">
                                    {scheduledItem.data.type === 'individualTodo' 
                                      ? (scheduledItem.data as IndividualTodo).text
                                      : (scheduledItem.data as ObjectType).title
                                    }
                                  </h4>
                                  
                                  {/* Enhanced Item Details */}
                                  {scheduledItem.data.type === 'recipe' && (
                                    <p className="text-xs mt-1 opacity-75">
                                      {(scheduledItem.data as any).ingredients.length} ingredients
                                    </p>
                                  )}
                                  
                                  {scheduledItem.data.type === 'workout' && (
                                    <div className="mt-1 space-compact-xs">
                                      {(scheduledItem.data as any).exercises.slice(0, 2).map((exercise: any) => (
                                        <div key={exercise.id} className="flex items-center gap-1">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleItemCompletion(scheduledItem.id, exercise.id);
                                            }}
                                            className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${
                                              exercise.completed 
                                                ? 'bg-green-500 border-green-500 text-white' 
                                                : 'border-gray-300 hover:border-green-500'
                                            }`}
                                            style={{ minHeight: '44px', minWidth: '44px' }}
                                          >
                                            {exercise.completed && <Check className="w-2 h-2" />}
                                          </button>
                                          <span className={`text-xs ${exercise.completed ? 'line-through opacity-60' : ''}`}>
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
                                    <div className="mt-1 space-compact-xs">
                                      {(scheduledItem.data as any).items.slice(0, 2).map((item: any) => (
                                        <div key={item.id} className="flex items-center gap-1">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleItemCompletion(scheduledItem.id, item.id);
                                            }}
                                            className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${
                                              item.completed 
                                                ? 'bg-green-500 border-green-500 text-white' 
                                                : 'border-gray-300 hover:border-green-500'
                                            }`}
                                            style={{ minHeight: '44px', minWidth: '44px' }}
                                          >
                                            {item.completed && <Check className="w-2 h-2" />}
                                          </button>
                                          <span className={`text-xs ${item.completed ? 'line-through opacity-60' : ''}`}>
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
                                    <div className="mt-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleItemCompletion(scheduledItem.id);
                                        }}
                                        className={`flex items-center gap-1 transition-opacity ${
                                          (scheduledItem.data as IndividualTodo).completed ? 'opacity-60' : ''
                                        }`}
                                        style={{ minHeight: '44px' }}
                                      >
                                        <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${
                                          (scheduledItem.data as IndividualTodo).completed 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'border-gray-300 hover:border-green-500'
                                        }`}>
                                          {(scheduledItem.data as IndividualTodo).completed && <Check className="w-2 h-2" />}
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
                                className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all ml-1"
                                style={{ minHeight: '44px', minWidth: '44px' }}
                                aria-label="Delete item"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {categoryItems.length === 0 && (
                          <div className="text-center py-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-1">
                              <MoreHorizontal className="w-3 h-3 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-400">No items</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

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

                {/* Time Category Selection */}
                <div className="form-group">
                  <div className="flex items-center gap-2">
                    <label className="form-label">Time of Day</label>
                    <span className="text-red-500 text-xs">*</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {timeCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedTimeCategory(category)}
                        className={`group relative p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                          selectedTimeCategory === category
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm scale-105 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 hover:scale-102 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                        style={{ minHeight: '44px' }}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            selectedTimeCategory === category
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            <Clock className="w-4 h-4" />
                          </div>
                          <span className="text-xs">{category}</span>
                        </div>
                        {selectedTimeCategory === category && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
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
                    !selectedTimeCategory ||
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