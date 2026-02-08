const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
const PORT = 3000;
const SECRET = "CLAVE_SECRETA"; // En producción usa variables de entorno

// =======================
// Middlewares
// =======================
app.use(cors());
app.use(express.json());

// =======================
// Ruta test
// =======================
app.get("/", (req, res) => {
  res.send("Servidor Node + MySQL OK 🚀");
});

// =======================
// LOGIN (CORREGIDO)
// =======================
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (err, results) => {
      if (err) return res.status(500).json({ msg: "Error DB" });
      if (results.length === 0)
        return res.status(401).json({ msg: "Usuario no existe" });

      const user = results[0];

      // Validación simple de contraseña
      if (password !== user.password) {
        return res.status(401).json({ msg: "Contraseña incorrecta" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        SECRET,
        { expiresIn: "2h" }
      );

      // FIX: Enviamos 'role' (no rol) y agregamos 'id' para el frontend
      res.json({
        msg: "Login exitoso",
        token,
        role: user.role,
        id: user.id,
        email: user.email
      });
    }
  );
});

// =======================
// Middleware AUTH (JWT)
// =======================
const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ msg: "Token requerido" });

  const token = header.split(" ")[1];

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ msg: "Token inválido" });
  }
};

// =======================
// Middleware ADMIN
// =======================
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Acceso denegado: Solo admins" });
  }
  next();
};

// =======================
// REGISTRO COMPLETO
// =======================
app.post("/datos/registro", (req, res) => {
  // Extraemos todos los datos del body
  const {
    email, password, nombre, matricula, carrera, 
    telefono, institucion, inicio, termino, horas
  } = req.body;

  // 1️⃣ Crear usuario en tabla 'users'
  const sqlUser = "INSERT INTO users (email, password, role) VALUES (?, ?, 'alumno')";

  db.query(sqlUser, [email, password], (err, result) => {
    if (err) {
      // Error común: correo duplicado
      return res.status(400).json({ msg: "El correo ya está registrado" });
    }

    const userId = result.insertId; // ID del usuario recién creado

    // 2️⃣ Guardar perfil en 'datos_servicio'
    // FIX: Asegúrate que tu tabla 'datos_servicio' tenga la columna 'nombre'
    // Si la moviste a 'users', quítala de aquí.
    const sqlDatos = `
      INSERT INTO datos_servicio
      (user_id, nombre, matricula, carrera, telefono, institucion, inicio, termino, horas_totales)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sqlDatos,
      [userId, nombre, matricula, carrera, telefono, institucion, inicio, termino, horas],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ msg: "Error al guardar datos del perfil" });
        }
        res.json({ msg: "Registro completo exitoso ✅" });
      }
    );
  });
});

// =======================
// DASHBOARD USUARIO (CORREGIDO)
// =======================
app.get("/dashboard", auth, (req, res) => {
  // FIX: Consultamos 'registros_horas', no 'datos_servicio'
  // Queremos ver el historial de horas registradas por el alumno
  const sql = `
    SELECT id, fecha, horas_registradas AS horas, estado
    FROM registros_horas
    WHERE user_id = ?
    ORDER BY fecha DESC
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ msg: "Error dashboard" });

    // Calculamos horas totales aprobadas
    const totalHoras = results
      .filter(r => r.estado === 'aprobado')
      .reduce((acc, r) => acc + Number(r.horas), 0);

    const horasPendientes = results
      .filter(r => r.estado === 'pendiente')
      .reduce((acc, r) => acc + Number(r.horas), 0);

    res.json({ 
      totalHoras, 
      horasPendientes,
      registros: results 
    });
  });
});

// =======================
// ADMIN - REGISTROS PENDIENTES
// =======================
app.get("/admin/registros", auth, isAdmin, (req, res) => {
  // FIX: Hacemos un JOIN para ver el nombre del alumno, no solo su ID
  const sql = `
    SELECT r.id, r.fecha, r.horas_registradas, r.estado, u.email 
    FROM registros_horas r
    JOIN users u ON r.user_id = u.id
    WHERE r.estado = 'pendiente'
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ msg: "Error DB" });
    res.json(results);
  });
});

// =======================
// ADMIN - APROBAR / RECHAZAR
// =======================
app.put("/admin/registro/:id", auth, isAdmin, (req, res) => {
  const { estado } = req.body; // Espera 'aprobado' o 'rechazado'

  db.query(
    "UPDATE registros_horas SET estado = ? WHERE id = ?",
    [estado, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ msg: "Error DB" });
      res.json({ msg: `Registro ${estado} correctamente` });
    }
  );
});

// =======================
// ADMIN - LISTA ALUMNOS + TOTALES
// =======================
app.get("/admin/alumnos", auth, isAdmin, (req, res) => {
  // FIX: Agregamos GROUP BY para evitar errores de SQL
  const sql = `
    SELECT 
      u.id,
      u.email,
      COALESCE(SUM(CASE WHEN r.estado = 'aprobado' THEN r.horas_registradas ELSE 0 END), 0) AS totalHoras
    FROM users u
    LEFT JOIN registros_horas r ON u.id = r.user_id
    WHERE u.role = 'alumno'
    GROUP BY u.id, u.email
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ msg: "Error DB" });
    }
    res.json(results);
  });
});

// =======================
// REGISTRAR HORAS (ALUMNO)
// =======================
app.post("/horas", auth, (req, res) => {
  const { fecha, horas } = req.body;

  if (!fecha || !horas) {
    return res.status(400).json({ msg: "Faltan fecha u horas" });
  }

  // FIX: Usamos nombres de columnas consistentes con el SQL previo
  const sql = `
    INSERT INTO registros_horas (user_id, fecha, horas_registradas, estado)
    VALUES (?, ?, ?, 'pendiente')
  `;

  db.query(sql, [req.user.id, fecha, horas], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ msg: "Error al registrar horas" });
    }

    res.json({ msg: "Horas registradas. Esperando aprobación del admin." });
  });
});

// =======================
// SERVER
// =======================
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});