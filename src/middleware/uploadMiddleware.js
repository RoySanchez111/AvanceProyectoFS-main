const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Definimos la ruta exacta donde se guardarán las fotos (public/uploads)
const uploadDir = path.join(__dirname, '../../public/uploads');

// 2. MAGIA: Si la carpeta no existe, Node.js la crea automáticamente
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 3. Configuramos Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Guardar en la carpeta que acabamos de asegurar
    },
    filename: function (req, file, cb) {
        // Renombramos el archivo para que nunca haya duplicados (Ej: 170940392-foto.png)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, uniqueSuffix + extension);
    }
});

const upload = multer({ storage: storage });

module.exports = upload;