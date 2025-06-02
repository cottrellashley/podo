import React, { useState } from 'react';
import { ShoppingCart, Dumbbell, CheckSquare, ChevronLeft, ChevronRight, DollarSign, Calendar, TrendingUp, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { ShoppingListItem, WorkoutStats, TodoStats, FoodRecipe, Workout, TodoList, IndividualTodo } from '../types';

const MyAnalytics: React.FC = () => {
  const { currentWeekStart, getWeekData } = useAppContext();
  const [activeSection, setActiveSection] = useState<'shopping' | 'workout' | 'todo'>('shopping');
  const [selectedWeekStart, setSelectedWeekStart] = useState(currentWeekStart);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(selectedWeekStart);
    newWeekStart.setDate(selectedWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeekStart(newWeekStart);
  };

  const weekData = getWeekData(selectedWeekStart);

  // Calculate Shopping List
  const calculateShoppingList = (): { items: ShoppingListItem[], totalCost: number } => {
    const ingredientMap = new Map<string, { amount: number, unit: string, cost: number }>();
    
    Object.values(weekData).flat().forEach(scheduledItem => {
      if (scheduledItem.data.type === 'recipe') {
        const recipe = scheduledItem.data as FoodRecipe;
        recipe.ingredients.forEach(ingredient => {
          const key = `${ingredient.name.toLowerCase()}-${ingredient.unit.toLowerCase()}`;
          const existing = ingredientMap.get(key);
          const estimatedCost = ingredient.estimatedCost || 2.50; // Default cost per ingredient
          
          if (existing) {
            ingredientMap.set(key, {
              amount: existing.amount + ingredient.amount,
              unit: ingredient.unit,
              cost: existing.cost + estimatedCost
            });
          } else {
            ingredientMap.set(key, {
              amount: ingredient.amount,
              unit: ingredient.unit,
              cost: estimatedCost
            });
          }
        });
      }
    });

    const items: ShoppingListItem[] = Array.from(ingredientMap.entries()).map(([key, data]) => {
      const name = key.split('-')[0];
      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        totalAmount: data.amount,
        unit: data.unit,
        estimatedCost: data.cost
      };
    });

    const totalCost = items.reduce((sum, item) => sum + item.estimatedCost, 0);

    return { items, totalCost };
  };

  // Calculate Workout Stats
  const calculateWorkoutStats = (): WorkoutStats => {
    const workoutItems = Object.values(weekData).flat().filter(item => item.data.type === 'workout');
    const daysWithWorkouts = new Set(workoutItems.map(item => item.date)).size;
    const totalExercises = workoutItems.reduce((sum, item) => {
      const workout = item.data as Workout;
      return sum + workout.exercises.length;
    }, 0);

    return {
      totalWorkouts: workoutItems.length,
      daysWithWorkouts,
      totalExercises
    };
  };

  // Calculate Todo Stats
  const calculateTodoStats = (): TodoStats => {
    let totalTodos = 0;
    let completedTodos = 0;

    Object.values(weekData).flat().forEach(scheduledItem => {
      if (scheduledItem.data.type === 'todoList') {
        const todoList = scheduledItem.data as TodoList;
        totalTodos += todoList.items.length;
        completedTodos += todoList.items.filter(item => item.completed).length;
      } else if (scheduledItem.data.type === 'individualTodo') {
        const todo = scheduledItem.data as IndividualTodo;
        totalTodos += 1;
        if (todo.completed) completedTodos += 1;
      }
    });

    const pendingTodos = totalTodos - completedTodos;
    const completionPercentage = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    return {
      totalTodos,
      completedTodos,
      pendingTodos,
      completionPercentage
    };
  };

  const shoppingData = calculateShoppingList();
  const workoutStats = calculateWorkoutStats();
  const todoStats = calculateTodoStats();

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-heading">My Analytics</h2>
          <p className="text-body">Insights and summaries for your weekly planning</p>
        </div>
      </div>

      {/* Week Selection */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigateWeek('prev')}
            className="button-secondary p-3"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h3 className="text-subheading">
              Week of {selectedWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </h3>
            <p className="text-caption mt-1">{selectedWeekStart.getFullYear()}</p>
          </div>
          <button 
            onClick={() => navigateWeek('next')}
            className="button-secondary p-3"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="card p-2">
        <div className="flex">
          {[
            { id: 'shopping', label: 'Shopping List', icon: <ShoppingCart className="w-5 h-5" /> },
            { id: 'workout', label: 'Workout Stats', icon: <Dumbbell className="w-5 h-5" /> },
            { id: 'todo', label: 'Todo Stats', icon: <CheckSquare className="w-5 h-5" /> }
          ].map((section, index) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 ${
                activeSection === section.id 
                  ? 'bg-brand text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${index === 0 ? 'rounded-l-xl' : ''} ${index === 2 ? 'rounded-r-xl' : ''}`}
            >
              <div className="flex items-center justify-center gap-2">
                {section.icon}
                <span className="hidden sm:inline">{section.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Shopping List Section */}
      {activeSection === 'shopping' && (
        <div className="space-y-6">
          {/* Shopping Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{shoppingData.items.length}</div>
              <div className="text-caption">Unique Items</div>
            </div>
            <div className="card p-6 text-center">
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">${shoppingData.totalCost.toFixed(2)}</div>
              <div className="text-caption">Estimated Cost</div>
            </div>
            <div className="card p-6 text-center">
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {Object.values(weekData).flat().filter(item => item.data.type === 'recipe').length}
              </div>
              <div className="text-caption">Recipes Planned</div>
            </div>
          </div>

          {/* Shopping List */}
          <div className="card p-8">
            <h3 className="text-subheading mb-6">Shopping List</h3>
            {shoppingData.items.length > 0 ? (
              <div className="space-y-4">
                {shoppingData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                        <p className="text-sm text-gray-600">
                          {item.totalAmount} {item.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-gray-900">${item.estimatedCost.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-4 mt-6">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total Estimated Cost:</span>
                    <span className="text-green-600">${shoppingData.totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="icon-container bg-gray-50 border-gray-100 mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-subheading mb-2">No recipes scheduled</h4>
                <p className="text-body">Schedule some recipes in your week to generate a shopping list</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workout Stats Section */}
      {activeSection === 'workout' && (
        <div className="space-y-6">
          {/* Workout Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{workoutStats.totalWorkouts}</div>
              <div className="text-caption">Total Workouts</div>
            </div>
            <div className="card p-6 text-center">
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{workoutStats.daysWithWorkouts}</div>
              <div className="text-caption">Days with Workouts</div>
            </div>
            <div className="card p-6 text-center">
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{workoutStats.totalExercises}</div>
              <div className="text-caption">Total Exercises</div>
            </div>
          </div>

          {/* Workout Details */}
          <div className="card p-8">
            <h3 className="text-subheading mb-6">Workout Overview</h3>
            {workoutStats.totalWorkouts > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Weekly Progress</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Workout Frequency</span>
                        <span className="font-medium">{workoutStats.daysWithWorkouts}/7 days</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-brand h-3 rounded-full transition-all duration-500"
                          style={{ width: `${(workoutStats.daysWithWorkouts / 7) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Exercise Intensity</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg Exercises per Workout</span>
                        <span className="font-medium">
                          {workoutStats.totalWorkouts > 0 ? Math.round(workoutStats.totalExercises / workoutStats.totalWorkouts) : 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((workoutStats.totalExercises / workoutStats.totalWorkouts / 10) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{workoutStats.totalWorkouts}</div>
                      <div className="text-xs text-gray-600">Workouts</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{workoutStats.daysWithWorkouts}</div>
                      <div className="text-xs text-gray-600">Active Days</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{workoutStats.totalExercises}</div>
                      <div className="text-xs text-gray-600">Exercises</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.round((workoutStats.daysWithWorkouts / 7) * 100)}%
                      </div>
                      <div className="text-xs text-gray-600">Consistency</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="icon-container bg-gray-50 border-gray-100 mx-auto mb-4">
                  <Dumbbell className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-subheading mb-2">No workouts scheduled</h4>
                <p className="text-body">Schedule some workouts in your week to see your fitness stats</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Todo Stats Section */}
      {activeSection === 'todo' && (
        <div className="space-y-6">
          {/* Todo Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="card p-6 text-center">
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{todoStats.totalTodos}</div>
              <div className="text-caption">Total Todos</div>
            </div>
            <div className="card p-6 text-center">
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{todoStats.completedTodos}</div>
              <div className="text-caption">Completed</div>
            </div>
            <div className="card p-6 text-center">
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{todoStats.pendingTodos}</div>
              <div className="text-caption">Pending</div>
            </div>
            <div className="card p-6 text-center">
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{todoStats.completionPercentage}%</div>
              <div className="text-caption">Completion Rate</div>
            </div>
          </div>

          {/* Todo Progress */}
          <div className="card p-8">
            <h3 className="text-subheading mb-6">Todo Progress</h3>
            {todoStats.totalTodos > 0 ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-gray-900">Overall Progress</span>
                    <span className="text-lg font-bold text-blue-600">{todoStats.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-6 rounded-full transition-all duration-700 flex items-center justify-center"
                      style={{ width: `${todoStats.completionPercentage}%` }}
                    >
                      {todoStats.completionPercentage > 15 && (
                        <span className="text-white text-sm font-medium">{todoStats.completionPercentage}%</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Completion Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                        <span className="font-bold text-green-600">{todoStats.completedTodos}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                        <span className="font-bold text-orange-600">{todoStats.pendingTodos}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Productivity Insights</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-brand-50 rounded-lg">
                        <div className="text-sm text-gray-600">Daily Average</div>
                        <div className="font-bold text-blue-600">
                          {Math.round(todoStats.totalTodos / 7)} todos/day
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-sm text-gray-600">Completion Rate</div>
                        <div className="font-bold text-purple-600">
                          {todoStats.completionPercentage >= 80 ? 'Excellent' : 
                           todoStats.completionPercentage >= 60 ? 'Good' : 
                           todoStats.completionPercentage >= 40 ? 'Fair' : 'Needs Improvement'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="icon-container bg-gray-50 border-gray-100 mx-auto mb-4">
                  <CheckSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-subheading mb-2">No todos scheduled</h4>
                <p className="text-body">Schedule some todos in your week to track your productivity</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAnalytics; 