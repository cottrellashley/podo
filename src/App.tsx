import React, { useState } from 'react';
import { Package, Calendar, BarChart3, Bot, Menu, X, Home as HomeIcon, User, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
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
  const { user, isAuthenticated, isLoading, logout } = useAuth();
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
      icon: <HomeIcon className="w-6 h-6" />,
      component: <Home />
    },
    {
      id: 'objects',
      label: 'My Objects',
      icon: <Package className="w-6 h-6" />,
      component: <MyObjects onOpenDataManager={() => setShowDataManager(true)} />,
      requiresAuth: true
    },
    {
      id: 'week',
      label: 'My Week',
      icon: <Calendar className="w-6 h-6" />,
      component: <MyWeek onOpenDataManager={() => setShowDataManager(true)} />,
      requiresAuth: true
    },
    {
      id: 'analytics',
      label: 'My Analytics',
      icon: <BarChart3 className="w-6 h-6" />,
      component: <MyAnalytics />,
      requiresAuth: true
    },
    {
      id: 'assistant',
      label: 'My Assistant',
      icon: <Bot className="w-6 h-6" />,
      component: <MyAssistant />,
      requiresAuth: true
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    setSidebarOpen(false); // Close sidebar when tab is selected
  };

  const handleLogout = () => {
    logout();
    setActiveTab('home');
    setSidebarOpen(false);
  };

  const renderTabContent = () => {
    if (activeTab === 'profile') {
      return <UserProfile />;
    }
    return activeTabData?.component;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100">
          <div className="flex items-center justify-center w-full">
            <img 
              src={podoLogo} 
              alt="Podo Logo" 
              className="h-12 w-12 object-cover rounded-full border-2 border-gray-200 shadow-sm"
            />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 text-left rounded-xl font-medium transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-brand text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* User Section */}
        {user && (
          <div className="border-t border-gray-200 p-4 space-y-2">
            {/* User Info */}
            <div className="px-4 py-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* User Actions */}
            <button
              onClick={() => handleTabClick('profile')}
              className={`w-full flex items-center gap-4 px-4 py-3 text-left rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'profile' 
                  ? 'bg-brand text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 text-left rounded-xl font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Hamburger Menu */}
        <header className="bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page Title */}
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === 'profile' ? 'Profile' : activeTabData?.label}
            </h2>

            {/* Spacer */}
            <div className="w-10"></div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {renderTabContent()}
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
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
