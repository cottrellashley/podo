import React from 'react';
import { Calendar, Package, Bot, ChefHat, Dumbbell, CheckSquare, User, Clock, Check, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import type { IndividualTodo, TimeCategory } from '../types';

interface HomeProps {
  onNavigate?: (tab: 'objects' | 'week' | 'assistant') => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { scheduledItems, toggleItemCompletion } = useAppContext();

  const getCurrentTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getTodaysItems = () => {
    const today = getTodayString();
    return scheduledItems
      .filter(item => item.date === today)
      .sort((a, b) => {
        const categoryOrder = { Morning: 0, Afternoon: 1, Evening: 2, Night: 3 };
        const categoryDiff = categoryOrder[a.timeCategory] - categoryOrder[b.timeCategory];
        return categoryDiff !== 0 ? categoryDiff : a.order - b.order;
      });
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'recipe':
        return <ChefHat className="w-5 h-5" />;
      case 'workout':
        return <Dumbbell className="w-5 h-5" />;
      case 'todoList':
        return <CheckSquare className="w-5 h-5" />;
      case 'individualTodo':
        return <User className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getTimeCategoryColor = (category: TimeCategory) => {
    switch (category) {
      case 'Morning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700';
      case 'Afternoon':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'Evening':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
      case 'Night':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case 'recipe':
        return 'bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:hover:bg-green-900/30';
      case 'workout':
        return 'bg-brand-50 border-brand-200 hover:bg-brand-100 dark:bg-brand-900/20 dark:border-brand-700 dark:hover:bg-brand-900/30';
      case 'todoList':
        return 'bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-700 dark:hover:bg-purple-900/30';
      case 'individualTodo':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-700 dark:hover:bg-blue-900/30';
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const todaysItems = getTodaysItems();
  const timeCategories: TimeCategory[] = ['Morning', 'Afternoon', 'Evening', 'Night'];

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Welcome to Podo
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Your personal life organizer for recipes, workouts, and tasks with AI-powered assistance.
            </p>
          </div>
          <div className="p-6 bg-brand-50 border border-brand-200 rounded-xl dark:bg-brand-900/20 dark:border-brand-700">
            <h3 className="text-lg font-semibold text-brand-900 dark:text-brand-300 mb-2">
              Ready to Get Started?
            </h3>
            <p className="text-brand-700 dark:text-brand-400 text-sm">
              Sign in to start organizing your schedule and see what's planned for today.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Today's Schedule - Main Focus */}
      <div className="space-y-6">
        {/* Greeting Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {getCurrentTimeGreeting()}, {user.name}! 👋
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {formatDate(new Date())}
          </p>
        </div>

        {/* Today's Schedule Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Today's Schedule</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{todaysItems.length} {todaysItems.length === 1 ? 'item' : 'items'}</span>
            </div>
          </div>

          {todaysItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No items scheduled for today
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start planning your day by adding some items to your schedule.
              </p>
              <button 
                onClick={() => onNavigate?.('week')}
                className="button-primary flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {timeCategories.map((category) => {
                const categoryItems = todaysItems.filter(item => item.timeCategory === category);
                
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category} className="space-y-3">
                    <div className={`text-sm font-semibold px-3 py-1 rounded-full inline-block border ${getTimeCategoryColor(category)}`}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {category}
                    </div>
                    
                    <div className="space-y-3 pl-4">
                      {categoryItems.map((scheduledItem) => (
                        <div
                          key={scheduledItem.id}
                          className={`p-4 rounded-xl border transition-all duration-200 ${getItemColor(scheduledItem.objectType)}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="mt-1">
                              {getItemIcon(scheduledItem.objectType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                {scheduledItem.data.type === 'individualTodo' 
                                  ? (scheduledItem.data as IndividualTodo).text
                                  : (scheduledItem.data as any).title
                                }
                              </h4>
                              
                              {/* Item Details */}
                              {scheduledItem.data.type === 'recipe' && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {(scheduledItem.data as any).ingredients.length} ingredients
                                </p>
                              )}
                              
                              {scheduledItem.data.type === 'workout' && (
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {(scheduledItem.data as any).exercises.length} exercises
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {(scheduledItem.data as any).exercises.slice(0, 3).map((exercise: any) => (
                                      <button
                                        key={exercise.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleItemCompletion(scheduledItem.id, exercise.id);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-colors ${
                                          exercise.completed 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                            : 'bg-white border border-gray-200 hover:border-green-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-green-500'
                                        }`}
                                      >
                                        <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                                          exercise.completed 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'border-gray-300 dark:border-gray-500'
                                        }`}>
                                          {exercise.completed && <Check className="w-2 h-2" />}
                                        </div>
                                        <span className={exercise.completed ? 'line-through' : ''}>
                                          {exercise.name}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {scheduledItem.data.type === 'todoList' && (
                                <div className="space-y-2">
                                  {(scheduledItem.data as any).items.slice(0, 3).map((item: any) => (
                                    <button
                                      key={item.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleItemCompletion(scheduledItem.id, item.id);
                                      }}
                                      className="flex items-center gap-2 text-sm"
                                    >
                                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                        item.completed 
                                          ? 'bg-green-500 border-green-500 text-white' 
                                          : 'border-gray-300 hover:border-green-500 dark:border-gray-500 dark:hover:border-green-400'
                                      }`}>
                                        {item.completed && <Check className="w-2.5 h-2.5" />}
                                      </div>
                                      <span className={`${item.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {item.text}
                                      </span>
                                    </button>
                                  ))}
                                  {(scheduledItem.data as any).items.length > 3 && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                                      +{(scheduledItem.data as any).items.length - 3} more items
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {scheduledItem.data.type === 'individualTodo' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItemCompletion(scheduledItem.id);
                                  }}
                                  className={`flex items-center gap-2 text-sm transition-opacity ${
                                    (scheduledItem.data as IndividualTodo).completed ? 'opacity-60' : ''
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                    (scheduledItem.data as IndividualTodo).completed 
                                      ? 'bg-green-500 border-green-500 text-white' 
                                      : 'border-gray-300 hover:border-green-500 dark:border-gray-500 dark:hover:border-green-400'
                                  }`}>
                                    {(scheduledItem.data as IndividualTodo).completed && <Check className="w-2.5 h-2.5" />}
                                  </div>
                                  <span className={`${
                                    (scheduledItem.data as IndividualTodo).completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {(scheduledItem.data as IndividualTodo).completed ? 'Completed' : 'Mark complete'}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Cards - Simplified */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
          What would you like to do?
        </h3>
        
        <div className="mobile-grid">
          <button 
            onClick={() => onNavigate?.('assistant')}
            className="card card-interactive p-6 text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="icon-container bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get help creating and planning</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
            </div>
          </button>

          <button 
            onClick={() => onNavigate?.('week')}
            className="card card-interactive p-6 text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="icon-container bg-brand-50 border-brand-200 text-brand-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">My Week</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Plan your weekly schedule</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
            </div>
          </button>

          <button 
            onClick={() => onNavigate?.('objects')}
            className="card card-interactive p-6 text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="icon-container bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">My Objects</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage recipes, workouts & todos</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home; 