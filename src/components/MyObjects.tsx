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
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            {/* Modal Header */}
            <div className="modal-header">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getObjectColor(activeSection)} shadow-sm`}>
                    <div className="w-4 h-4 flex items-center justify-center">
                      {getObjectIcon(activeSection)}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      {editingObject ? 'Edit' : 'Create'} {activeSection.slice(0, -1)}
                    </h2>
                    <p className="text-caption mt-0.5">
                      {editingObject ? 'Update your existing item' : `Add a new ${activeSection.slice(0, -1).toLowerCase()}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                  style={{ minHeight: '36px', minWidth: '36px' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="modal-body">
                {/* Title Section */}
                <div className="form-group">
                  <div className="flex items-center gap-1.5">
                    <label className="form-label">Title</label>
                    <span className="text-red-500 text-xs">*</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="input-field"
                      placeholder={`Enter ${activeSection.slice(0, -1).toLowerCase()} title...`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${formData.title.trim() ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                  </div>
                </div>

                {/* Recipe Form */}
                {activeSection === 'recipes' && (
                  <div className="space-compact">
                    {/* Ingredients Section */}
                    <div className="form-section">
                      <div className="section-header-compact">
                        <ChefHat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="section-title-compact">Ingredients</h3>
                        <button
                          type="button"
                          onClick={addIngredient}
                          className="section-add-button"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-compact-sm">
                        {formData.ingredients.map((ingredient, index) => (
                          <div key={ingredient.id} className="dynamic-list-item">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                                {index + 1}
                              </div>
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  value={ingredient.name}
                                  onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
                                  placeholder="Ingredient"
                                  className="input-field text-sm"
                                />
                                <input
                                  type="number"
                                  value={ingredient.amount}
                                  onChange={(e) => updateIngredient(ingredient.id, 'amount', parseFloat(e.target.value) || 0)}
                                  placeholder="Amount"
                                  className="input-field text-sm"
                                  min="0"
                                  step="0.1"
                                />
                                <input
                                  type="text"
                                  value={ingredient.unit}
                                  onChange={(e) => updateIngredient(ingredient.id, 'unit', e.target.value)}
                                  placeholder="Unit"
                                  className="input-field text-sm"
                                />
                              </div>
                              {formData.ingredients.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeIngredient(ingredient.id)}
                                  className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                  style={{ minHeight: '44px', minWidth: '44px' }}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Instructions Section */}
                    <div className="form-section">
                      <div className="section-header-compact">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h3 className="section-title-compact">Instructions</h3>
                        <button
                          type="button"
                          onClick={addInstruction}
                          className="section-add-button"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-compact-sm">
                        {formData.instructions.map((instruction, index) => (
                          <div key={index} className="dynamic-list-item">
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <textarea
                                  value={instruction}
                                  onChange={(e) => updateInstruction(index, e.target.value)}
                                  placeholder="Describe this step..."
                                  className="input-field resize-none text-sm"
                                  rows={2}
                                />
                              </div>
                              {formData.instructions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeInstruction(index)}
                                  className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 self-start"
                                  style={{ minHeight: '44px', minWidth: '44px' }}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Workout Form */}
                {activeSection === 'workouts' && (
                  <div className="space-compact">
                    {/* Body Group */}
                    <div className="form-group">
                      <label className="form-label">
                        Body Group <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.bodyGroup}
                        onChange={(e) => setFormData(prev => ({ ...prev, bodyGroup: e.target.value }))}
                        className="input-field"
                        placeholder="e.g., Upper Body, Legs, Core..."
                      />
                    </div>

                    {/* Exercises Section */}
                    <div className="form-section">
                      <div className="section-header-compact">
                        <Dumbbell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h3 className="section-title-compact">Exercises</h3>
                        <button
                          type="button"
                          onClick={addExercise}
                          className="section-add-button"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-compact-sm">
                        {formData.exercises.map((exercise, index) => (
                          <div key={exercise.id} className="dynamic-list-item">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                                {index + 1}
                              </div>
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  value={exercise.name}
                                  onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                                  placeholder="Exercise name"
                                  className="input-field text-sm"
                                />
                                <input
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                                  placeholder="Sets"
                                  className="input-field text-sm"
                                  min="1"
                                />
                                <input
                                  type="number"
                                  value={exercise.reps}
                                  onChange={(e) => updateExercise(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                                  placeholder="Reps"
                                  className="input-field text-sm"
                                  min="1"
                                />
                              </div>
                              {formData.exercises.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeExercise(exercise.id)}
                                  className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                  style={{ minHeight: '44px', minWidth: '44px' }}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div className="form-group">
                      <label className="form-label">
                        Notes <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="input-field resize-none"
                        rows={3}
                        placeholder="Additional notes about this workout..."
                      />
                    </div>
                  </div>
                )}

                {/* Todo List Form */}
                {activeSection === 'todoLists' && (
                  <div className="form-section">
                    <div className="section-header-compact">
                      <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <h3 className="section-title-compact">Tasks</h3>
                      <button
                        type="button"
                        onClick={addTodoItem}
                        className="section-add-button"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-compact-sm">
                      {formData.todoItems.map((item, index) => (
                        <div key={item.id} className="dynamic-list-item">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                              {index + 1}
                            </div>
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) => updateTodoItem(item.id, 'text', e.target.value)}
                              placeholder="Enter task description..."
                              className="flex-1 input-field text-sm"
                            />
                            {formData.todoItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTodoItem(item.id)}
                                className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                style={{ minHeight: '44px', minWidth: '44px' }}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 button-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrUpdateObject}
                  className="flex-1 button-primary"
                  disabled={!formData.title.trim()}
                >
                  {editingObject ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyObjects; 