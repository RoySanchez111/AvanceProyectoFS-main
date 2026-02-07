const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
const PORT = 3000;
const SECRET = "CLAVE_SECRETA";

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
// LOGIN
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

      // ⚠️ SIN ENCRIPTACIÓN (temporal)
      if (password !== user.password) {
        return res.status(401).json({ msg: "Contraseña incorrecta" });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role || "user" // admin / user
        },
        SECRET,
        { expiresIn: "1h" }
      );

      res.json({ token });
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


const isAdmin = (req, res, next) => {
  db.query(
    "SELECT role FROM users WHERE id = ?",
    [req.user.id],
    (err, results) => {

      if (err) return res.status(500).json({ msg: "Error DB" });

      if (results[0].role !== "admin") {
        return res.status(403).json({ msg: "Solo admins" });
      }

      next();
    }
  );
};

// =======================
// Guardar datos del usuario
// =======================
app.post("/datos", auth, (req, res) => {
  const {
    nombre,
    matricula,
    carrera,
    telefono,
    institucion,
    inicio,
    termino,
    horas
  } = req.body;

  const sql = `
    INSERT INTO datos_servicio
    (user_id, nombre, matricula, carrera, telefono, institucion, inicio, termino, horas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      req.user.id,
      nombre,
      matricula,
      carrera,
      telefono,
      institucion,
      inicio,
      termino,
      horas
    ],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ msg: "Error al guardar datos" });
      }
      res.json({ msg: "Datos guardados correctamente" });
    }
  );
});

// =======================
// DASHBOARD USUARIO
// =======================
app.get("/dashboard", auth, (req, res) => {
  const sql = `
    SELECT horas, inicio
    FROM datos_servicio
    WHERE user_id = ?
    ORDER BY inicio ASC
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ msg: "Error dashboard" });

    const totalHoras = results.reduce(
      (acc, r) => acc + Number(r.horas),
      0
    );

    res.json({
      totalHoras,
      registros: results
    });
  });
});

// =======================
// ADMIN - VER REGISTROS PENDIENTES
// =======================
app.get("/admin/registros", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ msg: "Acceso denegado" });

  db.query(
    "SELECT * FROM registros_horas WHERE estado = 'pendiente'",
    (err, results) => {
      if (err) return res.status(500).json({ msg: "Error DB" });
      res.json(results);
    }
  );
});

// =======================
// ADMIN - APROBAR
// =======================
app.put("/admin/aprobar/:id", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ msg: "Acceso denegado" });

  db.query(
    "UPDATE registros_horas SET estado = 'aprobado' WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ msg: "Error DB" });
      res.json({ msg: "Registro aprobado" });
    }
  );
});

// =======================
// ADMIN - RECHAZAR
// =======================
app.put("/admin/rechazar/:id", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ msg: "Acceso denegado" });

  db.query(
    "UPDATE registros_horas SET estado = 'rechazado' WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ msg: "Error DB" });
      res.json({ msg: "Registro rechazado" });
    }
  );
});

// =======================
// ADMIN - VER ALUMNOS Y HORAS
// =======================
app.get("/admin/alumnos", auth, isAdmin, (req, res) => {

  const sql = `
    SELECT 
      u.id,
      u.email,
      COALESCE(SUM(r.horas),0) AS totalHoras
    FROM users u
    LEFT JOIN registros_horas r 
      ON u.id = r.user_id
    WHERE u.role = 'alumno'
    GROUP BY u.id
  `;

  db.query(sql, (err, results) => {

    if (err) {
      console.error("❌ Error admin alumnos:", err);
      return res.status(500).json({ msg: "Error DB" });
    }

    res.json(results);
  });

});

app.get("/admin/alumno/:id", auth, isAdmin, (req, res) => {

  const sql = `
    SELECT nombre, fecha, horas, estado
    FROM registros_horas
    WHERE user_id = ?
    ORDER BY fecha DESC
  `;

  db.query(sql, [req.params.id], (err, results) => {

    if (err) return res.status(500).json({ msg: "Error DB" });

    res.json(results);

  });

});
app.put("/admin/registro/:id", auth, isAdmin, (req, res) => {

  const { estado } = req.body;

  const sql = `
    UPDATE registros_horas
    SET estado = ?
    WHERE id = ?
  `;

  db.query(sql, [estado, req.params.id], (err) => {

    if (err) return res.status(500).json({ msg: "Error DB" });

    res.json({ msg: "Registro actualizado" });

  });

});

app.post("/auth/register", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "INSERT INTO users (email, password, role) VALUES (?, ?, 'alumno')",
    [email, password],
    (err) => {
      if (err) {
        return res.status(400).json({ msg: "Usuario ya existe" });
      }

      res.json({ msg: "Usuario creado" });
    }
  );
});

// =======================
// Levantar servidor
// =======================
app.listen(PORT, "127.0.0.1", () => {
  console.log(`✅ Servidor en http://127.0.0.1:${PORT}`);
});