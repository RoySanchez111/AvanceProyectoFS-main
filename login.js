document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("loginForm");
  const btnRegistrar = document.getElementById("btnRegistrar");

  // ===============================
  // BOTÓN REGISTRAR
  // ===============================
  if (btnRegistrar) {
    btnRegistrar.addEventListener("click", () => {
      // Asumo que aquí irán a llenar sus datos personales
      window.location.href = "datos.html";
    });
  }

  // ===============================
  // LOGIN LOGIC
  // ===============================
  if (form) { // Buena práctica: verificar que el form existe
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
          alert("⚠️ Ingresa correo y contraseña");
          return;
        }

        try {
          // Asegúrate que tu backend (Node/PHP) esté corriendo en este puerto
          const response = await fetch("http://127.0.0.1:3000/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
          });

          const data = await response.json();

          // ===============================
          // ERROR DE CREDENCIALES
          // ===============================
          if (!response.ok) {
            alert(data.message || "❌ Error de credenciales");
            return;
          }

          // ===============================
          // GUARDAR DATOS (IMPORTANTE)
          // ===============================
          // Tu Backend debe devolver: { token, role, id, email }
          localStorage.setItem("token", data.token);
          
          // Guardamos el ID para usarlo en las FK de las otras tablas
          localStorage.setItem("user_id", data.id); 
          
          localStorage.setItem("role", data.role); // Usamos 'role' como en la BD
          localStorage.setItem("email", email);

          // ===============================
          // REDIRECCIÓN POR ROL
          // ===============================
          // Ahora validamos consistentemente con data.role
          if (data.role === "admin") {
            window.location.href = "admin.html";
          } else if (data.role === "alumno") {
            window.location.href = "dashboard.html";
          } else {
            console.error("Rol recibido:", data.role);
            alert("Rol no reconocido en el sistema ❌");
          }

        } catch (error) {
          console.error("Error:", error);
          alert("❌ Error de conexión con el servidor (Revisa que el backend esté encendido)");
        }
      });
  }
});