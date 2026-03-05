const ServiceRecord = require("../models/ServiceRecord");
const db = require("../config/db"); // Agrega esto hasta arriba si te falta

exports.getDashboardData = async (req, res) => {
  try {
    // 1. Buscamos tus datos de perfil reales en la base de datos
    const [users] = await db.query('SELECT nombre, matricula, carrera, institucion, total_horas FROM users WHERE id = ?', [req.user.id]);
    const perfilUsuario = users[0] || {};

    // 2. Buscamos tus horas y evidencias
    const records = await ServiceRecord.getByUser(req.user.id);

    const totalHoras = records
      .filter((r) => r.estado === "Aprobado")
      .reduce((acc, r) => acc + Number(r.horas), 0);

    const horasPendientes = records
      .filter((r) => r.estado === "Pendiente")
      .reduce((acc, r) => acc + Number(r.horas), 0);

    // 3. Se lo enviamos TODO a React
    res.json({ perfil: perfilUsuario, totalHoras, horasPendientes, registros: records });
  } catch (error) {
    console.error("❌ Error cargando dashboard:", error);
    res.status(500).json({ msg: "Error cargando dashboard" });
  }
};

exports.logHours = async (req, res) => {
  try {
    console.log("=== 📸 INTENTO DE SUBIR EVIDENCIA ===");
    console.log("Datos del formulario:", req.body);
    
    const { fecha, horas } = req.body;
    
    // Verificamos si Multer atrapó el archivo
    if (!req.file) {
      console.log("⚠️ Error: No se recibió ningún archivo.");
      return res.status(400).json({ msg: "Es obligatorio subir una foto de evidencia." });
    }

    console.log("✅ Archivo recibido correctamente:", req.file.filename);

    // Armamos la ruta que guardaremos en MySQL
    const evidenciaUrl = `/uploads/${req.file.filename}`;

    // Lo guardamos en MySQL usando el modelo
    await ServiceRecord.create(req.user.id, fecha, horas, evidenciaUrl);
    
    console.log("✅ Evidencia guardada en la base de datos con éxito.");
    res.json({ msg: "Horas y evidencia registradas. Esperando aprobación." });

  } catch (error) {
    console.error("❌ ERROR CRÍTICO AL SUBIR EVIDENCIA:", error.message);
    res.status(500).json({ msg: "Error interno del servidor", error: error.message });
  }
};