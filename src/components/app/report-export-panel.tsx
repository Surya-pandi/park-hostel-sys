"use client";

import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Fragment, useMemo, useState } from "react";

import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEPARTMENTS, HOSTELS, REPORT_TYPES, YEARS } from "@/lib/constants";
import type { HostelName, ReportRow } from "@/lib/types";
import { downloadTextFile, formatDate } from "@/lib/utils";

type ReportExportPanelProps = {
  rows: ReportRow[];
  allowAllHostels?: boolean;
  hostelOptions?: HostelName[];
};

const ALL_HOSTELS = "All Hostels";
const ALL_DEPARTMENTS = "All Departments";

export function ReportExportPanel({
  rows,
  allowAllHostels = true,
  hostelOptions = [...HOSTELS],
}: ReportExportPanelProps) {
  const [type, setType] = useState("Daily");
  const [hostel, setHostel] = useState(allowAllHostels ? ALL_HOSTELS : hostelOptions[0] ?? HOSTELS[0]);
  const [department, setDepartment] = useState(ALL_DEPARTMENTS);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const scopedHostelMatch = hostelOptions.includes(row.hostel);
        const hostelMatch = allowAllHostels && hostel === ALL_HOSTELS ? true : row.hostel === hostel;
        const departmentMatch = department === ALL_DEPARTMENTS || row.department === department;
        return scopedHostelMatch && hostelMatch && departmentMatch;
      }),
    [allowAllHostels, department, hostel, hostelOptions, rows],
  );
  const rowsByYear = useMemo(
    () =>
      YEARS.map((year) => ({
        year,
        rows: filteredRows.filter((row) => row.year === year),
      })).filter((group) => group.rows.length > 0),
    [filteredRows],
  );

  function toMatrix() {
    return filteredRows.map((row) => ({
      Date: formatDate(row.date),
      Student: row.studentName,
      Year: row.year,
      Department: row.department,
      Hostel: row.hostel,
      Room: row.roomNumber,
      Status: row.status,
      Percentage: row.percentage,
    }));
  }

  function exportCsv() {
    const matrix = toMatrix();
    const header = Object.keys(matrix[0] ?? { Date: "", Student: "", Year: "", Department: "", Hostel: "", Room: "", Status: "", Percentage: "" });
    const body = matrix.map((row) =>
      header.map((key) => JSON.stringify(row[key as keyof typeof row] ?? "")).join(","),
    );
    downloadTextFile(`pcet-${type.toLowerCase()}-attendance.csv`, [header.join(","), ...body].join("\n"), "text/csv");
  }

  function exportExcel() {
    const matrix = toMatrix();
    const headers = Object.keys(
      matrix[0] ?? { Date: "", Student: "", Year: "", Department: "", Hostel: "", Room: "", Status: "", Percentage: "" },
    );
    const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headers
      .map((header) => `<th>${escapeHtml(header)}</th>`)
      .join("")}</tr></thead><tbody>${matrix
      .map(
        (row) =>
          `<tr>${headers
            .map((header) => `<td>${escapeHtml(String(row[header as keyof typeof row] ?? ""))}</td>`)
            .join("")}</tr>`,
      )
      .join("")}</tbody></table></body></html>`;
    downloadTextFile(
      `pcet-${type.toLowerCase()}-attendance.xls`,
      html,
      "application/vnd.ms-excel;charset=utf-8",
    );
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.text(`PCET Hostel Attendance - ${type}`, 14, 16);
    autoTable(doc, {
      startY: 24,
      head: [["Date", "Student", "Year", "Department", "Hostel", "Room", "Status", "%"]],
      body: filteredRows.map((row) => [
        formatDate(row.date),
        row.studentName,
        row.year,
        row.department,
        row.hostel,
        row.roomNumber,
        row.status,
        row.percentage,
      ]),
      styles: { fontSize: 8 },
    });
    doc.save(`pcet-${type.toLowerCase()}-attendance.pdf`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Reports</CardTitle>
        <CardDescription>
          {allowAllHostels
            ? "Filter by period, hostel, and department; export CSV, Excel, or PDF."
            : "Filter by period and department for the assigned hostel; export CSV, Excel, or PDF."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="type">Report type</Label>
            <Select id="type" value={type} onChange={(event) => setType(event.target.value)}>
              {REPORT_TYPES.map((reportType) => (
                <option key={reportType} value={reportType}>
                  {reportType}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hostel">Hostel</Label>
            <Select id="hostel" value={hostel} onChange={(event) => setHostel(event.target.value)}>
              {allowAllHostels ? <option>{ALL_HOSTELS}</option> : null}
              {hostelOptions.map((hostelName) => (
                <option key={hostelName} value={hostelName}>
                  {hostelName}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              id="department"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            >
              <option>{ALL_DEPARTMENTS}</option>
              {DEPARTMENTS.map((departmentName) => (
                <option key={departmentName} value={departmentName}>
                  {departmentName}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-2 min-[420px]:grid-cols-3 sm:flex sm:flex-wrap">
          <Button type="button" variant="outline" onClick={exportCsv} disabled={!filteredRows.length}>
            <Download className="size-4" />
            CSV
          </Button>
          <Button type="button" variant="outline" onClick={exportExcel} disabled={!filteredRows.length}>
            <FileSpreadsheet className="size-4" />
            Excel
          </Button>
          <Button type="button" variant="outline" onClick={exportPdf} disabled={!filteredRows.length}>
            <FileText className="size-4" />
            PDF
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Hostel</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowsByYear.map((group) => (
              <Fragment key={group.year}>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 dark:bg-slate-900/70 dark:hover:bg-slate-900/70">
                  <TableCell colSpan={7} className="py-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    {group.year} Year - {group.rows.length} {group.rows.length === 1 ? "student" : "students"}
                  </TableCell>
                </TableRow>
                {group.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.studentName}</TableCell>
                    <TableCell>{row.year}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{row.hostel}</TableCell>
                    <TableCell>{row.roomNumber}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-right">{row.percentage}</TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
            {!filteredRows.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-500">
                  No report rows found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
