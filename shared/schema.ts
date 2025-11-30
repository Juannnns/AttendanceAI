import { mysqlTable, text, varchar, real } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Employees table
export const employees = mysqlTable("employees", {
  id: varchar("id", { length: 36 }).primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  department: varchar("department", { length: 100 }).notNull(),
  position: varchar("position", { length: 100 }).notNull(),
  photoUrl: text("photo_url"),
  faceEmbedding: text("face_embedding"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

// Attendance records table
export const attendanceRecords = mysqlTable("attendance_records", {
  id: varchar("id", { length: 36 }).primaryKey(),
  employeeId: varchar("employee_id", { length: 36 }).notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  checkIn: varchar("check_in", { length: 20 }),
  checkOut: varchar("check_out", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().default("present"),
  confidence: real("confidence"),
});

export const insertAttendanceSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
});

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

// Login schema for validation
export const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Dashboard stats type
export type DashboardStats = {
  presentToday: number;
  lateArrivals: number;
  absences: number;
  onTimePercentage: number;
};

// Attendance with employee info
export type AttendanceWithEmployee = AttendanceRecord & {
  employee: Employee;
};
