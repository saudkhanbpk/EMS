import React, { useState } from 'react';
import TimeTracker from './TimeTracker';
import { Briefcase, Clock, BarChart2, List } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timetracker' | 'reports'>('overview');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Employee Dashboard</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium flex items-center ${
            activeTab === 'overview'
              ? 'text-[#9A00FF] border-b-2 border-[#9A00FF]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          <Briefcase className="mr-2" size={18} />
          Overview
        </button>
        <button
          className={`px-4 py-2 font-medium flex items-center ${
            activeTab === 'timetracker'
              ? 'text-[#9A00FF] border-b-2 border-[#9A00FF]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('timetracker')}
        >
          <Clock className="mr-2" size={18} />
          Time Tracker
        </button>
        <button
          className={`px-4 py-2 font-medium flex items-center ${
            activeTab === 'reports'
              ? 'text-[#9A00FF] border-b-2 border-[#9A00FF]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('reports')}
        >
          <BarChart2 className="mr-2" size={18} />
          Reports
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Today's Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hours Worked</span>
                  <span className="font-medium">0:00:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tasks Completed</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Not Checked In</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold mb-4">This Week</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hours Worked</span>
                  <span className="font-medium">0:00:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg. Daily Hours</span>
                  <span className="font-medium">0:00:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Productivity</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-[#9A00FF] h-2.5 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Upcoming Tasks</h2>
              <div className="space-y-2">
                <div className="flex items-center text-gray-500">
                  <List size={16} className="mr-2" />
                  <span>No upcoming tasks</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timetracker' && <TimeTracker />}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Reports</h2>
            <p className="text-gray-500">Reports will be available soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 