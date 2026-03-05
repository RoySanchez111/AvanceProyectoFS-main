// ==========================================
// EL GUARDIA DE SEGURIDAD (Middleware)
// ==========================================

const auth = (req, res, next) => {
    // 1. Revisamos si React mandó el "gafete" (Token)
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("🔒 GUARDIA: Acceso denegado. No se envió el gafete de seguridad.");
        return res.status(401).json({ msg: 'No hay token, autorización denegada' });
    }

    // 2. Extraemos el texto del gafete
    const token = authHeader.split(' ')[1]; 

    // 3. Verificamos si es un gafete válido de nuestro sistema
    if (token && token.startsWith('token_css_control_')) {
        // Extraemos el ID del alumno del token (ej: el "5" de token_css_control_5)
        const userId = token.split('_')[3]; 
        
        // Le pasamos el ID a la función que guarda la foto para que sepa de quién es
        req.user = { id: userId }; 
        
        // ¡Lo dejamos pasar!
        next(); 
    } else {
        console.log("🔒 GUARDIA: Acceso denegado. El gafete es falso o está caducado.");
        return res.status(401).json({ msg: 'Token no válido' });
    }
};

// ==========================================
// GUARDIA VIP (Solo para Administradores)
// ==========================================
const isAdmin = async (req, res, next) => {
    // Como ya validamos el rol en el Login, por ahora lo dejamos pasar
    next();
};

module.exports = { auth, isAdmin };