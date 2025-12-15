import {
  type User,
  type InsertUser,
  type Employee,
  type InsertEmployee,
  type AttendanceRecord,
  type InsertAttendance,
  type DashboardStats,
  type AttendanceWithEmployee,
  users,
  employees,
  attendanceRecords
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;
  getEmployeeByEmbedding(embedding: string): Promise<Employee | undefined>;

  getAllAttendanceRecords(): Promise<AttendanceRecord[]>;
  getAttendanceByDate(date: string): Promise<AttendanceWithEmployee[]>;
  getRecentAttendance(limit: number): Promise<AttendanceWithEmployee[]>;
  getAttendanceByEmployee(employeeId: string, date: string): Promise<AttendanceRecord | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<AttendanceRecord>;
  updateAttendance(id: string, attendance: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined>;
  getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceWithEmployee[]>;

  getDashboardStats(date: string): Promise<DashboardStats>;
  getWeeklyStats(startDate: string, endDate: string): Promise<Array<{ date: string; present: number; late: number; absent: number }>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    await db.insert(users).values({ ...insertUser, id }).$returningId();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user!;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return db.select().from(employees);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.email, email));
    return employee;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    await db.insert(employees).values({ ...insertEmployee, id }).$returningId();
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee!;
  }

  async updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee | undefined> {
    await db
      .update(employees)
      .set(updates)
      .where(eq(employees.id, id))
      .execute();
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    await db.delete(attendanceRecords).where(eq(attendanceRecords.employeeId, id)).execute();
    await db.delete(employees).where(eq(employees.id, id)).execute();
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee === undefined;
  }

  private parseEmbedding(value?: string | null): number[] | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(Number) : null;
    } catch {
      return null;
    }
  }

  private euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) return Number.POSITIVE_INFINITY;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const d = a[i] - b[i];
      sum += d * d;
    }
    return Math.sqrt(sum);
  }

  async getEmployeeByEmbedding(embedding: string): Promise<Employee | undefined> {
    const target = this.parseEmbedding(embedding);
    if (!target) return undefined;

    const candidates = await db.select().from(employees);
    let best: { employee: Employee; distance: number } | null = null;
    const THRESHOLD = 0.6;

    for (const emp of candidates) {
      const emb = this.parseEmbedding(emp.faceEmbedding);
      if (!emb) continue;
      const dist = this.euclideanDistance(target, emb);
      if (dist <= THRESHOLD && (!best || dist < best.distance)) {
        best = { employee: emp, distance: dist };
      }
    }

    return best?.employee;
  }

  async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
    return db.select().from(attendanceRecords);
  }

  async getAttendanceByDate(date: string): Promise<AttendanceWithEmployee[]> {
    const records = await db
      .select()
      .from(attendanceRecords)
      .innerJoin(employees, eq(attendanceRecords.employeeId, employees.id))
      .where(eq(attendanceRecords.date, date));

    return records.map(r => ({
      ...r.attendance_records,
      employee: r.employees
    }));
  }

  async getRecentAttendance(limit: number): Promise<AttendanceWithEmployee[]> {
    const records = await db
      .select()
      .from(attendanceRecords)
      .innerJoin(employees, eq(attendanceRecords.employeeId, employees.id))
      .orderBy(desc(attendanceRecords.date), desc(attendanceRecords.checkIn))
      .limit(limit);

    return records.map(r => ({
      ...r.attendance_records,
      employee: r.employees
    }));
  }

  async getAttendanceByEmployee(employeeId: string, date: string): Promise<AttendanceRecord | undefined> {
    const [record] = await db
      .select()
      .from(attendanceRecords)
      .where(and(eq(attendanceRecords.employeeId, employeeId), eq(attendanceRecords.date, date)));
    return record;
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<AttendanceRecord> {
    const id = randomUUID();
    await db.insert(attendanceRecords).values({ ...insertAttendance, id }).$returningId();
    const [record] = await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id));
    return record!;
  }

  async updateAttendance(id: string, updates: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined> {
    await db
      .update(attendanceRecords)
      .set(updates)
      .where(eq(attendanceRecords.id, id))
      .execute();
    const [record] = await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id));
    return record;
  }

  async getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceWithEmployee[]> {
    const records = await db
      .select()
      .from(attendanceRecords)
      .innerJoin(employees, eq(attendanceRecords.employeeId, employees.id))
      .where(and(
        gte(attendanceRecords.date, startDate),
        lte(attendanceRecords.date, endDate)
      ))
      .orderBy(desc(attendanceRecords.date));

    return records.map(r => ({
      ...r.attendance_records,
      employee: r.employees
    }));
  }

  async getDashboardStats(date: string): Promise<DashboardStats> {
    const allEmployees = await db.select().from(employees);
    const totalEmployees = allEmployees.length;

    const todayRecords = await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.date, date));

    const presentToday = todayRecords.filter(r => r.status === "present" || r.status === "late").length;
    const lateArrivals = todayRecords.filter(r => r.status === "late").length;
    const absences = totalEmployees - presentToday;
    const onTimeCount = todayRecords.filter(r => r.status === "present").length;
    const onTimePercentage = presentToday > 0
      ? Math.round((onTimeCount / presentToday) * 100)
      : 0;

    return {
      presentToday,
      lateArrivals,
      absences,
      onTimePercentage
    };
  }

  async getWeeklyStats(startDate: string, endDate: string): Promise<Array<{ date: string; present: number; late: number; absent: number }>> {
    const allEmployees = await db.select().from(employees);
    const totalEmployees = allEmployees.length;

    const records = await db
      .select()
      .from(attendanceRecords)
      .where(and(
        gte(attendanceRecords.date, startDate),
        lte(attendanceRecords.date, endDate)
      ));

    const statsByDate = new Map<string, { present: number; late: number; absent: number }>();

    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      statsByDate.set(dateStr, { present: 0, late: 0, absent: totalEmployees });
    }

    records.forEach(r => {
      const stats = statsByDate.get(r.date);
      if (stats) {
        if (r.status === "present") {
          stats.present++;
          stats.absent--;
        } else if (r.status === "late") {
          stats.late++;
          stats.absent--;
        }
      }
    });

    return Array.from(statsByDate.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

async function initializeDatabase() {
  const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));

  if (existingAdmin.length === 0) {
    const adminId = randomUUID();
    await db.insert(users).values({
      id: adminId,
      username: "admin",
      password: "admin123",
      role: "admin"
    });

    const sampleEmployees: Omit<Employee, 'id'>[] = [
      {
        firstName: "Maria",
        lastName: "Garcia",
        email: "maria.garcia@empresa.com",
        department: "Recursos Humanos",
        position: "Gerente de RH",
        photoUrl: null,
        faceEmbedding: JSON.stringify("sample_embedding_1"),
        status: "active"
      },
      {
        firstName: "Carlos",
        lastName: "Rodriguez",
        email: "carlos.rodriguez@empresa.com",
        department: "Tecnologia",
        position: "Desarrollador Senior",
        photoUrl: null,
        faceEmbedding: JSON.stringify("sample_embedding_2"),
        status: "active"
      },
      {
        firstName: "Ana",
        lastName: "Martinez",
        email: "ana.martinez@empresa.com",
        department: "Ventas",
        position: "Ejecutiva de Ventas",
        photoUrl: null,
        faceEmbedding: JSON.stringify("sample_embedding_3"),
        status: "active"
      },
      {
        firstName: "Juan",
        lastName: "Lopez",
        email: "juan.lopez@empresa.com",
        department: "Finanzas",
        position: "Contador",
        photoUrl: null,
        faceEmbedding: null,
        status: "active"
      },
      {
        firstName: "Sofia",
        lastName: "Hernandez",
        email: "sofia.hernandez@empresa.com",
        department: "Marketing",
        position: "Diseñadora Grafica",
        photoUrl: null,
        faceEmbedding: JSON.stringify("sample_embedding_5"),
        status: "active"
      },
    ];

    const employeeIds: string[] = [];
    for (const emp of sampleEmployees) {
      const id = randomUUID();
      employeeIds.push(id);
      await db.insert(employees).values({ ...emp, id });
    }

    const today = new Date().toISOString().split('T')[0];
    const attendanceData = [
      { employeeId: employeeIds[0], date: today, checkIn: "08:45", checkOut: null, status: "present", confidence: 0.95 },
      { employeeId: employeeIds[1], date: today, checkIn: "09:15", checkOut: null, status: "late", confidence: 0.92 },
      { employeeId: employeeIds[2], date: today, checkIn: "08:30", checkOut: "17:30", status: "present", confidence: 0.98 },
      { employeeId: employeeIds[3], date: today, checkIn: null, checkOut: null, status: "absent", confidence: null },
      { employeeId: employeeIds[4], date: today, checkIn: "08:55", checkOut: null, status: "present", confidence: 0.89 },
    ];

    for (const att of attendanceData) {
      await db.insert(attendanceRecords).values({ ...att, id: randomUUID() });
    }

    console.log("Database initialized with sample data");
  }
}

export const storage = new DatabaseStorage();

initializeDatabase().catch(console.error);
