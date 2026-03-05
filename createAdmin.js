// Archivo: createAdmin.js
const bcrypt = require("bcryptjs");
const db = require("./src/config/db"); // Tu conexión a la base de datos

async function generateAdmin() {
  // ✏️ CAMBIA ESTOS DATOS POR LOS QUE TÚ QUIERAS
  const emailAdmin = "admin@tecmilenio.edu.mx";
  const passwordAdmin = "AdminSeguro123";

  try {
    console.log("Generando credenciales seguras...");
    
    // 1. Encriptamos la contraseña tal como lo hace tu modelo de usuarios
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordAdmin, salt);

    // 2. Insertamos el usuario forzando el rol a 'admin'
    const sql = "INSERT INTO users (email, password, role) VALUES (?, ?, 'admin')";
    await db.query(sql, [emailAdmin, hashedPassword]);

    console.log(`✅ ¡Éxito! El administrador ${emailAdmin} fue creado.`);
    console.log("Ya puedes iniciar sesión en el portal.");
    
    // Cerramos el script
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log("⚠️ Ese correo de administrador ya existe en la base de datos.");
    } else {
      console.error("❌ Error al crear admin:", error);
    }
    process.exit(1);
  }
}

generateAdmin();