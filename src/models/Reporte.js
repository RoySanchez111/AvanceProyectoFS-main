const db = require("../config/db");

class Reporte {
  static async create(userId, data) {
    const { area, supervisor, correo, telefono, actividades, impacto, mejoras, autoevaluacion, comentarios } = data;
    
    const sql = `
      INSERT INTO reportes_medio_termino 
      (user_id, area, supervisor, correo, telefono, actividades, impacto, mejoras, autoevaluacion, comentarios) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(sql, [
      userId, area, supervisor, correo, telefono, actividades, impacto, mejoras, autoevaluacion, comentarios || null
    ]);
    
    return result.insertId;
  }


  // 👇 Agrega esto debajo de tus funciones create y getAll
  static async getByIdWithProfile(reportId) {
    const sql = `
      SELECT r.*, u.email, d.nombre AS nombre_alumno, d.matricula, d.carrera 
      FROM reportes_medio_termino r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN datos_servicio d ON u.id = d.user_id
      WHERE r.id = ?
    `;
    const [rows] = await db.query(sql, [reportId]);
    return rows[0]; // Retornamos el reporte completo con los datos del alumno
  }


  static async getByUserId(userId) {
    const sql = `
      SELECT * FROM reportes_medio_termino 
      WHERE user_id = ? 
      ORDER BY fecha DESC
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows;
  }
  
  static async getAll() {
    const sql = `
      SELECT r.*, u.email 
      FROM reportes_medio_termino r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.fecha DESC
    `;
    const [rows] = await db.query(sql);
    return rows;
  }
}

module.exports = Reporte;