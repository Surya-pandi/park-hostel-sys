"use client";

import { useRouter } from "next/navigation";
import { Fragment, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";

import {
  createStudentByWardenAction,
  updateStudentDetailsAction,
} from "@/app/actions/students";
import { ManualAttendanceButton } from "@/components/app/manual-attendance-button";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  BLOOD_GROUPS,
  DEPARTMENTS,
  SHARING_OPTIONS,
  YEARS,
} from "@/lib/constants";
import type { ActionState, Student } from "@/lib/types";

const initialState: ActionState = { ok: false, message: "" };

type WardenStudentsTableProps = {
  students: Student[];
};

export function WardenStudentsTable({ students }: WardenStudentsTableProps) {
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const studentsByYear = YEARS.map((year) => ({
    year,
    students: students.filter((student) => student.year === year),
  })).filter((group) => group.students.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {students.length} {students.length === 1 ? "student" : "students"}
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => setIsAddingStudent((current) => !current)}
          aria-expanded={isAddingStudent}
          aria-controls="student-add-form"
        >
          {isAddingStudent ? <X className="size-4" /> : <Plus className="size-4" />}
          {isAddingStudent ? "Close" : "Add Student"}
        </Button>
      </div>

      {isAddingStudent ? (
        <div
          id="student-add-form"
          className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40 sm:p-4"
        >
          <StudentCreateForm />
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studentsByYear.map((group) => (
            <Fragment key={group.year}>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 dark:bg-slate-900/70 dark:hover:bg-slate-900/70">
                <TableCell colSpan={6} className="py-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  {group.year} Year - {group.students.length} {group.students.length === 1 ? "student" : "students"}
                </TableCell>
              </TableRow>
              {group.students.map((student) => {
                const isEditing = editingStudentId === student.id;

                return (
                  <Fragment key={student.id}>
                    <TableRow>
                      <TableCell>
                        <div className="font-medium">{student.fullName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{student.email}</div>
                      </TableCell>
                      <TableCell>{student.year}</TableCell>
                      <TableCell>{student.department}</TableCell>
                      <TableCell>{student.roomNumber}</TableCell>
                      <TableCell>
                        <StatusBadge status={student.todayStatus} />
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-72 flex-wrap items-start gap-2">
                          <ManualAttendanceButton
                            studentId={student.id}
                            studentName={student.fullName}
                            status={student.todayStatus}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant={isEditing ? "secondary" : "outline"}
                            onClick={() => setEditingStudentId(isEditing ? null : student.id)}
                            aria-expanded={isEditing}
                            aria-controls={`student-edit-${student.id}`}
                          >
                            <Pencil className="size-4" />
                            {isEditing ? "Editing" : "Edit"}
                          </Button>
                          <StudentDeleteForm student={student} />
                        </div>
                      </TableCell>
                    </TableRow>
                    {isEditing ? (
                      <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 dark:bg-slate-900/40 dark:hover:bg-slate-900/40">
                        <TableCell colSpan={6} id={`student-edit-${student.id}`}>
                          <StudentEditForm
                            student={student}
                            onCancel={() => setEditingStudentId(null)}
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </Fragment>
          ))}
          {!students.length ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-slate-500">
                No students found for this hostel.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

function StudentCreateForm() {
  const [state, setState] = useState<ActionState>(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setState(initialState);

    startTransition(async () => {
      try {
        const result = await createStudentByWardenAction(initialState, formData);
        setState(result);

        if (result.ok) {
          formRef.current?.reset();
        }
      } catch {
        setState({ ok: false, message: "Add student request failed. Refresh and try again." });
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Field className="md:col-span-2" id="new-fullName" label="Full Name">
        <Input id="new-fullName" name="fullName" required disabled={isPending} />
      </Field>
      <Field id="new-email" label="Email">
        <Input id="new-email" name="email" type="email" required disabled={isPending} />
      </Field>
      <Field id="new-admissionNo" label="Admission No">
        <Input id="new-admissionNo" name="admissionNo" disabled={isPending} />
      </Field>
      <Field id="new-dateOfBirth" label="Date of Birth">
        <Input id="new-dateOfBirth" name="dateOfBirth" type="date" required disabled={isPending} />
      </Field>
      <Field id="new-year" label="Year">
        <Select id="new-year" name="year" defaultValue={YEARS[0]} disabled={isPending}>
          {YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="new-department" label="Department">
        <Select id="new-department" name="department" defaultValue={DEPARTMENTS[0]} disabled={isPending}>
          {DEPARTMENTS.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="new-roomNumber" label="Room">
        <Input id="new-roomNumber" name="roomNumber" required disabled={isPending} />
      </Field>
      <Field id="new-sharing" label="Sharing">
        <Select id="new-sharing" name="sharing" defaultValue={SHARING_OPTIONS[2]} disabled={isPending}>
          {SHARING_OPTIONS.map((sharing) => (
            <option key={sharing} value={sharing}>
              {sharing}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="new-bloodGroup" label="Blood Group">
        <Select id="new-bloodGroup" name="bloodGroup" defaultValue="" required disabled={isPending}>
          <option value="" disabled>
            Select blood group
          </option>
          {BLOOD_GROUPS.map((bloodGroup) => (
            <option key={bloodGroup} value={bloodGroup}>
              {bloodGroup}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="new-studentPhone" label="Student Phone">
        <Input id="new-studentPhone" name="studentPhone" type="tel" required disabled={isPending} />
      </Field>
      <Field id="new-parentPhone" label="Parent Phone">
        <Input id="new-parentPhone" name="parentPhone" type="tel" required disabled={isPending} />
      </Field>
      <div className="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-4">
        <Button type="submit" size="sm" disabled={isPending}>
          <Plus className="size-4" />
          {isPending ? "Adding..." : "Add Student"}
        </Button>
        {state.message ? <FormMessage state={state} /> : null}
      </div>
    </form>
  );
}

function StudentEditForm({
  student,
  onCancel,
}: {
  student: Student;
  onCancel: () => void;
}) {
  const [state, setState] = useState<ActionState>(initialState);
  const [isPending, startTransition] = useTransition();
  const admissionNo = student.admissionNo === "-" ? "" : student.admissionNo;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setState(initialState);

    startTransition(async () => {
      try {
        setState(await updateStudentDetailsAction(initialState, formData));
      } catch {
        setState({ ok: false, message: "Save request failed. Refresh and try again." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 py-2 md:grid-cols-2 xl:grid-cols-4">
      <input type="hidden" name="studentId" value={student.id} />
      <Field className="md:col-span-2" id={`fullName-${student.id}`} label="Full Name">
        <Input
          id={`fullName-${student.id}`}
          name="fullName"
          defaultValue={student.fullName}
          required
          disabled={isPending}
        />
      </Field>
      <Field id={`email-${student.id}`} label="Email">
        <Input
          id={`email-${student.id}`}
          name="email"
          type="email"
          defaultValue={student.email}
          required
          disabled={isPending}
        />
      </Field>
      <Field id={`admissionNo-${student.id}`} label="Admission No">
        <Input
          id={`admissionNo-${student.id}`}
          name="admissionNo"
          defaultValue={admissionNo}
          disabled={isPending}
        />
      </Field>
      <Field id={`dateOfBirth-${student.id}`} label="Date of Birth">
        <Input
          id={`dateOfBirth-${student.id}`}
          name="dateOfBirth"
          type="date"
          defaultValue={student.dateOfBirth}
          required
          disabled={isPending}
        />
      </Field>
      <Field id={`year-${student.id}`} label="Year">
        <Select id={`year-${student.id}`} name="year" defaultValue={student.year} disabled={isPending}>
          {YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
      </Field>
      <Field id={`department-${student.id}`} label="Department">
        <Select
          id={`department-${student.id}`}
          name="department"
          defaultValue={student.department}
          disabled={isPending}
        >
          {DEPARTMENTS.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </Select>
      </Field>
      <Field id={`roomNumber-${student.id}`} label="Room">
        <Input
          id={`roomNumber-${student.id}`}
          name="roomNumber"
          defaultValue={student.roomNumber}
          required
          disabled={isPending}
        />
      </Field>
      <Field id={`sharing-${student.id}`} label="Sharing">
        <Select
          id={`sharing-${student.id}`}
          name="sharing"
          defaultValue={student.sharing}
          disabled={isPending}
        >
          {SHARING_OPTIONS.map((sharing) => (
            <option key={sharing} value={sharing}>
              {sharing}
            </option>
          ))}
        </Select>
      </Field>
      <Field id={`bloodGroup-${student.id}`} label="Blood Group">
        <Select
          id={`bloodGroup-${student.id}`}
          name="bloodGroup"
          defaultValue={student.bloodGroup ?? ""}
          required
          disabled={isPending}
        >
          <option value="" disabled>
            Select blood group
          </option>
          {BLOOD_GROUPS.map((bloodGroup) => (
            <option key={bloodGroup} value={bloodGroup}>
              {bloodGroup}
            </option>
          ))}
        </Select>
      </Field>
      <Field id={`studentPhone-${student.id}`} label="Student Phone">
        <Input
          id={`studentPhone-${student.id}`}
          name="studentPhone"
          type="tel"
          defaultValue={student.studentPhone}
          required
          disabled={isPending}
        />
      </Field>
      <Field id={`parentPhone-${student.id}`} label="Parent Phone">
        <Input
          id={`parentPhone-${student.id}`}
          name="parentPhone"
          type="tel"
          defaultValue={student.parentPhone}
          required
          disabled={isPending}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-4">
        <Button type="submit" size="sm" disabled={isPending}>
          <Save className="size-4" />
          {isPending ? "Saving..." : "Save"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={isPending}>
          <X className="size-4" />
          Cancel
        </Button>
        {state.message ? <FormMessage state={state} /> : null}
      </div>
    </form>
  );
}

function StudentDeleteForm({ student }: { student: Student }) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>(initialState);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!window.confirm(`Delete ${student.fullName} from Supabase?`)) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    setState(initialState);

    startTransition(async () => {
      try {
        const response = await fetch("/api/warden/students/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(Object.fromEntries(formData)),
        });
        const result = (await response.json()) as ActionState;

        setState(result);

        if (result.ok) {
          router.refresh();
        }
      } catch {
        setState({ ok: false, message: "Delete request failed. Refresh and try again." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <input type="hidden" name="studentId" value={student.id} />
      <Button
        type="submit"
        size="sm"
        variant="destructive"
        disabled={isPending}
      >
        <Trash2 className="size-4" />
        {isPending ? "Deleting..." : "Delete"}
      </Button>
      {state.message ? <FormMessage state={state} className="max-w-32 text-xs" /> : null}
    </form>
  );
}

function FormMessage({
  state,
  className = "text-sm",
}: {
  state: ActionState;
  className?: string;
}) {
  return (
    <p
      className={
        state.ok
          ? `${className} text-emerald-600 dark:text-emerald-300`
          : `${className} text-rose-600 dark:text-rose-300`
      }
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}

function Field({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
