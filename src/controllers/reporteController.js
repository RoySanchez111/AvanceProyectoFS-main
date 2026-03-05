const db = require('../config/db');

// ==========================================
// 1. GUARDAR UN NUEVO REPORTE (ALUMNO)
// ==========================================
exports.submitReport = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Extraemos todos los datos que nos manda React
        const {
            area_asignada, supervisor, correo_supervisor, telefono_supervisor,
            actividades, proyecto_especial, impacto, areas_mejora,
            propuestas_solucion, fortalezas, areas_oportunidad,
            comentarios, horas_reportadas
        } = req.body;

        console.log(`=== 📝 RECIBIENDO NUEVO REPORTE DEL ALUMNO ID: ${userId} ===`);

        // Insertamos directamente en la tabla de MySQL
        const query = `
            INSERT INTO reportes (
                user_id, area_asignada, supervisor, correo_supervisor, telefono_supervisor,
                actividades, proyecto_especial, impacto, areas_mejora, propuestas_solucion,
                fortalezas, areas_oportunidad, detalles, horas_reportadas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(query, [
            userId, area_asignada, supervisor, correo_supervisor, telefono_supervisor,
            actividades, proyecto_especial, impacto, areas_mejora, propuestas_solucion,
            fortalezas, areas_oportunidad, comentarios, horas_reportadas || 0
        ]);

        console.log("✅ Reporte guardado exitosamente en la base de datos.");
        res.json({ msg: "Reporte oficial enviado exitosamente para su validación." });

    } catch (error) {
        console.error("❌ ERROR AL GUARDAR EL REPORTE EN MYSQL:", error.message);
        res.status(500).json({ msg: "Error interno al guardar el documento." });
    }
};

// ==========================================
// 2. OBTENER MIS REPORTES (ALUMNO)
// ==========================================
exports.getMyReports = async (req, res) => {
    try {
        const query = "SELECT * FROM reportes WHERE user_id = ? ORDER BY fecha_creacion DESC";
        const [reportes] = await db.query(query, [req.user.id]);
        res.json(reportes);
    } catch (error) {
        console.error("❌ Error al obtener mis reportes:", error.message);
        res.status(500).json({ msg: "Error al cargar tu historial." });
    }
};

// ==========================================
// 3. OBTENER TODOS LOS REPORTES (ADMIN)
// ==========================================
exports.getAdminReports = async (req, res) => {
    try {
        const query = `
            SELECT r.*, u.nombre as alumno, u.matricula, u.carrera 
            FROM reportes r
            JOIN users u ON r.user_id = u.id
            ORDER BY r.fecha_creacion DESC
        `;
        const [reportes] = await db.query(query);
        console.log(`✅ El Admin solicitó la lista de reportes. Total encontrados: ${reportes.length}`);
        res.json(reportes);
    } catch (error) {
        console.error("❌ Error al cargar reportes para el Admin:", error.message);
        res.status(500).json({ message: 'Error al obtener los reportes' });
    }
};