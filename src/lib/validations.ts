import { z } from "zod";

import {
  BLOOD_GROUPS,
  DEPARTMENTS,
  EXPORT_FORMATS,
  FOOD_MENU_DAY_LABELS,
  FOOD_MENU_STATUSES,
  HOSTELS,
  LEAVE_STATUSES,
  REPORT_TYPES,
  SHARING_OPTIONS,
  YEARS,
} from "./constants";

const phoneSchema = z
  .string()
  .trim()
  .min(10, "Phone number must have at least 10 digits")
  .max(15, "Phone number is too long")
  .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number");

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");

const mealTextSchema = z
  .string()
  .trim()
  .min(2, "Enter the food items")
  .max(500, "Food item text is too long");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const studentRegistrationSchema = z.object({
  fullName: z.string().trim().min(3, "Full name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  year: z.enum(YEARS),
  department: z.enum(DEPARTMENTS),
  hostel: z.enum(HOSTELS),
  roomNumber: z.string().trim().min(1, "Room number is required"),
  sharing: z.enum(SHARING_OPTIONS),
  bloodGroup: z.enum(BLOOD_GROUPS),
  studentPhone: phoneSchema,
  parentPhone: phoneSchema,
});

export const reportRequestSchema = z.object({
  type: z.enum(REPORT_TYPES),
  hostel: z.enum(HOSTELS).or(z.literal("All Hostels")),
  department: z.enum(DEPARTMENTS).or(z.literal("All Departments")),
  fromDate: z.string().min(1),
  toDate: z.string().min(1),
  format: z.enum(EXPORT_FORMATS),
});

export const qrScanSchema = z.object({
  payload: z.string().min(20, "QR payload is required"),
});

export const leaveRequestSchema = z
  .object({
    fromDate: isoDateSchema,
    toDate: isoDateSchema,
    reason: z
      .string()
      .trim()
      .min(10, "Reason must be at least 10 characters")
      .max(1000, "Reason is too long"),
  })
  .refine((value) => value.toDate >= value.fromDate, {
    message: "To date must be after or same as from date",
    path: ["toDate"],
  });

export const leaveDecisionSchema = z.object({
  requestId: z.string().uuid("Leave request is invalid"),
  decision: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500, "Review note is too long").optional(),
});

export const leaveStatusSchema = z.enum(LEAVE_STATUSES);

export const foodMenuDaySchema = z.object({
  day: z.enum(FOOD_MENU_DAY_LABELS),
  date: isoDateSchema,
  breakfast: mealTextSchema,
  lunch: mealTextSchema,
  snacks: mealTextSchema,
  dinner: mealTextSchema,
});

export const foodMenuSchema = z.object({
  title: z.string().trim().max(120, "Menu title is too long").optional(),
  weekStart: isoDateSchema,
  days: z.array(foodMenuDaySchema).length(7, "A weekly menu must contain 7 days"),
});

export const foodMenuDecisionSchema = z.object({
  menuId: z.string().uuid("Food menu is invalid"),
  decision: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500, "Review note is too long").optional(),
});

export const foodMenuStatusSchema = z.enum(FOOD_MENU_STATUSES);
