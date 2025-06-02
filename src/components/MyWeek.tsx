import React, { useState } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, X, Check, Trash2, ChefHat, Dumbbell, CheckSquare, User, Clock, MoreHorizontal, Database } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
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

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'recipe' | 'workout' | 'todoList' | 'individualTodo'>('recipe');
  const [selectedObject, setSelectedObject] = useState<string>('');
  const [selectedTimeCategory, setSelectedTimeCategory] = useState<TimeCategory>('Morning');
  const [individualTodoText, setIndividualTodoText] = useState('');

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

  const handleAddItem = () => {
    if (!selectedDate) return;

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

      addScheduledItem(scheduledItem);
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

      addScheduledItem(scheduledItem);
    }

    setShowAddModal(false);
    setSelectedObject('');
    setIndividualTodoText('');
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
        return 'bg-emerald-100 border-emerald-200 text-emerald-800 hover:bg-emerald-200';
      case 'workout':
        return 'bg-brand-50 border-brand-100 text-brand-800 hover:bg-brand-100';
      case 'todoList':
        return 'bg-purple-100 border-purple-200 text-purple-800 hover:bg-purple-200';
      case 'individualTodo':
        return 'bg-amber-100 border-amber-200 text-amber-800 hover:bg-amber-200';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200';
    }
  };

  const getTimeCategoryColor = (category: TimeCategory) => {
    switch (category) {
      case 'Morning':
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 text-yellow-800';
      case 'Afternoon':
        return 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 text-orange-800';
      case 'Evening':
        return 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-800';
      case 'Night':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
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
    <div className="space-y-6">
      {/* Enhanced Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-heading">My Week</h2>
            <p className="text-body text-gray-600">Plan and organize your weekly schedule</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={goToToday}
              className="button-secondary text-sm px-4 py-2"
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
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigateWeek('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {getCurrentWeekRange()}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Week {Math.ceil((currentWeekStart.getTime() - new Date(currentWeekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}
              </p>
            </div>
            
            <button 
              onClick={() => navigateWeek('next')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Week View */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
        {getWeekDates().map((date, index) => {
          const dateStr = formatDate(date);
          const dayItems = weekData[dateStr] || [];
          const todayClass = isToday(date);
          
          return (
            <div
              key={dateStr}
              className={`card transition-all duration-200 ${
                todayClass 
                  ? 'ring-2 ring-brand bg-brand-50 border-brand-200' 
                  : 'hover:shadow-md border-gray-200'
              }`}
            >
              {/* Enhanced Day Header */}
              <div className={`p-4 border-b ${todayClass ? 'border-brand-200' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <div className={`text-xs font-medium uppercase tracking-wide ${
                      todayClass ? 'text-brand-600' : 'text-gray-500'
                    }`}>
                      {weekDays[index]}
                    </div>
                    <div className={`text-2xl font-bold mt-1 ${
                      todayClass ? 'text-brand-900' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                    {todayClass && (
                      <div className="text-xs text-brand-600 font-medium mt-1">Today</div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setShowAddModal(true);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      todayClass 
                        ? 'hover:bg-brand-200 text-brand-600' 
                        : 'hover:bg-gray-100 text-gray-400'
                    }`}
                    aria-label={`Add item to ${weekDaysFull[index]}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Enhanced Time Categories */}
              <div className="p-4 space-y-4 min-h-[400px]">
                {timeCategories.map((category) => {
                  const categoryItems = dayItems.filter(item => item.timeCategory === category);
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className={`text-xs font-semibold px-3 py-1 rounded-full inline-block ${getTimeCategoryColor(category)}`}>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {category}
                      </div>
                      
                      <div className="space-y-2 pl-2">
                        {categoryItems.map((scheduledItem) => (
                          <div
                            key={scheduledItem.id}
                            className={`group p-3 rounded-xl border transition-all duration-200 cursor-pointer ${getItemColor(scheduledItem.objectType)}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
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
                                    <div className="mt-2 space-y-1">
                                      {(scheduledItem.data as any).exercises.slice(0, 2).map((exercise: any) => (
                                        <div key={exercise.id} className="flex items-center gap-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleItemCompletion(scheduledItem.id, exercise.id);
                                            }}
                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                              exercise.completed 
                                                ? 'bg-green-500 border-green-500 text-white' 
                                                : 'border-gray-300 hover:border-green-500'
                                            }`}
                                          >
                                            {exercise.completed && <Check className="w-2.5 h-2.5" />}
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
                                    <div className="mt-2 space-y-1">
                                      {(scheduledItem.data as any).items.slice(0, 2).map((item: any) => (
                                        <div key={item.id} className="flex items-center gap-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleItemCompletion(scheduledItem.id, item.id);
                                            }}
                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                              item.completed 
                                                ? 'bg-green-500 border-green-500 text-white' 
                                                : 'border-gray-300 hover:border-green-500'
                                            }`}
                                          >
                                            {item.completed && <Check className="w-2.5 h-2.5" />}
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
                                    <div className="mt-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleItemCompletion(scheduledItem.id);
                                        }}
                                        className={`flex items-center gap-2 transition-opacity ${
                                          (scheduledItem.data as IndividualTodo).completed ? 'opacity-60' : ''
                                        }`}
                                      >
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                          (scheduledItem.data as IndividualTodo).completed 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'border-gray-300 hover:border-green-500'
                                        }`}>
                                          {(scheduledItem.data as IndividualTodo).completed && <Check className="w-2.5 h-2.5" />}
                                        </div>
                                        <span className={`text-xs ${
                                          (scheduledItem.data as IndividualTodo).completed ? 'line-through' : ''
                                        }`}>
                                          {(scheduledItem.data as IndividualTodo).completed ? 'Completed' : 'Mark complete'}
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
                                className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all ml-2"
                                aria-label="Delete item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {categoryItems.length === 0 && (
                          <div className="text-center py-4">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                              <MoreHorizontal className="w-4 h-4 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-400">No items scheduled</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Add New Item</h3>
                  <p className="text-sm text-gray-500 mt-1">Schedule something for your week</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Enhanced Date Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Select Date
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              </div>

              {/* Enhanced Time Category */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Time of Day
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {timeCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedTimeCategory(category)}
                      className={`p-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                        selectedTimeCategory === category
                          ? 'border-brand bg-brand-50 text-brand-700 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Clock className="w-4 h-4 mx-auto mb-2" />
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Item Type */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  What would you like to add?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'recipe', label: 'Recipe', icon: ChefHat, color: 'emerald' },
                    { type: 'workout', label: 'Workout', icon: Dumbbell, color: 'blue' },
                    { type: 'todoList', label: 'Todo List', icon: CheckSquare, color: 'purple' },
                    { type: 'individualTodo', label: 'Quick Todo', icon: User, color: 'amber' }
                  ].map(({ type, label, icon: Icon, color }) => (
                    <button
                      key={type}
                      onClick={() => setAddType(type as any)}
                      className={`p-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 flex flex-col items-center gap-2 ${
                        addType === type
                          ? `border-${color}-500 bg-${color}-50 text-${color}-700 shadow-sm`
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Object Selection or Individual Todo Input */}
              {addType === 'individualTodo' ? (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-900">
                    What needs to be done?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={individualTodoText}
                      onChange={(e) => setIndividualTodoText(e.target.value)}
                      placeholder="Enter your task..."
                      className="w-full p-3 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-900">
                    Select {addType}
                  </label>
                  <select
                    value={selectedObject}
                    onChange={(e) => setSelectedObject(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Choose a {addType}</option>
                    {filteredObjects.map((obj) => (
                      <option key={obj.id} value={obj.id}>
                        {obj.title}
                      </option>
                    ))}
                  </select>
                  {filteredObjects.length === 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 text-amber-600 mt-0.5">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-800">No {addType}s available</p>
                          <p className="text-sm text-amber-700 mt-1">
                            Create one in the "My Objects" tab first, then come back to schedule it.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  className="flex-1 px-4 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={
                    !selectedDate || 
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