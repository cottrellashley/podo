import React, { useState } from 'react';
import { Plus, Search, Package, ChefHat, Dumbbell, CheckSquare, X, Trash2, Edit, Database, FileText } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import type { ObjectType, FoodRecipe, Workout, TodoList, Ingredient, Exercise, TodoItem } from '../types';

interface MyObjectsProps {
  onOpenDataManager: () => void;
}

const MyObjects: React.FC<MyObjectsProps> = ({ onOpenDataManager }) => {
  const { objects, addObject, updateObject, deleteObject } = useAppContext();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<'recipes' | 'workouts' | 'todoLists'>('recipes');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingObject, setEditingObject] = useState<ObjectType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');


  // Form states
  const [formData, setFormData] = useState({
    title: '',
    bodyGroup: '',
    notes: '',
    ingredients: [{ id: '1', name: '', amount: 1, unit: '' }] as Ingredient[],
    instructions: [''] as string[],
    exercises: [{ id: '1', name: '', sets: 1, reps: 1 }] as Exercise[],
    todoItems: [{ id: '1', text: '', completed: false }] as TodoItem[]
  });

  const resetForm = () => {
    setFormData({
      title: '',
      bodyGroup: '',
      notes: '',
      ingredients: [{ id: '1', name: '', amount: 1, unit: '' }],
      instructions: [''],
      exercises: [{ id: '1', name: '', sets: 1, reps: 1 }],
      todoItems: [{ id: '1', text: '', completed: false }]
    });
    setEditingObject(null);
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Ingredient management
  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { id: generateId(), name: '', amount: 1, unit: '' }]
    }));
  };

  const removeIngredient = (id: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(ing => ing.id !== id)
    }));
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(ing => 
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    }));
  };

  // Instruction management
  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }));
  };

  // Exercise management
  const addExercise = () => {
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, { id: generateId(), name: '', sets: 1, reps: 1 }]
    }));
  };

  const removeExercise = (id: string) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== id)
    }));
  };

  const updateExercise = (id: string, field: keyof Exercise, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    }));
  };

  // Todo item management
  const addTodoItem = () => {
    setFormData(prev => ({
      ...prev,
      todoItems: [...prev.todoItems, { id: generateId(), text: '', completed: false }]
    }));
  };

  const removeTodoItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      todoItems: prev.todoItems.filter(item => item.id !== id)
    }));
  };

  const updateTodoItem = (id: string, field: keyof TodoItem, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      todoItems: prev.todoItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleCreateOrUpdateObject = async () => {
    if (!formData.title.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const baseObject = {
        id: editingObject?.id || generateId(),
        title: formData.title,
        createdAt: editingObject?.createdAt || new Date()
      };

      let newObject: ObjectType;

      switch (activeSection) {
        case 'recipes':
          newObject = {
            ...baseObject,
            type: 'recipe',
            ingredients: formData.ingredients.filter(ing => ing.name.trim()),
            instructions: formData.instructions.filter(inst => inst.trim())
          } as FoodRecipe;
          break;
        case 'workouts':
          newObject = {
            ...baseObject,
            type: 'workout',
            bodyGroup: formData.bodyGroup || undefined,
            exercises: formData.exercises.filter(ex => ex.name.trim()),
            notes: formData.notes || undefined
          } as Workout;
          break;
        case 'todoLists':
          newObject = {
            ...baseObject,
            type: 'todoList',
            items: formData.todoItems.filter(item => item.text.trim())
          } as TodoList;
          break;
        default:
          return;
      }

      if (editingObject) {
        await updateObject(editingObject.id, newObject);
      } else {
        await addObject(newObject);
      }

      setShowCreateModal(false);
      resetForm();
      showToast('Object saved successfully', 'success');
    } catch (err) {
      console.error('Error saving object:', err);
      setError('Failed to save object. Please try again.');
      showToast('Failed to save object. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditObject = (object: ObjectType) => {
    setEditingObject(object);
    setActiveSection(object.type === 'todoList' ? 'todoLists' : object.type === 'recipe' ? 'recipes' : 'workouts');
    
    if (object.type === 'recipe') {
      const recipe = object as FoodRecipe;
      setFormData({
        title: recipe.title,
        bodyGroup: '',
        notes: '',
        ingredients: recipe.ingredients.length > 0 ? recipe.ingredients : [{ id: '1', name: '', amount: 1, unit: '' }],
        instructions: recipe.instructions.length > 0 ? recipe.instructions : [''],
        exercises: [{ id: '1', name: '', sets: 1, reps: 1 }],
        todoItems: [{ id: '1', text: '', completed: false }]
      });
    } else if (object.type === 'workout') {
      const workout = object as Workout;
      setFormData({
        title: workout.title,
        bodyGroup: workout.bodyGroup || '',
        notes: workout.notes || '',
        ingredients: [{ id: '1', name: '', amount: 1, unit: '' }],
        instructions: [''],
        exercises: workout.exercises.length > 0 ? workout.exercises : [{ id: '1', name: '', sets: 1, reps: 1 }],
        todoItems: [{ id: '1', text: '', completed: false }]
      });
    } else if (object.type === 'todoList') {
      const todoList = object as TodoList;
      setFormData({
        title: todoList.title,
        bodyGroup: '',
        notes: '',
        ingredients: [{ id: '1', name: '', amount: 1, unit: '' }],
        instructions: [''],
        exercises: [{ id: '1', name: '', sets: 1, reps: 1 }],
        todoItems: todoList.items.length > 0 ? todoList.items : [{ id: '1', text: '', completed: false }]
      });
    }
    
    setShowCreateModal(true);
  };

  const filteredObjects = objects.filter(obj => {
    const matchesSection = 
      (activeSection === 'recipes' && obj.type === 'recipe') ||
      (activeSection === 'workouts' && obj.type === 'workout') ||
      (activeSection === 'todoLists' && obj.type === 'todoList');
    
    const matchesSearch = obj.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSection && matchesSearch;
  });

  const getObjectIcon = (type: string) => {
    switch (type) {
      case 'recipe':
        return <ChefHat className="w-5 h-5" />;
      case 'workout':
        return <Dumbbell className="w-5 h-5" />;
      case 'todoList':
        return <CheckSquare className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getObjectColor = (type: string) => {
    switch (type) {
      case 'recipe':
        return 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400';
      case 'workout':
        return 'bg-brand-50 border-brand-200 text-brand-600';
      case 'todoList':
        return 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-400';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="section-header">
        <div>
          <h2 className="text-heading">Library</h2>
          <p className="text-body mt-1">Manage your recipes, workouts, and todo lists</p>
        </div>
        <div className="mobile-flex">
          <button 
            onClick={onOpenDataManager}
            className="button-secondary flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Data Manager</span>
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="button-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="tab-nav-container">
        <div className="tab-nav-card">
          <div className="tab-nav-buttons">
            {[
              { id: 'recipes', label: 'Recipes', icon: <ChefHat className="w-4 h-4" /> },
              { id: 'workouts', label: 'Workouts', icon: <Dumbbell className="w-4 h-4" /> },
              { id: 'todoLists', label: 'Todo Lists', icon: <CheckSquare className="w-4 h-4" /> }
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
                  <span className="text-sm">{section.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder={`Search ${activeSection}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Objects Grid */}
      <div className="mobile-grid">
        {filteredObjects.map((object) => (
          <div key={object.id} className="card card-interactive p-3">
            <div className="flex items-start justify-between mb-2.5">
              <div className={`icon-container ${getObjectColor(object.type)}`}>
                {getObjectIcon(object.type)}
              </div>
              <div className="flex gap-0.5">
                <button
                  onClick={() => handleEditObject(object)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors rounded-lg"
                  style={{ minHeight: '36px', minWidth: '36px' }}
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteObject(object.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors rounded-lg"
                  style={{ minHeight: '36px', minWidth: '36px' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <h3 className="text-subheading mb-1.5">{object.title}</h3>
            
            {object.type === 'recipe' && (
              <div className="space-compact-sm">
                <p className="text-caption">
                  {(object as FoodRecipe).ingredients.length} ingredients
                </p>
                <p className="text-caption">
                  {(object as FoodRecipe).instructions.length} steps
                </p>
              </div>
            )}
            
            {object.type === 'workout' && (
              <div className="space-compact-sm">
                <p className="text-caption">
                  {(object as Workout).exercises.length} exercises
                </p>
                {(object as Workout).bodyGroup && (
                  <p className="text-caption">
                    Target: {(object as Workout).bodyGroup}
                  </p>
                )}
              </div>
            )}
            
            {object.type === 'todoList' && (
              <div className="space-compact-sm">
                <p className="text-caption">
                  {(object as TodoList).items.length} tasks
                </p>
                <p className="text-caption">
                  {(object as TodoList).items.filter(item => item.completed).length} completed
                </p>
              </div>
            )}
            
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-caption">
                Created {object.createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredObjects.length === 0 && (
        <div className="text-center py-8">
          <div className={`icon-container ${getObjectColor(activeSection === 'todoLists' ? 'todoList' : activeSection.slice(0, -1))} mx-auto mb-3`}>
            {activeSection === 'recipes' && <ChefHat className="w-6 h-6" />}
            {activeSection === 'workouts' && <Dumbbell className="w-6 h-6" />}
            {activeSection === 'todoLists' && <CheckSquare className="w-6 h-6" />}
          </div>
          <h3 className="text-subheading mb-2">No {activeSection} yet</h3>
          <p className="text-body mb-4">Create your first {activeSection.slice(0, -1)} to get started</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="button-primary"
          >
            Create {activeSection.slice(0, -1)}
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                  activeSection === 'recipes' 
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                    : activeSection === 'workouts'
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                    : 'bg-gradient-to-br from-purple-500 to-pink-600'
                }`}>
                  <div className="text-white">
                    {getObjectIcon(activeSection)}
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {editingObject ? 'Edit' : 'Create'} {activeSection.slice(0, -1)}
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {editingObject ? 'Update your existing item' : `Add a new ${activeSection.slice(0, -1).toLowerCase()}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(92vh-120px)]">
              <div className="space-y-3">
                {/* Title Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder={`Enter ${activeSection.slice(0, -1).toLowerCase()} title...`}
                  />
                </div>

                {/* Recipe Form */}
                {activeSection === 'recipes' && (
                  <div className="space-y-3">
                    {/* Ingredients Section */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Ingredients</h3>
                        <button
                          type="button"
                          onClick={addIngredient}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition-colors dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {formData.ingredients.map((ingredient, index) => (
                          <div key={ingredient.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-md flex items-center justify-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              {index + 1}
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                              <input
                                type="text"
                                value={ingredient.name}
                                onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
                                placeholder="Ingredient"
                                className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              />
                              <input
                                type="number"
                                value={ingredient.amount}
                                onChange={(e) => updateIngredient(ingredient.id, 'amount', parseFloat(e.target.value) || 0)}
                                placeholder="Amount"
                                className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                min="0"
                                step="0.1"
                              />
                              <input
                                type="text"
                                value={ingredient.unit}
                                onChange={(e) => updateIngredient(ingredient.id, 'unit', e.target.value)}
                                placeholder="Unit"
                                className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              />
                            </div>
                            {formData.ingredients.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeIngredient(ingredient.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Instructions Section */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Instructions</h3>
                        <button
                          type="button"
                          onClick={addInstruction}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {formData.instructions.map((instruction, index) => (
                          <div key={index} className="flex gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400 flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <textarea
                                value={instruction}
                                onChange={(e) => updateInstruction(index, e.target.value)}
                                placeholder="Describe this step..."
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                                rows={2}
                              />
                            </div>
                            {formData.instructions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeInstruction(index)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors self-start"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Workout Form */}
                {activeSection === 'workouts' && (
                  <div className="space-y-3">
                    {/* Body Group */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Body Group <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.bodyGroup}
                        onChange={(e) => setFormData(prev => ({ ...prev, bodyGroup: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="e.g., Upper Body, Legs, Core..."
                      />
                    </div>

                    {/* Exercises Section */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Exercises</h3>
                        <button
                          type="button"
                          onClick={addExercise}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {formData.exercises.map((exercise, index) => (
                          <div key={exercise.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                              {index + 1}
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                              <input
                                type="text"
                                value={exercise.name}
                                onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                                placeholder="Exercise name"
                                className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              />
                              <input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                                placeholder="Sets"
                                className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                min="1"
                              />
                              <input
                                type="number"
                                value={exercise.reps}
                                onChange={(e) => updateExercise(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                                placeholder="Reps"
                                className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                min="1"
                              />
                            </div>
                            {formData.exercises.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeExercise(exercise.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                        rows={2}
                        placeholder="Additional notes about this workout..."
                      />
                    </div>
                  </div>
                )}

                {/* Todo List Form */}
                {activeSection === 'todoLists' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Tasks</h3>
                      <button
                        type="button"
                        onClick={addTodoItem}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition-colors dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {formData.todoItems.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-md flex items-center justify-center text-xs font-medium text-purple-600 dark:text-purple-400">
                            {index + 1}
                          </div>
                          <input
                            type="text"
                            value={item.text}
                            onChange={(e) => updateTodoItem(item.id, 'text', e.target.value)}
                            placeholder="Enter task description..."
                            className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                          {formData.todoItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTodoItem(item.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrUpdateObject}
                className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!formData.title.trim()}
              >
                {editingObject ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyObjects; 