import React, { useState } from 'react';
import TimeTrackerAdmin from './TimeTrackerAdmin';
import { Users, Clock, Settings, BarChart2, Shield } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timetracker' | 'employees' | 'settings'>('overview');

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Shield className="text-[#9A00FF] mr-3" size={28} />
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto">
        <button
          className={`px-4 py-2 font-medium flex items-center whitespace-nowrap ${
            activeTab === 'overview'
              ? 'text-[#9A00FF] border-b-2 border-[#9A00FF]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart2 className="mr-2" size={18} />
          Overview
        </button>
        <button
          className={`px-4 py-2 font-medium flex items-center whitespace-nowrap ${
            activeTab === 'timetracker'
              ? 'text-[#9A00FF] border-b-2 border-[#9A00FF]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('timetracker')}
        >
          <Clock className="mr-2" size={18} />
          Time Tracking
        </button>
        <button
          className={`px-4 py-2 font-medium flex items-center whitespace-nowrap ${
            activeTab === 'employees'
              ? 'text-[#9A00FF] border-b-2 border-[#9A00FF]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('employees')}
        >
          <Users className="mr-2" size={18} />
          Employees
        </button>
        <button
          className={`px-4 py-2 font-medium flex items-center whitespace-nowrap ${
            activeTab === 'settings'
              ? 'text-[#9A00FF] border-b-2 border-[#9A00FF]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings className="mr-2" size={18} />
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Active Employees</h2>
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <Users className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-3xl font-bold">0</p>
                  <p className="text-sm text-gray-500">Currently working</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Total Hours Today</h2>
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Clock className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-3xl font-bold">0:00</p>
                  <p className="text-sm text-gray-500">Hours tracked</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Screenshots Today</h2>
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <Shield className="text-[#9A00FF]" size={24} />
                </div>
                <div>
                  <p className="text-3xl font-bold">0</p>
                  <p className="text-sm text-gray-500">Captured today</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Average Activity</h2>
              <div className="flex items-center">
                <div className="bg-amber-100 p-3 rounded-full mr-4">
                  <BarChart2 className="text-amber-600" size={24} />
                </div>
                <div>
                  <p className="text-3xl font-bold">0%</p>
                  <p className="text-sm text-gray-500">Activity level</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timetracker' && <TimeTrackerAdmin />}

        {activeTab === 'employees' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Employee Management</h2>
            <p className="text-gray-500">Employee management features will be available soon.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Time Tracking Settings</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium mb-2">Screenshot Settings</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="font-medium">Screenshot Frequency</p>
                      <p className="text-sm text-gray-500">How often screenshots are taken</p>
                    </div>
                    <select className="border border-gray-300 rounded-md px-3 py-2">
                      <option value="1-5">Random (1-5 minutes)</option>
                      <option value="5-10">Random (5-10 minutes)</option>
                      <option value="10-15">Random (10-15 minutes)</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Blur Screenshots</p>
                      <p className="text-sm text-gray-500">Blur sensitive information</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9A00FF]"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">Work Hours</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="font-medium">Work Schedule</p>
                      <p className="text-sm text-gray-500">Define working hours</p>
                    </div>
                    <div className="flex space-x-2">
                      <input type="time" className="border border-gray-300 rounded-md px-3 py-2" defaultValue="09:00" />
                      <span className="self-center">to</span>
                      <input type="time" className="border border-gray-300 rounded-md px-3 py-2" defaultValue="17:00" />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Weekend Tracking</p>
                      <p className="text-sm text-gray-500">Allow tracking on weekends</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9A00FF]"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button className="bg-[#9A00FF] text-white px-4 py-2 rounded-lg shadow hover:bg-[#8400d6] transition">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 