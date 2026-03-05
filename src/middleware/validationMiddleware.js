// Archivo: src/middleware/validationMiddleware.js

const validateHours = (req, res, next) => {
  const { fecha, horas } = req.body;

  if (!fecha || !horas) {
    return res.status(400).json({ msg: "La fecha y las horas son obligatorias." });
  }

  const horasNum = Number(horas);
  if (isNaN(horasNum) || horasNum <= 0 || horasNum > 10) {
    return res.status(400).json({ msg: "Las horas deben ser un número válido entre 1 y 10." });
  }

  // Si todo está correcto, pasa al siguiente controlador
  next();
};

module.exports = { validateHours };