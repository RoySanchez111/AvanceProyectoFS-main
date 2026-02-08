document.addEventListener("DOMContentLoaded", async () => {

  // ==========================================
  // 1. VERIFICACIÓN DE SEGURIDAD (AUTH)
  // ==========================================
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role"); // Ojo: Debe coincidir con login.js
  const email = localStorage.getItem("email");

  // Si no hay token o no es alumno, expulsar
  if (!token || role !== "alumno") {
    alert("⛔ Acceso denegado. Debes iniciar sesión como alumno.");
    window.location.href = "login.html";
    return;
  }

  // ==========================================
  // 2. CONFIGURACIÓN DE UI (HEADER Y NAV)
  // ==========================================
  const userNameDisplay = email ? email.split("@")[0] : "Alumno";
  
  // Elementos del DOM
  const elWelcome = document.getElementById("welcomeName");
  const elUserNav = document.getElementById("userNameNav");
  const elInitials = document.getElementById("userInitials");
  const btnLogout = document.getElementById("btnLogout");

  // Llenar datos
  if (elWelcome) elWelcome.textContent = userNameDisplay;
  if (elUserNav) elUserNav.textContent = email;
  if (elInitials) elInitials.textContent = userNameDisplay.substring(0, 2).toUpperCase();

  // Funcionalidad Cerrar Sesión
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (confirm("¿Seguro que quieres cerrar sesión?")) {
        localStorage.clear();
        window.location.href = "login.html";
      }
    });
  }

  // ==========================================
  // 3. OBTENER DATOS DEL BACKEND
  // ==========================================
  let aprobadas = 0;
  let pendientes = 0;
  let registros = [];

  try {
    const response = await fetch("http://127.0.0.1:3000/dashboard", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // 🔥 IMPORTANTE: Enviar Token
      }
    });

    if (response.status === 401 || response.status === 403) {
      alert("⚠️ Tu sesión ha expirado.");
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }

    const data = await response.json();

    // Asignar variables globales para usar en gráficos
    aprobadas = Number(data.totalHoras) || 0;     // Vienen del backend filtradas
    pendientes = Number(data.horasPendientes) || 0; 
    registros = data.registros || [];

  } catch (error) {
    console.error("Error cargando dashboard:", error);
    alert("❌ Error de conexión con el servidor");
  }

  // ==========================================
  // 4. ACTUALIZAR TARJETAS (KPIs)
  // ==========================================
  const META_SS = 480; 
  const totalRegistrado = aprobadas + pendientes;
  const restantes = Math.max(META_SS - aprobadas, 0); // Restamos solo las aprobadas a la meta

  // Actualizar DOM si existen los elementos
  const elCardTotal = document.getElementById("cardTotal");
  const elCardPendientes = document.getElementById("cardPendientes");
  const elCardAprobadas = document.getElementById("cardAprobadas");
  const elCardRestantes = document.getElementById("cardRestantes");

  if (elCardTotal) elCardTotal.textContent = `${totalRegistrado} hrs`;
  if (elCardPendientes) elCardPendientes.textContent = `${pendientes} hrs`;
  if (elCardAprobadas) elCardAprobadas.textContent = `${aprobadas} hrs`;
  if (elCardRestantes) elCardRestantes.textContent = `${restantes} hrs`;

  // ==========================================
  // 5. RENDERIZAR GRÁFICOS (CHART.JS)
  // ==========================================
  
  // --- Gráfico 1: Progreso (Dona) ---
  const ctxProgress = document.getElementById("progressChart");
  if (ctxProgress) {
    new Chart(ctxProgress.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Aprobadas", "Restantes"],
        datasets: [{
          data: [aprobadas, restantes],
          backgroundColor: ["#4F46E5", "#E5E7EB"], // Azul índigo y Gris
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        cutout: "75%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // --- Gráfico 2: Historial (Línea) ---
  const ctxHistory = document.getElementById("historyChart");
  if (ctxHistory && registros.length > 0) {
    // Procesar fechas para que se vean bonitas (dd/mm)
    // Invertimos (.reverse) para que salga cronológico (izquierda a derecha)
    const labels = registros.map(r => {
      const d = new Date(r.fecha);
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
    }).reverse();

    const dataHoras = registros.map(r => r.horas).reverse();

    new Chart(ctxHistory.getContext("2d"), {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Horas Diarias",
          data: dataHoras,
          borderColor: "#10B981", // Verde esmeralda
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
          tension: 0.3, // Curvatura de la línea
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, suggestedMax: 8 }
        }
      }
    });
  }

  // ==========================================
  // 6. FUNCIONALIDAD: REGISTRAR NUEVAS HORAS
  // ==========================================
  const btnGuardar = document.getElementById("saveDailyHours");

  if (btnGuardar) {
    btnGuardar.addEventListener("click", async () => {
      // Obtener valores de los inputs
      const inputFecha = document.getElementById("dateInput");
      const inputHoras = document.getElementById("hoursInput");

      const fechaVal = inputFecha.value;
      const horasVal = inputHoras.value;

      // Validaciones
      if (!fechaVal) {
        alert("📅 Por favor selecciona una fecha.");
        return;
      }
      if (!horasVal || horasVal <= 0) {
        alert("⏱️ Ingresa una cantidad de horas válida.");
        return;
      }
      if (horasVal > 10) {
        alert("⚠️ No puedes registrar más de 10 horas en un solo día.");
        return;
      }

      // Enviar al Backend
      try {
        const response = await fetch("http://127.0.0.1:3000/horas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            fecha: fechaVal,
            horas: horasVal
          })
        });

        const result = await response.json();

        if (response.ok) {
          alert("✅ ¡Registro exitoso! Tus horas están pendientes de aprobación.");
          // Limpiar formulario
          inputFecha.value = "";
          inputHoras.value = "";
          // Recargar página para actualizar gráficas
          window.location.reload();
        } else {
          alert("Error: " + (result.msg || "No se pudo guardar"));
        }

      } catch (error) {
        console.error(error);
        alert("❌ Error de conexión al intentar guardar.");
      }
    });
  }
});