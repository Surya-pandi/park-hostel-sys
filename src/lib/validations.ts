import { z } from "zod";

import {
  BLOOD_GROUPS,
  DEPARTMENTS,
  EXPORT_FORMATS,
  HOSTELS,
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
