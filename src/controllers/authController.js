const db = require('../config/db'); 
const bcrypt = require('bcryptjs');

// ==========================================
// REGISTRO DE ALUMNOS NUEVOS
// ==========================================
exports.register = async (req, res) => {
    console.log("=== 📥 NUEVO INTENTO DE REGISTRO ===");
    const { nombre, matricula, carrera, institucion, email, password, totalHoras } = req.body;

    try {
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'El correo ya está en uso' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO users (nombre, matricula, carrera, institucion, total_horas, email, password, role) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'alumno')
        `;
        
        const horas = totalHoras ? parseInt(totalHoras) : 480; 
        
        await db.query(query, [nombre, matricula, carrera, institucion, horas, email, hashedPassword]);

        console.log("✅ ¡Alumno registrado con éxito!");
        res.status(201).json({ message: 'Usuario creado exitosamente' });

    } catch (error) {
        console.error("❌ ERROR EN MYSQL AL REGISTRAR:", error.message);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// ==========================================
// INICIO DE SESIÓN (LOGIN)
// ==========================================
exports.login = async (req, res) => {
    console.log("=== 🔑 INTENTO DE LOGIN ===");
    console.log("Credenciales recibidas:", req.body);
    
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            console.log("⚠️ Error: Usuario no encontrado.");
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const user = users[0];

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log("⚠️ Error: Contraseña incorrecta.");
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const token = "token_css_control_" + user.id;

        console.log(`✅ Login exitoso. Bienvenido, ${user.role}: ${user.email}`);
        
        res.json({ 
            message: 'Bienvenido', 
            token: token, 
            role: user.role 
        });

    } catch (error) {
        console.error("❌ ERROR EN MYSQL AL INICIAR SESIÓN:", error.message);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// ==========================================
// OBTENER INSTITUCIONES (Para el formulario de React)
// ==========================================
// ==========================================
// OBTENER INSTITUCIONES (Con conteo en tiempo real)
// ==========================================
exports.getInstituciones = async (req, res) => {
    console.log("=== 🏢 SOLICITUD DE INSTITUCIONES ===");
    try {
        // Magia SQL: Unimos la tabla de instituciones con la de usuarios 
        // para contar exactamente cuántos alumnos tiene cada una en tiempo real.
        const query = `
            SELECT i.id, i.nombre, COUNT(u.id) as alumnosActivos
            FROM instituciones i
            LEFT JOIN users u ON i.nombre = u.institucion AND u.role = 'alumno'
            GROUP BY i.id, i.nombre
        `;
        
        const [instituciones] = await db.query(query);
        console.log(`✅ Se enviaron ${instituciones.length} instituciones a React.`);
        res.json(instituciones);
    } catch (error) {
        console.error("❌ ERROR AL CARGAR INSTITUCIONES:", error.message);
        res.status(500).json({ message: 'Error al obtener las instituciones' });
    }
};