document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const btnRegistrar = document.getElementById("btnRegistrar");

  if (btnRegistrar) {
    btnRegistrar.addEventListener("click", () => {
      window.location.href = "datos.html";
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!email || !password) {
        alert("⚠️ Ingresa correo y contraseña");
        return;
      }

      try {
        // Relative path: automatically uses the server's host and port
        const response = await fetch("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.msg || "❌ Error de credenciales"); // Changed data.message to data.msg to match backend
          return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user_id", data.id);
        localStorage.setItem("role", data.role);
        localStorage.setItem("email", data.email);

        if (data.role === "admin") {
          window.location.href = "admin.html";
        } else if (data.role === "alumno") {
          window.location.href = "dashboard.html";
        } else {
          alert("Rol no reconocido en el sistema ❌");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("❌ Error de conexión. Revisa que el servidor esté encendido.");
      }
    });
  }
});
