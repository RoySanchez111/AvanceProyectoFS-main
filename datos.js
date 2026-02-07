// ===============================
// REGISTRO INICIAL + CREACIÓN DE USUARIO
// EMS CONTROL
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("datosForm");

  if (!form) {
    console.error("❌ No se encontró el formulario");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ===============================
    // Obtener valores del formulario
    // ===============================
    const datosUsuario = {
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value.trim(),

      nombre: document.getElementById("nombre").value.trim(),
      matricula: document.getElementById("matricula").value.trim(),
      carrera: document.getElementById("carrera").value.trim(),
      telefono: document.getElementById("telefono").value.trim(),
      institucion: document.getElementById("institucion").value.trim(),
      inicio: document.getElementById("inicio").value,
      termino: document.getElementById("termino").value,
      horas: document.getElementById("horas").value
    };

    // ===============================
    // Validaciones básicas
    // ===============================
    for (const campo in datosUsuario) {
      if (!datosUsuario[campo]) {
        alert("⚠️ Todos los campos son obligatorios");
        return;
      }
    }

    // ===============================
    // Enviar al backend
    // ===============================
    try {
      const response = await fetch("http://127.0.0.1:3000/datos/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(datosUsuario)
      });

      // Validar respuesta JSON
      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new Error("Respuesta inválida del servidor");
      }

      const data = await response.json();

      if (!response.ok) {
        alert(data.msg || "Error al registrar usuario ❌");
        return;
      }

      // ===============================
      // Éxito
      // ===============================
      alert("✅ Registro completo. Ahora inicia sesión");
      window.location.href = "login.html";

    } catch (error) {
      console.error("❌ Error de conexión:", error);
      alert("Error de conexión con el servidor ❌");
    }
  });
});