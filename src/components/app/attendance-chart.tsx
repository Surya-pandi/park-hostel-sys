"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AttendanceSeriesPoint, DepartmentAnalytics, HostelAnalytics } from "@/lib/types";

type AttendanceChartProps = {
  data: AttendanceSeriesPoint[];
};

export function AttendanceChart({ data }: AttendanceChartProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="h-60 min-w-80 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -12, right: 8, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="present"
              stroke="#2563eb"
              fill="url(#presentGradient)"
              strokeWidth={2}
            />
            <Area type="monotone" dataKey="late" stroke="#f59e0b" fill="#f59e0b22" strokeWidth={2} />
            <Area type="monotone" dataKey="absent" stroke="#e11d48" fill="#e11d4822" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function HostelBarChart({ data }: { data: HostelAnalytics[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="h-64 min-w-[520px] sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -10, right: 8, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="hostel" tickLine={false} axisLine={false} interval={0} height={70} tick={{ fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="presentToday" name="Present" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="absentToday" name="Absent" fill="#f43f5e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DepartmentBarChart({ data }: { data: DepartmentAnalytics[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="h-64 min-w-[720px] sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -10, right: 8, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="department" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="attendanceRate" name="Attendance %" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
