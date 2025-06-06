import React, { useState } from 'react';
import { ShoppingCart, Dumbbell, CheckSquare, ChevronLeft, ChevronRight, DollarSign, Calendar, TrendingUp, Clock, X, Eye, BarChart3 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { ShoppingListItem, WorkoutStats, TodoStats, FoodRecipe, Workout, TodoList, IndividualTodo, ScheduledItem } from '../types';

const MyAnalytics: React.FC = () => {
  const { currentWeekStart, getWeekData } = useAppContext();
  const [activeSection, setActiveSection] = useState<'shopping' | 'workout' | 'todo'>('shopping');
  const [selectedWeekStart, setSelectedWeekStart] = useState(currentWeekStart);
  const [selectedMetric, setSelectedMetric] = useState<{
    type: 'shopping' | 'workout' | 'todo';
    metric: string;
    data: any;
  } | null>(null);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(selectedWeekStart);
    newWeekStart.setDate(selectedWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeekStart(newWeekStart);
  };

  const weekData = getWeekData(selectedWeekStart);

  // Get all scheduled items for detailed analysis
  const getAllScheduledItems = (): ScheduledItem[] => {
    return Object.values(weekData).flat();
  };

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

  // Click handlers for different metrics
  const handleMetricClick = (type: 'shopping' | 'workout' | 'todo', metric: string) => {
    const allItems = getAllScheduledItems();
    let data: any = {};

    switch (type) {
      case 'shopping':
        if (metric === 'uniqueItems') {
          data = {
            title: 'Unique Shopping Items',
            items: shoppingData.items,
            recipes: allItems.filter(item => item.data.type === 'recipe')
          };
        } else if (metric === 'estimatedCost') {
          data = {
            title: 'Cost Breakdown',
            totalCost: shoppingData.totalCost,
            items: shoppingData.items.sort((a, b) => b.estimatedCost - a.estimatedCost),
            avgCostPerItem: shoppingData.items.length > 0 ? shoppingData.totalCost / shoppingData.items.length : 0
          };
        } else if (metric === 'recipesPlanned') {
          const recipeItems = allItems.filter(item => item.data.type === 'recipe');
          data = {
            title: 'Planned Recipes',
            recipes: recipeItems,
            byDay: Object.entries(weekData).map(([date, items]) => ({
              date,
              recipes: items.filter(item => item.data.type === 'recipe')
            })).filter(day => day.recipes.length > 0)
          };
        }
        break;

      case 'workout':
        if (metric === 'totalWorkouts') {
          const workoutItems = allItems.filter(item => item.data.type === 'workout');
          data = {
            title: 'All Workouts',
            workouts: workoutItems,
            byDay: Object.entries(weekData).map(([date, items]) => ({
              date,
              workouts: items.filter(item => item.data.type === 'workout')
            })).filter(day => day.workouts.length > 0)
          };
        } else if (metric === 'daysWithWorkouts') {
          const workoutDays = Object.entries(weekData)
            .filter(([date, items]) => items.some(item => item.data.type === 'workout'))
            .map(([date, items]) => ({
              date,
              workouts: items.filter(item => item.data.type === 'workout'),
              totalExercises: items.filter(item => item.data.type === 'workout')
                .reduce((sum, item) => sum + (item.data as Workout).exercises.length, 0)
            }));
          data = {
            title: 'Active Workout Days',
            days: workoutDays,
            totalDays: workoutDays.length,
            restDays: 7 - workoutDays.length
          };
        } else if (metric === 'totalExercises') {
          const workoutItems = allItems.filter(item => item.data.type === 'workout');
          const exerciseBreakdown = workoutItems.map(item => ({
            workout: item.data as Workout,
            date: item.date,
            time: item.time,
            exercises: (item.data as Workout).exercises
          }));
          data = {
            title: 'Exercise Breakdown',
            workouts: exerciseBreakdown,
            totalExercises: workoutStats.totalExercises,
            avgPerWorkout: workoutStats.totalWorkouts > 0 ? Math.round(workoutStats.totalExercises / workoutStats.totalWorkouts) : 0
          };
        }
        break;

      case 'todo':
        if (metric === 'totalTodos') {
          const todoItems = allItems.filter(item => 
            item.data.type === 'todoList' || item.data.type === 'individualTodo'
          );
          data = {
            title: 'All Todos',
            items: todoItems,
            breakdown: todoItems.map(item => {
              if (item.data.type === 'todoList') {
                const todoList = item.data as TodoList;
                return {
                  type: 'list',
                  title: todoList.title,
                  date: item.date,
                  time: item.time,
                  totalItems: todoList.items.length,
                  completed: todoList.items.filter(t => t.completed).length,
                  items: todoList.items
                };
              } else {
                const todo = item.data as IndividualTodo;
                return {
                  type: 'individual',
                  title: todo.text,
                  date: item.date,
                  time: item.time,
                  completed: todo.completed
                };
              }
            })
          };
        } else if (metric === 'completed') {
          const completedTodos = getAllCompletedTodos();
          data = {
            title: 'Completed Todos',
            completed: completedTodos,
            completionRate: todoStats.completionPercentage
          };
        } else if (metric === 'pending') {
          const pendingTodos = getPendingTodos();
          data = {
            title: 'Pending Todos',
            pending: pendingTodos,
            totalPending: todoStats.pendingTodos
          };
        } else if (metric === 'completionRate') {
          data = {
            title: 'Completion Analysis',
            totalTodos: todoStats.totalTodos,
            completed: todoStats.completedTodos,
            pending: todoStats.pendingTodos,
            percentage: todoStats.completionPercentage,
            dailyAverage: Math.round(todoStats.totalTodos / 7),
            performance: todoStats.completionPercentage >= 80 ? 'Excellent' : 
                        todoStats.completionPercentage >= 60 ? 'Good' : 
                        todoStats.completionPercentage >= 40 ? 'Fair' : 'Needs Improvement'
          };
        }
        break;
    }

    setSelectedMetric({ type, metric, data });
  };

  // Helper functions for todo analysis
  const getAllCompletedTodos = () => {
    const completed: any[] = [];
    getAllScheduledItems().forEach(item => {
      if (item.data.type === 'todoList') {
        const todoList = item.data as TodoList;
        todoList.items.filter(t => t.completed).forEach(todo => {
          completed.push({
            text: todo.text,
            listTitle: todoList.title,
            date: item.date,
            time: item.time,
            type: 'list'
          });
        });
      } else if (item.data.type === 'individualTodo') {
        const todo = item.data as IndividualTodo;
        if (todo.completed) {
          completed.push({
            text: todo.text,
            date: item.date,
            time: item.time,
            type: 'individual'
          });
        }
      }
    });
    return completed;
  };

  const getPendingTodos = () => {
    const pending: any[] = [];
    getAllScheduledItems().forEach(item => {
      if (item.data.type === 'todoList') {
        const todoList = item.data as TodoList;
        todoList.items.filter(t => !t.completed).forEach(todo => {
          pending.push({
            text: todo.text,
            listTitle: todoList.title,
            date: item.date,
            time: item.time,
            type: 'list'
          });
        });
      } else if (item.data.type === 'individualTodo') {
        const todo = item.data as IndividualTodo;
        if (!todo.completed) {
          pending.push({
            text: todo.text,
            date: item.date,
            time: item.time,
            type: 'individual'
          });
        }
      }
    });
    return pending;
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-heading">Analytics</h2>
          <p className="text-body mt-1">Track your progress and activity patterns</p>
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
      <div className="tab-nav-container">
        <div className="tab-nav-card">
          <div className="tab-nav-buttons">
            {[
              { id: 'shopping', label: 'Shopping List', icon: <ShoppingCart className="w-5 h-5" /> },
              { id: 'workout', label: 'Workout Stats', icon: <Dumbbell className="w-5 h-5" /> },
              { id: 'todo', label: 'Todo Stats', icon: <CheckSquare className="w-5 h-5" /> }
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`tab-nav-button ${
                  activeSection === section.id ? 'active' : 'inactive'
                }`}
              >
                <div className="flex items-center gap-2">
                  {section.icon}
                  <span className="hidden sm:inline whitespace-nowrap">{section.label}</span>
                  <span className="sm:hidden text-xs">{section.label.split(' ')[0]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Shopping List Section */}
      {activeSection === 'shopping' && (
        <div className="space-y-6">
          {/* Shopping Summary */}
          <div className="mobile-grid">
            <div 
              className="card p-6 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleMetricClick('shopping', 'uniqueItems')}
            >
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{shoppingData.items.length}</div>
              <div className="text-caption">Unique Items</div>
              <div className="mt-2 opacity-60">
                <Eye className="w-4 h-4 mx-auto" />
              </div>
            </div>
            <div 
              className="card p-6 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleMetricClick('shopping', 'estimatedCost')}
            >
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">${shoppingData.totalCost.toFixed(2)}</div>
              <div className="text-caption">Estimated Cost</div>
              <div className="mt-2 opacity-60">
                <Eye className="w-4 h-4 mx-auto" />
              </div>
            </div>
            <div 
              className="card p-6 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleMetricClick('shopping', 'recipesPlanned')}
            >
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {Object.values(weekData).flat().filter(item => item.data.type === 'recipe').length}
              </div>
              <div className="text-caption">Recipes Planned</div>
              <div className="mt-2 opacity-60">
                <Eye className="w-4 h-4 mx-auto" />
              </div>
            </div>
          </div>

          {/* Shopping List */}
          <div className="card p-8">
            <h3 className="text-subheading mb-6">Shopping List</h3>
            {shoppingData.items.length > 0 ? (
              <div className="space-y-4">
                {shoppingData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.totalAmount} {item.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-gray-900 dark:text-gray-100">${item.estimatedCost.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-gray-100">Total Estimated Cost:</span>
                    <span className="text-green-600 dark:text-green-400">${shoppingData.totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="icon-container bg-gray-50 border-gray-100 dark:bg-gray-700 dark:border-gray-600 mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
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
          <div className="mobile-grid">
            <div 
              className="card p-6 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleMetricClick('workout', 'totalWorkouts')}
            >
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{workoutStats.totalWorkouts}</div>
              <div className="text-caption">Total Workouts</div>
              <div className="mt-2 opacity-60">
                <Eye className="w-4 h-4 mx-auto" />
              </div>
            </div>
            <div 
              className="card p-6 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleMetricClick('workout', 'daysWithWorkouts')}
            >
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{workoutStats.daysWithWorkouts}</div>
              <div className="text-caption">Days with Workouts</div>
              <div className="mt-2 opacity-60">
                <Eye className="w-4 h-4 mx-auto" />
              </div>
            </div>
            <div 
              className="card p-6 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleMetricClick('workout', 'totalExercises')}
            >
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{workoutStats.totalExercises}</div>
              <div className="text-caption">Total Exercises</div>
              <div className="mt-2 opacity-60">
                <Eye className="w-4 h-4 mx-auto" />
              </div>
            </div>
          </div>

          {/* Workout Details */}
          <div className="card p-8">
            <h3 className="text-subheading mb-6">Workout Overview</h3>
            {workoutStats.totalWorkouts > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Weekly Progress</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Workout Frequency</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{workoutStats.daysWithWorkouts}/7 days</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-brand h-3 rounded-full transition-all duration-500"
                          style={{ width: `${(workoutStats.daysWithWorkouts / 7) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Exercise Intensity</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Avg Exercises per Workout</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {workoutStats.totalWorkouts > 0 ? Math.round(workoutStats.totalExercises / workoutStats.totalWorkouts) : 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((workoutStats.totalExercises / workoutStats.totalWorkouts / 10) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{workoutStats.totalWorkouts}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Workouts</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{workoutStats.daysWithWorkouts}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Active Days</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{workoutStats.totalExercises}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Exercises</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {Math.round((workoutStats.daysWithWorkouts / 7) * 100)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Consistency</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="icon-container bg-gray-50 border-gray-100 dark:bg-gray-700 dark:border-gray-600 mx-auto mb-4">
                  <Dumbbell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div 
              className="card p-6 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleMetricClick('todo', 'totalTodos')}
            >
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{todoStats.totalTodos}</div>
              <div className="text-caption">Total Todos</div>
              <div className="mt-2 opacity-60">
                <Eye className="w-4 h-4 mx-auto" />
              </div>
            </div>
            <div 
              className="card p-6 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleMetricClick('todo', 'completed')}
            >
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{todoStats.completedTodos}</div>
              <div className="text-caption">Completed</div>
              <div className="mt-2 opacity-60">
                <Eye className="w-4 h-4 mx-auto" />
              </div>
            </div>
            <div 
              className="card p-6 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleMetricClick('todo', 'pending')}
            >
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{todoStats.pendingTodos}</div>
              <div className="text-caption">Pending</div>
              <div className="mt-2 opacity-60">
                <Eye className="w-4 h-4 mx-auto" />
              </div>
            </div>
            <div 
              className="card p-6 text-center cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleMetricClick('todo', 'completionRate')}
            >
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600 mx-auto mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{todoStats.completionPercentage}%</div>
              <div className="text-caption">Completion Rate</div>
              <div className="mt-2 opacity-60">
                <Eye className="w-4 h-4 mx-auto" />
              </div>
            </div>
          </div>

          {/* Todo Progress */}
          <div className="card p-8">
            <h3 className="text-subheading mb-6">Todo Progress</h3>
            {todoStats.totalTodos > 0 ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-gray-900 dark:text-gray-100">Overall Progress</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{todoStats.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
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
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Completion Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Completed</span>
                        </div>
                        <span className="font-bold text-green-600 dark:text-green-400">{todoStats.completedTodos}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Pending</span>
                        </div>
                        <span className="font-bold text-orange-600 dark:text-orange-400">{todoStats.pendingTodos}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Productivity Insights</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Daily Average</div>
                        <div className="font-bold text-blue-600 dark:text-blue-400">
                          {Math.round(todoStats.totalTodos / 7)} todos/day
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
                        <div className="font-bold text-purple-600 dark:text-purple-400">
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
                <div className="icon-container bg-gray-50 border-gray-100 dark:bg-gray-700 dark:border-gray-600 mx-auto mb-4">
                  <CheckSquare className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h4 className="text-subheading mb-2">No todos scheduled</h4>
                <p className="text-body">Schedule some todos in your week to track your productivity</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Analytics Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="icon-container bg-brand-50 border-brand-100 text-brand-600">
                  {selectedMetric.type === 'shopping' && <ShoppingCart className="w-5 h-5" />}
                  {selectedMetric.type === 'workout' && <Dumbbell className="w-5 h-5" />}
                  {selectedMetric.type === 'todo' && <CheckSquare className="w-5 h-5" />}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {selectedMetric.data.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMetric(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Shopping Metrics */}
              {selectedMetric.type === 'shopping' && selectedMetric.metric === 'uniqueItems' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedMetric.data.items.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Unique Items</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedMetric.data.recipes.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">From Recipes</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        ${(selectedMetric.data.items.reduce((sum: number, item: any) => sum + item.estimatedCost, 0)).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Cost</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Shopping List Items</h4>
                    <div className="space-y-3">
                      {selectedMetric.data.items.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {item.totalAmount} {item.unit}
                              </p>
                            </div>
                          </div>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            ${item.estimatedCost.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric.type === 'shopping' && selectedMetric.metric === 'estimatedCost' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ${selectedMetric.data.totalCost.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Cost</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ${selectedMetric.data.avgCostPerItem.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg per Item</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {selectedMetric.data.items.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Items</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Cost Breakdown (Highest to Lowest)</h4>
                    <div className="space-y-3">
                      {selectedMetric.data.items.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {item.totalAmount} {item.unit}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-green-600 dark:text-green-400">
                              ${item.estimatedCost.toFixed(2)}
                            </span>
                            <p className="text-xs text-gray-500">
                              {((item.estimatedCost / selectedMetric.data.totalCost) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric.type === 'shopping' && selectedMetric.metric === 'recipesPlanned' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedMetric.data.recipes.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Recipes</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedMetric.data.byDay.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Days with Recipes</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Recipes by Day</h4>
                    <div className="space-y-4">
                      {selectedMetric.data.byDay.map((day: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="font-medium mb-2">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="space-y-2">
                            {day.recipes.map((recipe: any, recipeIndex: number) => (
                              <div key={recipeIndex} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="font-medium">{recipe.data.title}</span>
                                {recipe.time && (
                                  <span className="text-xs text-gray-500 ml-auto">
                                    {recipe.time}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Workout Metrics */}
              {selectedMetric.type === 'workout' && selectedMetric.metric === 'totalWorkouts' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedMetric.data.workouts.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Workouts</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedMetric.data.byDay.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Active Days</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {selectedMetric.data.workouts.reduce((sum: number, w: any) => sum + w.data.exercises.length, 0)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Exercises</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Workouts by Day</h4>
                    <div className="space-y-4">
                      {selectedMetric.data.byDay.map((day: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="font-medium mb-2">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="space-y-2">
                            {day.workouts.map((workout: any, workoutIndex: number) => (
                              <div key={workoutIndex} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="font-medium">{workout.data.title}</span>
                                </div>
                                <div className="text-right text-sm">
                                  <div className="text-gray-600 dark:text-gray-400">
                                    {workout.data.exercises.length} exercises
                                  </div>
                                  {workout.time && (
                                    <div className="text-xs text-gray-500">{workout.time}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric.type === 'workout' && selectedMetric.metric === 'daysWithWorkouts' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedMetric.data.totalDays}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Active Days</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {selectedMetric.data.restDays}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Rest Days</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {Math.round((selectedMetric.data.totalDays / 7) * 100)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Consistency</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Daily Breakdown</h4>
                    <div className="space-y-3">
                      {selectedMetric.data.days.map((day: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="font-medium">
                              {new Date(day.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{day.workouts.length} workouts</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {day.totalExercises} exercises
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric.type === 'workout' && selectedMetric.metric === 'totalExercises' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {selectedMetric.data.totalExercises}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Exercises</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedMetric.data.avgPerWorkout}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg per Workout</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedMetric.data.workouts.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Workouts</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Exercise Details</h4>
                    <div className="space-y-4">
                      {selectedMetric.data.workouts.map((workout: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">{workout.workout.title}</span>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(workout.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                              {workout.time && ` at ${workout.time}`}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {workout.exercises.map((exercise: any, exerciseIndex: number) => (
                              <div key={exerciseIndex} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600 rounded text-sm">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span>{exercise.name}</span>
                                {exercise.sets && (
                                  <span className="text-gray-500 ml-auto">
                                    {exercise.sets} sets
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Todo Metrics */}
              {selectedMetric.type === 'todo' && selectedMetric.metric === 'totalTodos' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedMetric.data.breakdown.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Todo Items</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedMetric.data.breakdown.filter((item: any) => item.type === 'list').length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Todo Lists</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {selectedMetric.data.breakdown.filter((item: any) => item.type === 'individual').length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Individual Todos</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">All Todos</h4>
                    <div className="space-y-3">
                      {selectedMetric.data.breakdown.map((item: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                item.type === 'list' ? 'bg-blue-500' : 'bg-purple-500'
                              }`}></div>
                              <span className="font-medium">{item.title}</span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(item.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                              {item.time && ` at ${item.time}`}
                            </div>
                          </div>
                          {item.type === 'list' && (
                            <div className="ml-6 text-sm">
                              <div className="text-gray-600 dark:text-gray-400">
                                {item.completed}/{item.totalItems} completed ({Math.round((item.completed / item.totalItems) * 100)}%)
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                                <div 
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${(item.completed / item.totalItems) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          {item.type === 'individual' && (
                            <div className="ml-6 text-sm">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                item.completed 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                              }`}>
                                {item.completed ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric.type === 'todo' && selectedMetric.metric === 'completed' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedMetric.data.completed.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Completed Todos</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedMetric.data.completionRate}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Completed Items</h4>
                    <div className="space-y-3">
                      {selectedMetric.data.completed.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <div>
                              <span className="font-medium">{item.text}</span>
                              {item.listTitle && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  from {item.listTitle}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(item.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                            {item.time && ` at ${item.time}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric.type === 'todo' && selectedMetric.metric === 'pending' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {selectedMetric.data.pending.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Pending Todos</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {selectedMetric.data.totalPending}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Pending</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Pending Items</h4>
                    <div className="space-y-3">
                      {selectedMetric.data.pending.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <div>
                              <span className="font-medium">{item.text}</span>
                              {item.listTitle && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  from {item.listTitle}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(item.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                            {item.time && ` at ${item.time}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric.type === 'todo' && selectedMetric.metric === 'completionRate' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedMetric.data.percentage}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedMetric.data.completed}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {selectedMetric.data.pending}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {selectedMetric.data.dailyAverage}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Daily Avg</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Progress Visualization</h4>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-8 rounded-full flex items-center justify-center transition-all duration-700"
                          style={{ width: `${selectedMetric.data.percentage}%` }}
                        >
                          {selectedMetric.data.percentage > 15 && (
                            <span className="text-white text-sm font-medium">
                              {selectedMetric.data.percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h5 className="font-medium mb-3">Performance Rating</h5>
                        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                          selectedMetric.data.performance === 'Excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          selectedMetric.data.performance === 'Good' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                          selectedMetric.data.performance === 'Fair' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          <BarChart3 className="w-4 h-4" />
                          {selectedMetric.data.performance}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h5 className="font-medium mb-3">Weekly Summary</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Todos:</span>
                            <span className="font-medium">{selectedMetric.data.totalTodos}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Daily Average:</span>
                            <span className="font-medium">{selectedMetric.data.dailyAverage}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Completion Rate:</span>
                            <span className="font-medium">{selectedMetric.data.percentage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAnalytics; 