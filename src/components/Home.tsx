import React from 'react';
import { Calendar, Package, BarChart3, Bot, ChefHat, Dumbbell, CheckSquare, Sparkles, Clock, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import podoLogo from '../assets/podo_logo.png';

const Home: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <Package className="w-8 h-8" />,
      title: 'My Objects',
      description: 'Create and manage your recipes, workouts, and todo lists in one organized place.',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-600'
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: 'My Week',
      description: 'Plan your weekly schedule with time-based organization and smart scheduling.',
      color: 'bg-brand-50 border-brand-200 text-brand-600'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'My Analytics',
      description: 'Track your progress and get insights into your habits and achievements.',
      color: 'bg-purple-50 border-purple-200 text-purple-600'
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: 'AI Assistant',
      description: 'Get personalized help creating content and organizing your schedule.',
      color: 'bg-amber-50 border-amber-200 text-amber-600'
    }
  ];

  const quickActions = [
    {
      icon: <ChefHat className="w-6 h-6" />,
      title: 'Create Recipe',
      description: 'Add a new recipe to your collection',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      icon: <Dumbbell className="w-6 h-6" />,
      title: 'Plan Workout',
      description: 'Design your next fitness routine',
      color: 'bg-brand hover:bg-brand-hover'
    },
    {
      icon: <CheckSquare className="w-6 h-6" />,
      title: 'Add Todo List',
      description: 'Organize your tasks and goals',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Schedule Items',
      description: 'Plan your week ahead',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ];

  const getCurrentTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-4 mb-6">
          <img 
            src={podoLogo} 
            alt="Podo Logo" 
            className="h-20 w-20 object-cover rounded-full border-2 border-gray-200 shadow-sm"
          />
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome to Podo
          </h1>
        </div>
        
        {user ? (
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-800">
              {getCurrentTimeGreeting()}, {user.name}! 👋
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ready to organize your life? Let's make today productive and meaningful.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-800">
              Your Personal Life Organizer
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Streamline your recipes, workouts, and tasks with AI-powered assistance and smart weekly planning.
            </p>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <div key={index} className="card card-interactive p-6">
            <div className="flex items-start gap-4">
              <div className={`icon-container ${feature.color}`}>
                {feature.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {user && (
        <>
          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Quick Actions
              </h3>
              <p className="text-gray-600">
                Jump right into creating and organizing
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className={`${action.color} text-white p-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 group`}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-white bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all">
                      {action.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{action.title}</h4>
                      <p className="text-sm opacity-90">{action.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="icon-container bg-brand-50 border-brand-200 text-brand-600">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Your Progress
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-brand mb-1">0</div>
                <div className="text-sm text-gray-600">Objects Created</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-brand mb-1">0</div>
                <div className="text-sm text-gray-600">Items Scheduled</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-brand mb-1">0</div>
                <div className="text-sm text-gray-600">Tasks Completed</div>
              </div>
            </div>
          </div>
        </>
      )}

      {!user && (
        /* Getting Started for Non-Authenticated Users */
        <div className="card p-8 text-center">
          <div className="space-y-6">
            <div className="icon-container bg-brand-50 border-brand-200 text-brand-600 mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Ready to Get Started?
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create an account to start organizing your recipes, workouts, and tasks with the power of AI assistance.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Takes less than 2 minutes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          💡 Pro Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Use the AI Assistant</h4>
            <p className="text-sm text-blue-700">
              Ask the AI to create recipes, workouts, or todo lists for you. It can even schedule them automatically!
            </p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Plan Your Week</h4>
            <p className="text-sm text-green-700">
              Drag and drop items into different time slots to create the perfect weekly schedule.
            </p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Track Progress</h4>
            <p className="text-sm text-purple-700">
              Check off completed exercises and tasks to see your progress over time.
            </p>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-900 mb-2">Export Your Data</h4>
            <p className="text-sm text-amber-700">
              Keep your data safe by regularly exporting backups from the Data Manager.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 