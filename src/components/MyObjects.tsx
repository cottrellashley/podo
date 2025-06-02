import React, { useState } from 'react';
import { Plus, Search, Package, ChefHat, Dumbbell, CheckSquare, X, Trash2, Edit, Database } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { ObjectType, FoodRecipe, Workout, TodoList, Ingredient, Exercise, TodoItem } from '../types';

interface MyObjectsProps {
  onOpenDataManager: () => void;
}

const MyObjects: React.FC<MyObjectsProps> = ({ onOpenDataManager }) => {
  const { objects, addObject, updateObject, deleteObject } = useAppContext();
  const [activeSection, setActiveSection] = useState<'recipes' | 'workouts' | 'todoLists'>('recipes');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingObject, setEditingObject] = useState<ObjectType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleCreateOrUpdateObject = () => {
    if (!formData.title.trim()) return;

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
      updateObject(editingObject.id, newObject);
    } else {
      addObject(newObject);
    }

    setShowCreateModal(false);
    resetForm();
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
        return 'bg-green-50 border-green-100 text-green-600';
      case 'workout':
        return 'bg-brand-50 border-brand-100 text-brand-600';
      case 'todoList':
        return 'bg-purple-50 border-purple-100 text-purple-600';
      default:
        return 'bg-gray-50 border-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-heading">My Objects</h2>
          <p className="text-body">Manage your recipes, workouts, and todo lists</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onOpenDataManager}
            className="button-secondary flex items-center gap-3"
          >
            <Database className="w-5 h-5" />
            <span>Data Manager</span>
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="button-primary flex items-center gap-3"
          >
            <Plus className="w-5 h-5" />
            <span>Create New</span>
          </button>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="card p-2">
        <div className="flex">
          {[
            { id: 'recipes', label: 'Recipes', icon: <ChefHat className="w-5 h-5" /> },
            { id: 'workouts', label: 'Workouts', icon: <Dumbbell className="w-5 h-5" /> },
            { id: 'todoLists', label: 'Todo Lists', icon: <CheckSquare className="w-5 h-5" /> }
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder={`Search ${activeSection}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-12"
        />
      </div>

      {/* Objects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredObjects.map((object) => (
          <div key={object.id} className="card card-interactive p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`icon-container ${getObjectColor(object.type)}`}>
                {getObjectIcon(object.type)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditObject(object)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteObject(object.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-subheading mb-3">{object.title}</h3>
            
            {object.type === 'recipe' && (
              <div className="space-y-2">
                <p className="text-caption">
                  {(object as FoodRecipe).ingredients.length} ingredients
                </p>
                <p className="text-caption">
                  {(object as FoodRecipe).instructions.length} steps
                </p>
              </div>
            )}
            
            {object.type === 'workout' && (
              <div className="space-y-2">
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
              <div className="space-y-2">
                <p className="text-caption">
                  {(object as TodoList).items.length} tasks
                </p>
                <p className="text-caption">
                  {(object as TodoList).items.filter(item => item.completed).length} completed
                </p>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-caption">
                Created {object.createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredObjects.length === 0 && (
        <div className="text-center py-12">
          <div className={`icon-container ${getObjectColor(activeSection === 'todoLists' ? 'todoList' : activeSection.slice(0, -1))} mx-auto mb-4`}>
            {activeSection === 'recipes' && <ChefHat className="w-8 h-8" />}
            {activeSection === 'workouts' && <Dumbbell className="w-8 h-8" />}
            {activeSection === 'todoLists' && <CheckSquare className="w-8 h-8" />}
          </div>
          <h3 className="text-subheading mb-2">No {activeSection} yet</h3>
          <p className="text-body mb-6">Create your first {activeSection.slice(0, -1)} to get started</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-subheading">
                  {editingObject ? 'Edit' : 'Create'} {activeSection.slice(0, -1)}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="input-field"
                    placeholder="Enter title..."
                  />
                </div>

                {/* Recipe Form */}
                {activeSection === 'recipes' && (
                  <>
                    {/* Ingredients */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Ingredients
                        </label>
                        <button
                          type="button"
                          onClick={addIngredient}
                          className="button-secondary text-sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Ingredient
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.ingredients.map((ingredient) => (
                          <div key={ingredient.id} className="flex gap-3">
                            <input
                              type="text"
                              value={ingredient.name}
                              onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
                              placeholder="Ingredient name"
                              className="input-field flex-1"
                            />
                            <input
                              type="number"
                              value={ingredient.amount}
                              onChange={(e) => updateIngredient(ingredient.id, 'amount', parseFloat(e.target.value) || 0)}
                              placeholder="Amount"
                              className="input-field w-24"
                              min="0"
                              step="0.1"
                            />
                            <input
                              type="text"
                              value={ingredient.unit}
                              onChange={(e) => updateIngredient(ingredient.id, 'unit', e.target.value)}
                              placeholder="Unit"
                              className="input-field w-24"
                            />
                            {formData.ingredients.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeIngredient(ingredient.id)}
                                className="p-3 text-red-500 hover:text-red-700"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Instructions */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Instructions
                        </label>
                        <button
                          type="button"
                          onClick={addInstruction}
                          className="button-secondary text-sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Step
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.instructions.map((instruction, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600">
                              {index + 1}
                            </div>
                            <textarea
                              value={instruction}
                              onChange={(e) => updateInstruction(index, e.target.value)}
                              placeholder="Describe this step..."
                              className="input-field flex-1 resize-none"
                              rows={2}
                            />
                            {formData.instructions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeInstruction(index)}
                                className="p-3 text-red-500 hover:text-red-700"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Workout Form */}
                {activeSection === 'workouts' && (
                  <>
                    {/* Body Group */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Body Group (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.bodyGroup}
                        onChange={(e) => setFormData(prev => ({ ...prev, bodyGroup: e.target.value }))}
                        className="input-field"
                        placeholder="e.g., Upper Body, Legs, Full Body..."
                      />
                    </div>

                    {/* Exercises */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Exercises
                        </label>
                        <button
                          type="button"
                          onClick={addExercise}
                          className="button-secondary text-sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Exercise
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.exercises.map((exercise) => (
                          <div key={exercise.id} className="flex gap-3">
                            <input
                              type="text"
                              value={exercise.name}
                              onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                              placeholder="Exercise name"
                              className="input-field flex-1"
                            />
                            <input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                              placeholder="Sets"
                              className="input-field w-20"
                              min="1"
                            />
                            <input
                              type="number"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                              placeholder="Reps"
                              className="input-field w-20"
                              min="1"
                            />
                            {formData.exercises.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeExercise(exercise.id)}
                                className="p-3 text-red-500 hover:text-red-700"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="input-field resize-none"
                        rows={3}
                        placeholder="Additional notes about this workout..."
                      />
                    </div>
                  </>
                )}

                {/* Todo List Form */}
                {activeSection === 'todoLists' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Tasks
                      </label>
                      <button
                        type="button"
                        onClick={addTodoItem}
                        className="button-secondary text-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formData.todoItems.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <input
                            type="text"
                            value={item.text}
                            onChange={(e) => updateTodoItem(item.id, 'text', e.target.value)}
                            placeholder="Task description"
                            className="input-field flex-1"
                          />
                          {formData.todoItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTodoItem(item.id)}
                              className="p-3 text-red-500 hover:text-red-700"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="button-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateOrUpdateObject}
                    className="button-primary flex-1"
                    disabled={!formData.title.trim()}
                  >
                    {editingObject ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyObjects; 