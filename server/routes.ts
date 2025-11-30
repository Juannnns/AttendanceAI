import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema, insertAttendanceSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          message: "Datos de login invalidos" 
        });
      }

      const { username, password } = result.data;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ 
          success: false, 
          message: "Usuario o contraseña incorrectos" 
        });
      }

      res.json({ 
        success: true, 
        token: `token_${user.id}_${Date.now()}`,
        user: { id: user.id, username: user.username, role: user.role }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error del servidor" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stats = await storage.getDashboardStats(today);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener estadisticas" });
    }
  });

  // Weekly stats for analytics charts
  app.get("/api/dashboard/weekly-stats", async (req, res) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      
      const stats = await storage.getWeeklyStats(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener estadisticas semanales" });
    }
  });

  // Monthly stats for analytics
  app.get("/api/dashboard/monthly-stats", async (req, res) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 29);
      
      const stats = await storage.getWeeklyStats(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener estadisticas mensuales" });
    }
  });

  // Attendance by date range
  app.get("/api/attendance/range", async (req, res) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Se requieren fechas de inicio y fin" });
      }
      
      const records = await storage.getAttendanceByDateRange(startDate, endDate);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener registros" });
    }
  });

  // Employees CRUD
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener empleados" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener empleado" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const result = insertEmployeeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Datos invalidos", 
          errors: result.error.errors 
        });
      }

      // Check for duplicate email
      const existing = await storage.getEmployeeByEmail(result.data.email);
      if (existing) {
        return res.status(409).json({ message: "Ya existe un empleado con ese correo" });
      }

      const employee = await storage.createEmployee(result.data);
      res.status(201).json(employee);
    } catch (error) {
      res.status(500).json({ message: "Error al crear empleado" });
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const partial = insertEmployeeSchema.partial().safeParse(req.body);
      if (!partial.success) {
        return res.status(400).json({ 
          message: "Datos invalidos", 
          errors: partial.error.errors 
        });
      }

      // Check for duplicate email if updating email
      if (partial.data.email) {
        const existing = await storage.getEmployeeByEmail(partial.data.email);
        if (existing && existing.id !== req.params.id) {
          return res.status(409).json({ message: "Ya existe un empleado con ese correo" });
        }
      }

      const updated = await storage.updateEmployee(req.params.id, partial.data);
      if (!updated) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar empleado" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEmployee(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar empleado" });
    }
  });

  // Attendance
  app.get("/api/attendance/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const records = await storage.getRecentAttendance(limit);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener registros" });
    }
  });

  app.get("/api/attendance", async (req, res) => {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const records = await storage.getAttendanceByDate(date);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener registros" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const result = insertAttendanceSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Datos invalidos", 
          errors: result.error.errors 
        });
      }

      // Check if employee exists
      const employee = await storage.getEmployee(result.data.employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Empleado no encontrado" });
      }

      const record = await storage.createAttendance(result.data);
      res.status(201).json(record);
    } catch (error) {
      res.status(500).json({ message: "Error al crear registro" });
    }
  });

  // Face recognition endpoint (simulated)
  app.post("/api/face/recognize", async (req, res) => {
    try {
      const { photo, timestamp } = req.body;
      
      if (!photo) {
        return res.status(400).json({ 
          success: false, 
          message: "No se recibio imagen" 
        });
      }

      // Simulate face recognition by randomly matching an employee with embedding
      const employees = await storage.getAllEmployees();
      const employeesWithEmbedding = employees.filter(e => e.faceEmbedding);
      
      if (employeesWithEmbedding.length === 0) {
        return res.json({
          success: false,
          message: "No hay empleados con registro facial en el sistema"
        });
      }

      // Simulate recognition - pick a random employee with embedding
      // In real implementation, this would call a Python microservice
      const randomIndex = Math.floor(Math.random() * employeesWithEmbedding.length);
      const matchedEmployee = employeesWithEmbedding[randomIndex];
      const confidence = 0.85 + Math.random() * 0.14; // Random confidence 85-99%

      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().slice(0, 5);
      
      // Check existing attendance for today
      const existingAttendance = await storage.getAttendanceByEmployee(
        matchedEmployee.id, 
        today
      );

      let attendance;
      let type: "check_in" | "check_out";

      if (!existingAttendance) {
        // First check-in of the day
        const isLate = currentTime > "09:00";
        attendance = await storage.createAttendance({
          employeeId: matchedEmployee.id,
          date: today,
          checkIn: currentTime,
          checkOut: null,
          status: isLate ? "late" : "present",
          confidence
        });
        type = "check_in";
      } else if (!existingAttendance.checkOut) {
        // Check-out
        attendance = await storage.updateAttendance(existingAttendance.id, {
          checkOut: currentTime
        });
        type = "check_out";
      } else {
        // Already checked in and out
        return res.json({
          success: false,
          message: `${matchedEmployee.firstName} ya registro entrada y salida hoy`
        });
      }

      res.json({
        success: true,
        employee: matchedEmployee,
        attendance,
        type,
        confidence,
        message: type === "check_in" 
          ? `Entrada registrada a las ${currentTime}` 
          : `Salida registrada a las ${currentTime}`
      });

    } catch (error) {
      console.error("Face recognition error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error en el reconocimiento facial" 
      });
    }
  });

  // Generate face embedding (simulated)
  app.post("/api/face/embedding", async (req, res) => {
    try {
      const { photo, employeeId } = req.body;

      if (!photo || !employeeId) {
        return res.status(400).json({ 
          success: false, 
          message: "Se requiere foto y ID del empleado" 
        });
      }

      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ 
          success: false, 
          message: "Empleado no encontrado" 
        });
      }

      // Simulate embedding generation
      // In real implementation, this would call a Python microservice
      const fakeEmbedding = `embedding_${employeeId}_${Date.now()}`;

      const updated = await storage.updateEmployee(employeeId, {
        faceEmbedding: fakeEmbedding,
        photoUrl: photo
      });

      res.json({
        success: true,
        employee: updated,
        message: "Embedding facial generado exitosamente"
      });

    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Error al generar embedding" 
      });
    }
  });

  return httpServer;
}
