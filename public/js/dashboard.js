document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const email = localStorage.getItem("email");

  if (!token || role !== "alumno") {
    alert("⛔ Acceso denegado. Debes iniciar sesión como alumno.");
    window.location.href = "login.html";
    return;
  }

  // --- UI SETUP ---
  const userNameDisplay = email ? email.split("@")[0] : "Alumno";
  if (document.getElementById("welcomeName")) document.getElementById("welcomeName").textContent = userNameDisplay;
  if (document.getElementById("userNameNav")) document.getElementById("userNameNav").textContent = email;
  if (document.getElementById("userInitials")) document.getElementById("userInitials").textContent = userNameDisplay.substring(0, 2).toUpperCase();

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      openModal('confirmModal');
      document.getElementById("confirmYesBtn").onclick = () => {
        localStorage.clear();
        window.location.href = "login.html";
      };
    });
  }

  // --- CARGA DE DATOS ---
  let aprobadas = 0, pendientes = 0, registros = [], misReportes = [];
  try {

    const response = await fetch("/dashboard", {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }

    const data = await response.json();
    aprobadas = Number(data.totalHoras) || 0;
    pendientes = Number(data.horasPendientes) || 0;
    registros = data.registros || [];

    const resReportes = await fetch("/mis-reportes", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (resReportes.ok) {
      misReportes = await resReportes.json();
    }

  } catch (error) {
    showNotification("error", "Error de conexión", "No se pudo conectar con el servidor.");
  }

  // --- KPIs ---
  const META_SS = 480;
  const totalRegistrado = aprobadas + pendientes;
  const restantes = Math.max(META_SS - aprobadas, 0);

  if (document.getElementById("cardTotal")) document.getElementById("cardTotal").textContent = `${totalRegistrado} hrs`;
  if (document.getElementById("cardPendientes")) document.getElementById("cardPendientes").textContent = `${pendientes} hrs`;
  if (document.getElementById("cardAprobadas")) document.getElementById("cardAprobadas").textContent = `${aprobadas} hrs`;
  if (document.getElementById("cardRestantes")) document.getElementById("cardRestantes").textContent = `${restantes} hrs`;

  // --- RENDERIZADO DEL HISTORIAL ---
  const tbodyHistorial = document.getElementById("tablaHistorial");
  if (tbodyHistorial) {
    tbodyHistorial.innerHTML = "";
    const historialCompleto = [];

    registros.forEach(r => {
      historialCompleto.push({
        fechaObj: new Date(r.fecha),
        fechaStr: new Date(r.fecha).toLocaleDateString("es-MX"),
        tipo: "Registro de Horas Diarias",
        detalles: `${r.horas} horas registradas`,
        estado: r.estado || 'pendiente'
      });
    });


    misReportes.forEach(rep => {
      historialCompleto.push({
        fechaObj: new Date(rep.fecha),
        fechaStr: new Date(rep.fecha).toLocaleDateString("es-MX"),
        tipo: "📑 Reporte Medio Término (SS.02)",
        detalles: `Enviado para revisión institucional`,
        estado: rep.estado || 'pendiente'
      });
    });

    historialCompleto.sort((a, b) => b.fechaObj - a.fechaObj);

    if (historialCompleto.length === 0) {
      tbodyHistorial.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px;">No tienes movimientos registrados aún.</td></tr>`;
    } else {
      historialCompleto.forEach(item => {
        // Asignamos el color correcto de la etiqueta
        let badgeColor = "yellow";
        if (item.estado === 'aprobado') badgeColor = "green";
        if (item.estado === 'rechazado') badgeColor = "red";

        tbodyHistorial.innerHTML += `
          <tr>
            <td style="padding: 15px 12px; border-bottom: 1px solid #e5e7eb;">${item.fechaStr}</td>
            <td style="padding: 15px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #163528;">${item.tipo}</td>
            <td style="padding: 15px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${item.detalles}</td>
            <td style="padding: 15px 12px; border-bottom: 1px solid #e5e7eb;">
              <span class="badge ${badgeColor}">${item.estado.toUpperCase()}</span>
            </td>
          </tr>
        `;
      });
    }
  }

  // --- CHARTS ---
  const ctxProgress = document.getElementById("progressChart");
  if (ctxProgress) {
    new Chart(ctxProgress.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Aprobadas", "Restantes"],
        datasets: [{ data: [aprobadas, restantes], backgroundColor: ["#1dbf73", "#E5E7EB"], borderWidth: 0 }]
      },
      options: { cutout: "75%", responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }
    });
  }

  const ctxHistory = document.getElementById("historyChart");
  if (ctxHistory && registros.length > 0) {
    const labels = registros.map(r => new Date(r.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })).reverse();
    const dataHoras = registros.map(r => r.horas).reverse();
    new Chart(ctxHistory.getContext("2d"), {
      type: "line",
      data: {
        labels: labels,
        datasets: [{ label: "Horas Diarias", data: dataHoras, borderColor: "#163528", backgroundColor: "rgba(22, 53, 40, 0.1)", fill: true, tension: 0.3 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }

  // --- REGISTRO DE HORAS DIARIAS ---
  const btnGuardar = document.getElementById("saveDailyHours");
  if (btnGuardar) {
    btnGuardar.addEventListener("click", async () => {
      const fechaVal = document.getElementById("dateInput").value;
      const horasVal = document.getElementById("hoursInput").value;
      const fotoFile = document.getElementById("fotoInput").files[0]; 

      if (!fechaVal || !horasVal || horasVal <= 0 || horasVal > 10 || !fotoFile) {
        showNotification("error", "Datos Incompletos", "Por favor, completa todos los campos y sube la foto de evidencia.");
        return;
      }

      const originalText = btnGuardar.textContent;
      btnGuardar.textContent = "Subiendo...";
      btnGuardar.disabled = true;

      const formData = new FormData();
      formData.append("fecha", fechaVal);
      formData.append("horas", horasVal);
      formData.append("foto", fotoFile); 

      try {
        const response = await fetch("/horas", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData, 
        });
        const result = await response.json();

        if (response.ok) {
          showNotification("success", "¡Registro Exitoso!", "Tus horas y evidencia están pendientes de aprobación.");
          setTimeout(() => window.location.reload(), 2500);
        } else {
          showNotification("error", "Error", result.msg || "Ocurrió un error inesperado.");
          btnGuardar.textContent = originalText; btnGuardar.disabled = false;
        }
      } catch (error) {
        showNotification("error", "Error de Conexión", "Fallo al intentar conectar con el servidor.");
        btnGuardar.textContent = originalText; btnGuardar.disabled = false;
      }
    });
  }

  // --- ENVÍO DE REPORTE DE MITAD DE TÉRMINO ---
  const formMedioTermino = document.getElementById("formMedioTermino");
  if (formMedioTermino) {
    formMedioTermino.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const btnSubmit = formMedioTermino.querySelector("button[type='submit']");
      const originalText = btnSubmit.textContent;
      btnSubmit.textContent = "Enviando documento...";
      btnSubmit.disabled = true;

      const dataReporte = {
        area: document.getElementById("repArea").value,
        supervisor: document.getElementById("repSupervisor").value,
        correo: document.getElementById("repCorreo").value,
        telefono: document.getElementById("repTelefono").value,
        actividades: document.getElementById("repActividades").value,
        impacto: document.getElementById("repImpacto").value,
        mejoras: document.getElementById("repMejoras").value,
        autoevaluacion: document.getElementById("repAuto").value,
        comentarios: document.getElementById("repComentarios").value
      };

      try {
        const response = await fetch("/reportes", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(dataReporte)
        });
        const result = await response.json();

        if (response.ok) {
          showNotification("success", "¡Reporte Enviado!", "Tu documento de Medio Término ha sido guardado y registrado en tu historial.");
          formMedioTermino.reset();
          setTimeout(() => window.location.reload(), 3000); // Recargamos para que el historial se actualice inmediatamente
        } else {
          showNotification("error", "Error", result.msg || "No se pudo guardar el reporte.");
        }
      } catch (error) {
        showNotification("error", "Error de conexión", "Fallo de comunicación con el servidor.");
      } finally {
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
      }
    });
  }
});

// --- FUNCIONES GLOBALES ---
window.cambiarVista = function(vistaId) {
  document.querySelectorAll('.vista').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.menu li').forEach(el => el.classList.remove('active'));
  document.getElementById(`vista-${vistaId}`).classList.add('active');
  document.getElementById(`menu-${vistaId}`).classList.add('active');
};

window.openModal = function (modalId) { document.getElementById(modalId).classList.add("active"); };
window.closeModal = function (modalId) { document.getElementById(modalId).classList.remove("active"); };

window.showNotification = function (type, title, message) {
  const iconEl = document.getElementById("notificationIcon");
  const titleEl = document.getElementById("notificationTitle");
  
  if (type === "success") { 
    iconEl.textContent = "✅"; 
    iconEl.style.color = titleEl.style.color = "#1dbf73"; 
  } else if (type === "error") { 
    iconEl.textContent = "❌"; 
    iconEl.style.color = titleEl.style.color = "#ef4444"; 
  } else { 
    iconEl.textContent = "ℹ️"; 
    iconEl.style.color = titleEl.style.color = "#3b82f6"; 
  }
  
  titleEl.textContent = title;
  document.getElementById("notificationMessage").textContent = message;
  openModal("notificationModal");
};