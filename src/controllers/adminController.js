const db = require('../config/db');

// Obtener todas las evidencias que están "Pendientes"
exports.getPendingRecords = async (req, res) => {
    try {
        // Unimos la tabla de horas con la de usuarios para saber de quién es la foto
        const query = `
            SELECT h.id, h.horas, h.fecha, h.archivo, u.nombre, u.matricula, u.carrera 
            FROM horas_registradas h
            JOIN users u ON h.user_id = u.id
            WHERE h.estado = 'Pendiente'
        `;
        const [records] = await db.query(query);
        res.json(records);
    } catch (error) {
        console.error("❌ Error al obtener registros:", error);
        res.status(500).json({ message: 'Error al obtener registros' });
    }
};

// Aprobar o Rechazar una evidencia
exports.updateRecordStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body; // Recibirá 'Aprobado' o 'Rechazado'
        
        await db.query('UPDATE horas_registradas SET estado = ? WHERE id = ?', [estado, id]);
        res.json({ message: `Evidencia actualizada a ${estado}` });
    } catch (error) {
        console.error("❌ Error al actualizar estado:", error);
        res.status(500).json({ message: 'Error al actualizar el registro' });
    }
};

// Obtener los totales de los alumnos (para la vista de "Base de Alumnos")
exports.getStudentTotals = async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.nombre, u.matricula, u.carrera, u.institucion, u.total_horas,
            COALESCE(SUM(CASE WHEN h.estado = 'Aprobado' THEN h.horas ELSE 0 END), 0) as horasAprobadas
            FROM users u
            LEFT JOIN horas_registradas h ON u.id = h.user_id
            WHERE u.role = 'alumno'
            GROUP BY u.id
        `;
        const [alumnos] = await db.query(query);
        res.json(alumnos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener alumnos' });
    }
};

// Agregar una nueva institución
exports.addInstitucion = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ message: "El nombre es obligatorio" });

        const [result] = await db.query('INSERT INTO instituciones (nombre) VALUES (?)', [nombre]);
        
        res.status(201).json({ 
            message: "Institución agregada", 
            id: result.insertId, 
            nombre: nombre 
        });
    } catch (error) {
        console.error("❌ Error al agregar institución:", error);
        res.status(500).json({ message: 'Error al guardar la institución' });
    }
};

// Aquí puedes dejar las funciones de instituciones que tenías vacías
exports.addInstitucion = async (req, res) => { res.json({ msg: "Pronto" }) };
exports.deleteInstitucion = async (req, res) => { res.json({ msg: "Pronto" }) };