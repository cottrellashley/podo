// Shared types for the Weekly Planner application

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  estimatedCost?: number; // For analytics
}

export interface FoodRecipe {
  id: string;
  type: 'recipe';
  title: string;
  ingredients: Ingredient[];
  instructions: string[];
  createdAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  completed?: boolean;
}

export interface Workout {
  id: string;
  type: 'workout';
  title: string;
  bodyGroup?: string;
  exercises: Exercise[];
  notes?: string;
  createdAt: Date;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TodoList {
  id: string;
  type: 'todoList';
  title: string;
  items: TodoItem[];
  createdAt: Date;
}

export interface IndividualTodo {
  id: string;
  type: 'individualTodo';
  text: string;
  completed: boolean;
  createdAt: Date;
}

export type ObjectType = FoodRecipe | Workout | TodoList;
export type SchedulableItem = FoodRecipe | Workout | TodoList | IndividualTodo;

// Legacy type for backward compatibility
export type TimeCategory = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

// New custom time section types
export interface TimeSection {
  id: string;
  name: string;
  startTime: string; // Format: "HH:mm" (24-hour format)
  endTime: string;   // Format: "HH:mm" (24-hour format)
  color?: string;    // Optional custom color
  order: number;     // For ordering sections
  createdAt: Date;
}

export interface ScheduledItem {
  id: string;
  objectId: string;
  objectType: SchedulableItem['type'];
  date: string; // YYYY-MM-DD format
  time: string; // Format: "HH:mm" (24-hour format) - replaces timeCategory
  timeCategory?: TimeCategory; // Keep for backward compatibility
  order: number; // For ordering within time section
  data: SchedulableItem; // Full object data for easy access
}

export interface WeekData {
  [date: string]: ScheduledItem[];
}

// Analytics types
export interface ShoppingListItem {
  name: string;
  totalAmount: number;
  unit: string;
  estimatedCost: number;
}

export interface WorkoutStats {
  totalWorkouts: number;
  daysWithWorkouts: number;
  totalExercises: number;
}

export interface TodoStats {
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  completionPercentage: number;
} 