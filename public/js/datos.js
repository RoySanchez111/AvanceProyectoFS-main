document.addEventListener("DOMContentLoaded", () => {

// --- CARGAR INSTITUCIONES DINÁMICAMENTE ---
  const selectInstitucion = document.getElementById("institucion");
  if (selectInstitucion) {
    fetch("/instituciones")
      .then((res) => res.json())
      .then((data) => {
        selectInstitucion.innerHTML = '<option value="" disabled selected>Selecciona una opción...</option>';
        data.forEach((inst) => {
          const option = document.createElement("option");
          option.value = inst.nombre; // Guardaremos el nombre directamente en el perfil
          option.textContent = inst.nombre;
          selectInstitucion.appendChild(option);
        });
      })
      .catch((err) => {
        console.error("Error al cargar instituciones", err);
        selectInstitucion.innerHTML = '<option value="" disabled selected>Error al cargar. Refresca la página.</option>';
      });
  }


  // =========================================
  // 1. LÓGICA DE BLOQUEO DEL MENÚ LATERAL
  // =========================================
  const navLogin = document.getElementById("navLogin");
  const navDashboard = document.getElementById("navDashboard");

  if (navLogin) {
    navLogin.addEventListener("click", () => {
      openModal("avisoModal");
    });
  }

  if (navDashboard) {
    navDashboard.addEventListener("click", () => {
      openModal("avisoModal");
    });
  }

  // =========================================
  // 2. LÓGICA DEL FORMULARIO DE REGISTRO
  // =========================================
  const form = document.getElementById("datosForm");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const btnSubmit = form.querySelector("button[type='submit']");
      const originalText = btnSubmit.textContent;

      // Recolectar datos
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
        horas: document.getElementById("horas").value,
      };

      // Validar campos vacíos
      for (const [key, value] of Object.entries(datosUsuario)) {
        if (!value) {
          alert(`⚠️ El campo ${key} es obligatorio.`);
          return;
        }
      }

      btnSubmit.disabled = true;
      btnSubmit.textContent = "Creando cuenta...";

      // Enviar al backend
      try {
        const response = await fetch("/datos/registro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosUsuario),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.msg || "Error al registrar");

        alert("✅ ¡Cuenta creada con éxito! Ahora inicia sesión.");
        window.location.href = "login.html";
      } catch (error) {
        console.error(error);
        alert("❌ " + error.message);
        btnSubmit.disabled = false;
        btnSubmit.textContent = originalText;
      }
    });
  }
});

// =========================================
// 3. FUNCIONES GLOBALES PARA MODALES
// =========================================
// Se declaran en window para que el HTML pueda llamarlas directamente en el onclick
window.openModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
  }
};

window.closeModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
  }
};