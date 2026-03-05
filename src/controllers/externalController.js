// Archivo: src/controllers/externalController.js

exports.getExchangeRate = async (req, res, next) => {
  try {
    // Consumimos una API pública de tipos de cambio
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    
    if (!response.ok) {
      throw new Error(`Fallo en la API externa: HTTP ${response.status}`);
    }

    const data = await response.json();
    const mxnRate = data.rates.MXN;

    res.json({
      msg: "Datos de tipo de cambio obtenidos exitosamente",
      moneda_base: "USD",
      moneda_objetivo: "MXN",
      tasa_actual: mxnRate,
      aplicacion: "Proyección de costos administrativos del servicio social"
    });
  } catch (error) {
    // Si la API externa falla, le pasamos el error a nuestro errorHandler
    next(error);
  }
};