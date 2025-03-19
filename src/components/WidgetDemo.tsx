import React, { useState } from 'react';
import TimeTrackerWidget from './TimeTrackerWidget';
import TimeTrackerAdminWidget from './TimeTrackerAdminWidget';
import { Shield, User, Clock, Users, Calendar, Search } from 'lucide-react';

const WidgetDemo: React.FC = () => {
  const [userType, setUserType] = useState<'employee' | 'admin'>('employee');

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Time Tracker Widget Demo</h1>
        
        {/* User Type Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Select User Type</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setUserType('employee')}
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center ${
                userType === 'employee' 
                  ? 'bg-[#9A00FF] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <User className="mr-2" size={20} />
              Employee View
            </button>
            <button
              onClick={() => setUserType('admin')}
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center ${
                userType === 'admin' 
                  ? 'bg-[#9A00FF] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Shield className="mr-2" size={20} />
              Admin View
            </button>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">How to Use the Widget</h2>
          
          {userType === 'employee' ? (
            <div className="space-y-4">
              <p className="text-gray-700">
                The employee time tracker widget provides a convenient way for users to track their work time without navigating to the full dashboard.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Features:</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>The timer is always visible in the bottom-right corner when you're checked in</li>
                  <li>Quick access buttons for pause/resume and stop are available next to the timer</li>
                  <li>Click the purple clock icon to expand the full widget</li>
                  <li>Check in to start tracking your time</li>
                  <li>Pause or stop your work session as needed</li>
                  <li>View your current session time and when screenshots were taken</li>
                  <li>Access the full dashboard for more detailed information</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-700 mb-2">Widget Elements:</h3>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-green-600 text-white px-3 py-2 rounded-lg flex items-center">
                    <Clock size={16} className="mr-2" />
                    <span className="font-bold">00:05:30</span>
                  </div>
                  <span className="text-blue-700">← Active timer (green when active, amber when paused)</span>
                </div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex space-x-1">
                    <div className="bg-amber-500 text-white rounded-full w-10 h-10 flex items-center justify-center">
                      <span className="font-bold">II</span>
                    </div>
                    <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center">
                      <span className="font-bold">■</span>
                    </div>
                  </div>
                  <span className="text-blue-700">← Quick action buttons (pause/resume and stop)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-[#9A00FF] text-white rounded-full w-10 h-10 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <span className="text-blue-700">← Main widget button (click to expand/collapse)</span>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-700 mb-2">Integration Instructions:</h3>
                <p className="text-blue-600 text-sm">
                  To add this widget to your application, import and include the <code className="bg-blue-100 px-1 rounded">TimeTrackerWidget</code> component in your layout or page component:
                </p>
                <pre className="bg-gray-800 text-gray-100 p-3 rounded mt-2 text-sm overflow-x-auto">
                  {`import TimeTrackerWidget from './components/TimeTrackerWidget';

// In your layout component
return (
  <div>
    {/* Your page content */}
    <TimeTrackerWidget />
  </div>
);`}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700">
                The admin time tracker widget allows administrators to quickly monitor employee activity without navigating to the full dashboard.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Features:</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>Active employee count and total hours are always visible in the bottom-right corner</li>
                  <li>Quick refresh button to update the data without expanding the widget</li>
                  <li>Click the purple users icon to expand the full widget</li>
                  <li>View a summary of active employees, total hours, and screenshots</li>
                  <li>Toggle between three views: Active Now, All Sessions, and User Summary</li>
                  <li>Filter sessions by date and search for specific employees</li>
                  <li>See all user sessions and screenshots for comprehensive monitoring</li>
                  <li>View user summaries with total time tracked and screenshots taken</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-700 mb-2">Widget Elements:</h3>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-[#9A00FF] text-white px-3 py-2 rounded-lg flex items-center">
                    <div className="flex items-center mr-3">
                      <User size={14} className="mr-1" />
                      <span className="font-bold">3</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      <span className="font-bold">05:45</span>
                    </div>
                  </div>
                  <span className="text-blue-700">← Status display (active employees and total hours)</span>
                </div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-gray-100 text-gray-700 rounded-full w-10 h-10 flex items-center justify-center">
                    <span className="font-bold">↻</span>
                  </div>
                  <span className="text-blue-700">← Refresh button (updates data without expanding)</span>
                </div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-[#9A00FF] text-white rounded-full w-10 h-10 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <span className="text-blue-700">← Main widget button (click to expand/collapse)</span>
                </div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex border-b w-full">
                    <div className="flex-1 py-2 text-sm font-medium text-[#9A00FF] border-b-2 border-[#9A00FF] text-center">Active Now</div>
                    <div className="flex-1 py-2 text-sm font-medium text-gray-500 text-center">All Sessions</div>
                    <div className="flex-1 py-2 text-sm font-medium text-gray-500 text-center">User Summary</div>
                  </div>
                  <span className="text-blue-700 hidden">← View tabs (switch between different data views)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center bg-gray-50 p-2 rounded-lg w-full">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700">Date filter</span>
                    <div className="ml-auto flex space-x-2">
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">Yesterday</span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">Today</span>
                    </div>
                  </div>
                  <span className="text-blue-700 hidden">← Date filter (view data for specific dates)</span>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-700 mb-2">View Modes:</h3>
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div className="bg-white p-3 rounded border">
                    <h4 className="text-sm font-medium mb-1">Active Now</h4>
                    <p className="text-xs text-gray-600">Shows currently active employees with their session times and screenshot counts</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <h4 className="text-sm font-medium mb-1">All Sessions</h4>
                    <p className="text-xs text-gray-600">Shows all sessions for the selected date, including completed ones</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <h4 className="text-sm font-medium mb-1">User Summary</h4>
                    <p className="text-xs text-gray-600">Shows aggregated data per user with total time and screenshots</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-700 mb-2">Integration Instructions:</h3>
                <p className="text-blue-600 text-sm">
                  To add this widget to your admin application, import and include the <code className="bg-blue-100 px-1 rounded">TimeTrackerAdminWidget</code> component in your layout or page component:
                </p>
                <pre className="bg-gray-800 text-gray-100 p-3 rounded mt-2 text-sm overflow-x-auto">
                  {`import TimeTrackerAdminWidget from './components/TimeTrackerAdminWidget';

// In your admin layout component
return (
  <div>
    {/* Your admin page content */}
    <TimeTrackerAdminWidget />
  </div>
);`}
                </pre>
              </div>
            </div>
          )}
        </div>
        
        {/* Demo Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Demo Content</h2>
          <p className="text-gray-700 mb-4">
            This is a demo page showing how the time tracker widget would appear in your application. 
            The widget is fixed to the bottom-right corner of the screen.
          </p>
          
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <p className="text-gray-500 mb-4">Your application content would appear here</p>
            <p className="text-sm text-gray-400">
              Look for the {userType === 'employee' ? 'clock icon and timer' : 'users icon and status display'} in the bottom-right corner
            </p>
          </div>
        </div>
      </div>
      
      {/* Render the appropriate widget based on user type */}
      {userType === 'employee' ? <TimeTrackerWidget /> : <TimeTrackerAdminWidget />}
    </div>
  );
};

export default WidgetDemo; 