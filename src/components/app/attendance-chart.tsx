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
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
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
  );
}

export function HostelBarChart({ data }: { data: HostelAnalytics[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="hostel" tickLine={false} axisLine={false} interval={0} height={70} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="presentToday" name="Present" fill="#10b981" radius={[6, 6, 0, 0]} />
          <Bar dataKey="absentToday" name="Absent" fill="#f43f5e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DepartmentBarChart({ data }: { data: DepartmentAnalytics[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="department" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="attendanceRate" name="Attendance %" fill="#2563eb" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
