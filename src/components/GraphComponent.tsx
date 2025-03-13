import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function SalesChart({ activeTab, data }: { activeTab: string, data: { name: string; value: number }[] }) {
  // Get appropriate title based on active tab
  const getChartTitle = () => {
    switch (activeTab) {
      case 'daily':
        return 'Daily Attendance';
      case 'weekly':
        return 'Weekly Attendance';
      case 'monthly':
        return 'Monthly Attendance';
      default:
        return 'Attendance Overview';
    }
  };

  // Get appropriate description based on active tab
  const getDescription = () => {
    switch (activeTab) {
      case 'daily':
        return 'Number of check-ins throughout the day';
      case 'weekly':
        return 'Attendance pattern across the week';
      case 'monthly':
        return 'Monthly attendance overview';
      default:
        return 'Attendance data visualization';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{getChartTitle()}</h2>
        <p className="text-sm text-gray-500 mt-1">{getDescription()}</p>
      </div>

      <div className="h-[300px]">
        <ChartContent data={data} activeTab={activeTab} />
      </div>
    </div>
  );
}

function ChartContent({ data, activeTab }: { data: { name: string; value: number }[], activeTab: string }) {
  // Get appropriate label for the tooltip based on active tab
  const getTooltipLabel = () => {
    switch (activeTab) {
      case 'daily':
        return 'Check-ins';
      case 'weekly':
        return 'Days';
      case 'monthly':
        return 'Days';
      default:
        return 'Attendance';
    }
  };

  // Get appropriate x-axis label based on active tab
  const getXAxisLabel = () => {
    switch (activeTab) {
      case 'daily':
        return 'Time';
      case 'weekly':
        return 'Day';
      case 'monthly':
        return 'Date';
      default:
        return '';
    }
  };

  // Get appropriate legend name based on active tab
  const getLegendName = () => {
    switch (activeTab) {
      case 'daily':
        return 'Daily Check-ins';
      case 'weekly':
        return 'Weekly Attendance';
      case 'monthly':
        return 'Monthly Attendance';
      default:
        return 'Attendance';
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          label={{ value: getXAxisLabel(), position: 'insideBottomRight', offset: -5 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `${value}`}
          label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "none",
          }}
          formatter={(value) => [`${value}`, getTooltipLabel()]}
          labelFormatter={(label) => {
            if (activeTab === 'daily') return `Time: ${label}`;
            if (activeTab === 'weekly') return `Day: ${label}`;
            return `Date: ${label}`;
          }}
        />
        <Legend 
          verticalAlign="top" 
          height={36}
          formatter={() => getLegendName()}
        />
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7E69AB" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#7E69AB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          name={getLegendName()}
          stroke="#7E69AB"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorValue)"
          activeDot={{ r: 6, strokeWidth: 0, fill: "#7E69AB" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
