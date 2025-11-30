import { 
  type User, 
  type InsertUser, 
  type Employee, 
  type InsertEmployee,
  type AttendanceRecord,
  type InsertAttendance,
  type DashboardStats,
  type AttendanceWithEmployee
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Employees
  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;
  getEmployeeByEmbedding(embedding: string): Promise<Employee | undefined>;
  
  // Attendance
  getAllAttendanceRecords(): Promise<AttendanceRecord[]>;
  getAttendanceByDate(date: string): Promise<AttendanceWithEmployee[]>;
  getRecentAttendance(limit: number): Promise<AttendanceWithEmployee[]>;
  getAttendanceByEmployee(employeeId: string, date: string): Promise<AttendanceRecord | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<AttendanceRecord>;
  updateAttendance(id: string, attendance: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined>;
  
  // Dashboard
  getDashboardStats(date: string): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private employees: Map<string, Employee>;
  private attendanceRecords: Map<string, AttendanceRecord>;

  constructor() {
    this.users = new Map();
    this.employees = new Map();
    this.attendanceRecords = new Map();
    
    // Create default admin user
    const adminId = randomUUID();
    this.users.set(adminId, {
      id: adminId,
      username: "admin",
      password: "admin123",
      role: "admin"
    });
    
    // Create sample employees
    this.seedSampleData();
  }

  private seedSampleData() {
    const sampleEmployees: Omit<Employee, 'id'>[] = [
      {
        firstName: "Maria",
        lastName: "Garcia",
        email: "maria.garcia@empresa.com",
        department: "Recursos Humanos",
        position: "Gerente de RH",
        photoUrl: null,
        faceEmbedding: "sample_embedding_1",
        status: "active"
      },
      {
        firstName: "Carlos",
        lastName: "Rodriguez",
        email: "carlos.rodriguez@empresa.com",
        department: "Tecnologia",
        position: "Desarrollador Senior",
        photoUrl: null,
        faceEmbedding: "sample_embedding_2",
        status: "active"
      },
      {
        firstName: "Ana",
        lastName: "Martinez",
        email: "ana.martinez@empresa.com",
        department: "Ventas",
        position: "Ejecutiva de Ventas",
        photoUrl: null,
        faceEmbedding: "sample_embedding_3",
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
        faceEmbedding: "sample_embedding_5",
        status: "active"
      },
    ];

    sampleEmployees.forEach(emp => {
      const id = randomUUID();
      this.employees.set(id, { ...emp, id });
    });

    // Create today's attendance records
    const today = new Date().toISOString().split('T')[0];
    const employeeIds = Array.from(this.employees.keys());
    
    // Employee 1: Present on time
    if (employeeIds[0]) {
      const id1 = randomUUID();
      this.attendanceRecords.set(id1, {
        id: id1,
        employeeId: employeeIds[0],
        date: today,
        checkIn: "08:45",
        checkOut: null,
        status: "present",
        confidence: 0.95
      });
    }

    // Employee 2: Late
    if (employeeIds[1]) {
      const id2 = randomUUID();
      this.attendanceRecords.set(id2, {
        id: id2,
        employeeId: employeeIds[1],
        date: today,
        checkIn: "09:15",
        checkOut: null,
        status: "late",
        confidence: 0.92
      });
    }

    // Employee 3: Present on time
    if (employeeIds[2]) {
      const id3 = randomUUID();
      this.attendanceRecords.set(id3, {
        id: id3,
        employeeId: employeeIds[2],
        date: today,
        checkIn: "08:30",
        checkOut: "17:30",
        status: "present",
        confidence: 0.98
      });
    }

    // Employee 4: Absent
    if (employeeIds[3]) {
      const id4 = randomUUID();
      this.attendanceRecords.set(id4, {
        id: id4,
        employeeId: employeeIds[3],
        date: today,
        checkIn: null,
        checkOut: null,
        status: "absent",
        confidence: null
      });
    }

    // Employee 5: Present
    if (employeeIds[4]) {
      const id5 = randomUUID();
      this.attendanceRecords.set(id5, {
        id: id5,
        employeeId: employeeIds[4],
        date: today,
        checkIn: "08:55",
        checkOut: null,
        status: "present",
        confidence: 0.89
      });
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, role: insertUser.role || "admin" };
    this.users.set(id, user);
    return user;
  }

  // Employees
  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(
      (emp) => emp.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const employee: Employee = { ...insertEmployee, id };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const existing = this.employees.get(id);
    if (!existing) return undefined;
    
    const updated: Employee = { ...existing, ...updates };
    this.employees.set(id, updated);
    return updated;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const existed = this.employees.has(id);
    this.employees.delete(id);
    // Also delete their attendance records
    for (const [recordId, record] of this.attendanceRecords.entries()) {
      if (record.employeeId === id) {
        this.attendanceRecords.delete(recordId);
      }
    }
    return existed;
  }

  async getEmployeeByEmbedding(embedding: string): Promise<Employee | undefined> {
    // In a real implementation, this would compare embeddings using cosine similarity
    // For now, we'll do a simple string match for demonstration
    return Array.from(this.employees.values()).find(
      (emp) => emp.faceEmbedding === embedding
    );
  }

  // Attendance
  async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values());
  }

  async getAttendanceByDate(date: string): Promise<AttendanceWithEmployee[]> {
    const records = Array.from(this.attendanceRecords.values())
      .filter((record) => record.date === date);
    
    return records.map(record => {
      const employee = this.employees.get(record.employeeId);
      return {
        ...record,
        employee: employee!
      };
    }).filter(r => r.employee);
  }

  async getRecentAttendance(limit: number): Promise<AttendanceWithEmployee[]> {
    const records = Array.from(this.attendanceRecords.values())
      .sort((a, b) => {
        // Sort by date descending, then by check-in time
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        const aTime = a.checkIn || "23:59";
        const bTime = b.checkIn || "23:59";
        return bTime.localeCompare(aTime);
      })
      .slice(0, limit);
    
    return records.map(record => {
      const employee = this.employees.get(record.employeeId);
      return {
        ...record,
        employee: employee!
      };
    }).filter(r => r.employee);
  }

  async getAttendanceByEmployee(employeeId: string, date: string): Promise<AttendanceRecord | undefined> {
    return Array.from(this.attendanceRecords.values()).find(
      (record) => record.employeeId === employeeId && record.date === date
    );
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<AttendanceRecord> {
    const id = randomUUID();
    const record: AttendanceRecord = { ...insertAttendance, id };
    this.attendanceRecords.set(id, record);
    return record;
  }

  async updateAttendance(id: string, updates: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined> {
    const existing = this.attendanceRecords.get(id);
    if (!existing) return undefined;
    
    const updated: AttendanceRecord = { ...existing, ...updates };
    this.attendanceRecords.set(id, updated);
    return updated;
  }

  // Dashboard
  async getDashboardStats(date: string): Promise<DashboardStats> {
    const todayRecords = await this.getAttendanceByDate(date);
    const totalEmployees = this.employees.size;
    
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
}

export const storage = new MemStorage();
