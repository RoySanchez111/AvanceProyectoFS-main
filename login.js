// ===============================
// LOGIN FUNCTION EMS CONTROL
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".login-box");

  if (!form) {
    console.error("❌ No se encontró el formulario de login");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // ===============================
    // Validaciones básicas
    // ===============================
    if (!email || !password) {
      alert("⚠️ Por favor completa todos los campos");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new Error("Respuesta no válida del servidor");
      }

      const data = await response.json();

      if (!response.ok) {
        alert(data.msg || "Credenciales incorrectas");
        return;
      }

      // ===============================
      // Guardar token
      // ===============================
      localStorage.setItem("token", data.token);

      // ===============================
      // Leer payload del JWT
      // ===============================
      const payload = JSON.parse(
        atob(data.token.split(".")[1])
      );

      alert("✅ Login exitoso");

      // ===============================
      // Redirección por rol
      // ===============================
      if (payload.role === "admin") {
        window.location.href = "admin.html";
      } else {
        // 👨‍🎓 Alumno SIEMPRE pasa por datos
        window.location.href = "datos.html";
      }

    } catch (error) {
      console.error("❌ Error login:", error);
      alert("Error de conexión con el servidor ❌");
    }
  });
});