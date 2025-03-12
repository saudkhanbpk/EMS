import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function SalesChart({ activeTab, data }: { activeTab: string, data: { name: string; value: number }[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Attendance Overview</h2>
      </div>

      <div className="h-[300px]">
        <ChartContent data={data} activeTab={activeTab} />
      </div>
    </div>
  );
}

function ChartContent({ data, activeTab }: { data: { name: string; value: number }[], activeTab: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `${value}`} // ✅ Fix: Remove $ sign
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            border: "none",
          }}
          formatter={(value) => [`${value} Days`, activeTab === "daily" ? "Check-ins" : "Attendance"]}
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
          stroke="#7E69AB"
          fillOpacity={1}
          fill="url(#colorValue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
