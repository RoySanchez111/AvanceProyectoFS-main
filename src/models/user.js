const db = require("../config/db");
const bcrypt = require("bcryptjs");

class User {
  static async findByEmail(email) {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
  }

  static async create(email, password, role = "alumno") {
    // 🛡️ Encriptar la contraseña antes de guardar
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [email, hashedPassword, role]
    );
    return result.insertId;
  }

  static async createProfile(userId, profileData) {
    const { nombre, matricula, carrera, telefono, institucion, inicio, termino, horas } = profileData;
    const sql = `
            INSERT INTO datos_servicio 
            (user_id, nombre, matricula, carrera, telefono, institucion, inicio, termino, horas_totales) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    await db.query(sql, [
      userId, nombre, matricula, carrera, telefono, institucion, inicio, termino, horas
    ]);
  }

  static async getStudentStats() {
    const sql = `
            SELECT 
                u.id, u.email,
                COALESCE(SUM(CASE WHEN r.estado = 'aprobado' THEN r.horas_registradas ELSE 0 END), 0) AS totalHoras
            FROM users u
            LEFT JOIN registros_horas r ON u.id = r.user_id
            WHERE u.role = 'alumno'
            GROUP BY u.id, u.email
        `;
    const [rows] = await db.query(sql);
    return rows;
  }
}

module.exports = User;