import React, { useState } from 'react';
import { Package, Calendar, BarChart3, Bot, Menu, X, Home as HomeIcon, User } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { DarkModeProvider } from './context/DarkModeContext';
import Home from './components/Home';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import MyObjects from './components/MyObjects';
import MyWeek from './components/MyWeek';
import MyAnalytics from './components/MyAnalytics';
import MyAssistant from './components/MyAssistant';
import DataManager from './components/DataManager';
import podoLogo from './assets/podo_logo.png';

type TabType = 'home' | 'objects' | 'week' | 'analytics' | 'assistant' | 'profile';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  requiresAuth?: boolean;
}

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showDataManager, setShowDataManager] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <img 
            src={podoLogo} 
            alt="Podo Logo" 
            className="h-20 w-20 object-cover rounded-full border-2 border-gray-200 shadow-sm mx-auto mb-4"
          />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  const tabs: Tab[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <HomeIcon className="w-4 h-4" />,
      component: <Home onNavigate={(tab) => handleTabClick(tab)} />
    },
    {
      id: 'objects',
      label: 'Library',
      icon: <Package className="w-4 h-4" />,
      component: <MyObjects onOpenDataManager={() => setShowDataManager(true)} />,
      requiresAuth: true
    },
    {
      id: 'week',
      label: 'My Week',
      icon: <Calendar className="w-4 h-4" />,
      component: <MyWeek onOpenDataManager={() => setShowDataManager(true)} />,
      requiresAuth: true
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      component: <MyAnalytics />,
      requiresAuth: true
    },
    {
      id: 'assistant',
      label: 'Assistant',
      icon: <Bot className="w-4 h-4" />,
      component: <MyAssistant />,
      requiresAuth: true
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    // Remove the automatic sidebar closing - let user control it manually
  };

  const renderTabContent = () => {
    if (activeTab === 'profile') {
      return <UserProfile />;
    }
    return activeTabData?.component;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex relative transition-colors">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-50 ${
        sidebarOpen 
          ? 'fixed lg:relative sidebar-compact h-full lg:h-auto' 
          : 'w-0 lg:w-0'
      } overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="sidebar-header-compact flex items-center justify-between">
          <button
            onClick={() => handleTabClick('home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img 
              src={podoLogo} 
              alt="Podo Logo" 
              className="h-7 w-7 object-cover rounded-full border border-gray-200 dark:border-gray-600"
            />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Podo</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav-compact">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                handleTabClick(tab.id);
                // Close sidebar on mobile after navigation
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              className={`sidebar-nav-item ${
                activeTab === tab.id ? 'active' : 'inactive'
              }`}
            >
              <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                {tab.icon}
              </div>
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* User Section */}
        {user && (
          <div className="sidebar-user-compact">
            <button
              onClick={() => {
                handleTabClick('profile');
                // Close sidebar on mobile after navigation
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              className={`sidebar-user-button ${
                activeTab === 'profile' ? 'ring-1 ring-brand' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Hamburger Menu */}
        <header className="bg-white dark:bg-gray-800 header-compact border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between h-full">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page Title */}
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {activeTab === 'profile' ? 'Profile' : activeTabData?.label}
            </h2>

            {/* Spacer */}
            <div className="w-8"></div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="content-container-compact">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* Data Manager Modal */}
      <DataManager
        isOpen={showDataManager}
        onClose={() => setShowDataManager(false)}
        currentTab={activeTab as 'objects' | 'week' | 'analytics' | 'assistant'}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          <DarkModeProvider>
            <AppContent />
          </DarkModeProvider>
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
