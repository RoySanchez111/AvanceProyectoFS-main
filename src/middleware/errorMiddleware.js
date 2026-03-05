// Archivo: src/middleware/errorMiddleware.js

const errorHandler = (err, req, res, next) => {
  // Registra el error real en la consola de Node.js para debugging
  console.error("🚨 [Global Error Handler]:", err.message || err);

  // Determina el código de estado (500 por defecto si no viene uno específico)
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    msg: "Ocurrió un error interno en el servidor.",
    // En producción es mejor no enviar el detalle del error al cliente por seguridad
    detalle: err.message 
  });
};

module.exports = { errorHandler };