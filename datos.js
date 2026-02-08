document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("datosForm");

  if (!form) {
    console.error("❌ No se encontró el formulario 'datosForm'");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Referencia al botón para efectos visuales
    const btnSubmit = form.querySelector("button[type='submit']");
    const originalText = btnSubmit.textContent;

    // 2. Obtener valores
    // Nota: Los IDs deben coincidir exactamente con el HTML
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

    // 3. Validación Rápida
    // Recorremos el objeto para ver si algo está vacío
    for (const [key, value] of Object.entries(datosUsuario)) {
      if (!value) {
        alert(`⚠️ El campo ${key} es obligatorio.`);
        return;
      }
    }

    // 4. Bloquear botón (UX)
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Creando cuenta...";

    try {
      // 5. Enviar al Backend
      const response = await fetch("http://127.0.0.1:3000/datos/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(datosUsuario)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Error desconocido al registrar");
      }

      // 6. Éxito
      alert("✅ ¡Cuenta creada con éxito! Ahora inicia sesión.");
      window.location.href = "login.html";

    } catch (error) {
      console.error(error);
      alert("❌ " + error.message);
      
      // Rehabilitar botón si falló
      btnSubmit.disabled = false;
      btnSubmit.textContent = originalText;
    }
  });
});