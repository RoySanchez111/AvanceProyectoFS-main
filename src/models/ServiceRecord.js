const db = require('../config/db');

class ServiceRecord {
    // Buscar todos los registros de un alumno
    static async getByUser(userId) {
        const [rows] = await db.query('SELECT * FROM horas_registradas WHERE user_id = ? ORDER BY fecha DESC', [userId]);
        return rows;
    }

    // Guardar un registro nuevo
    static async create(userId, fecha, horas, evidenciaUrl) {
        const query = `
            INSERT INTO horas_registradas (user_id, fecha, horas, archivo, estado) 
            VALUES (?, ?, ?, ?, 'Pendiente')
        `;
        const [result] = await db.query(query, [userId, fecha, horas, evidenciaUrl]);
        return result;
    }
}

module.exports = ServiceRecord;