document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "admin") {
    alert("⛔ Acceso denegado.");
    window.location.href = "login.html";
    return;
  }

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      showConfirm("🚪 Cerrar Sesión", "¿Deseas salir del panel?", "btn-danger", "Sí, salir", () => {
        localStorage.clear();
        window.location.href = "login.html";
      });
    });
  }

  await cargarDashboard();
  await cargarInstituciones();
});

// Navegación (SPA)
window.cambiarVista = function(vistaId) {
  document.querySelectorAll('.vista').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.menu li').forEach(el => el.classList.remove('active'));
  document.getElementById(`vista-${vistaId}`).classList.add('active');
  document.getElementById(`menu-${vistaId}`).classList.add('active');
};

// Carga del Dashboard Principal
async function cargarDashboard() {
  const token = localStorage.getItem("token");

  try {
    const resPendientes = await fetch("/admin/registros", { headers: { Authorization: `Bearer ${token}` } });
    const pendientes = await resPendientes.json();

    const resAlumnos = await fetch("/admin/alumnos", { headers: { Authorization: `Bearer ${token}` } });
    const alumnos = await resAlumnos.json();

    const resReportes = await fetch("/admin/reportes", { headers: { Authorization: `Bearer ${token}` } });
    const reportes = await resReportes.json();

    // Tabla Validaciones de Horas Diarias (Con Enlace a Foto)
    const tbody = document.getElementById("tablaPendientes");
    if (tbody) {
      tbody.innerHTML = "";
      if (pendientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">✅ No hay validaciones pendientes.</td></tr>`;
      } else {
        pendientes.forEach((r) => {
          const fechaFmt = new Date(r.fecha).toLocaleDateString("es-MX");
          tbody.innerHTML += `
            <tr>
              <td><strong>${r.email}</strong><br><span style="font-size:11px; opacity:0.7">ID Reg: ${r.id}</span></td>
              <td>${fechaFmt}</td>
              <td><span class="badge yellow">${r.horas_registradas} h</span></td>
              <td>
                <a href="${r.evidencia_url}" target="_blank" class="btn-info" style="text-decoration:none; padding:8px 12px; border-radius:8px; font-size:12px; display:inline-block;">Ver Foto</a>
              </td>
              <td>
                <button class="action-btn btn-check" onclick="gestionarRegistro(${r.id}, 'aprobado')">✔</button>
                <button class="action-btn btn-reject" onclick="gestionarRegistro(${r.id}, 'rechazado')">✖</button>
              </td>
            </tr>
          `;
        });
      }
    }

    // Tabla Reportes de Medio Término (Botón Corregido)
    const tbodyReportes = document.getElementById("tablaReportesMedio");
    if (tbodyReportes) {
      tbodyReportes.innerHTML = "";
      if (reportes.length === 0) {
        tbodyReportes.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px;">No hay reportes formales recibidos.</td></tr>`;
      } else {
        reportes.forEach((rep) => {
          const fechaFmt = new Date(rep.fecha).toLocaleDateString("es-MX");
          tbodyReportes.innerHTML += `
            <tr>
              <td><strong>${rep.email}</strong><br><span style="font-size:11px; opacity:0.7">ID Doc: ${rep.id}</span></td>
              <td>${fechaFmt}</td>
              <td><span class="badge" style="background: #8b5cf6; color: white; font-size: 11px; padding: 6px 10px;">🌟 Terminación de Medio Término</span></td>
              <td>
                <button class="btn-primary" style="background: #6d28d9; border:none;" onclick="generarPDF(${rep.id})">📄 Generar PDF</button>
              </td>
            </tr>
          `;
        });
      }
    }

    // Tabla Alumnos
    const tbodyAlumnos = document.getElementById("tablaAlumnosTotales");
    if (tbodyAlumnos) {
      tbodyAlumnos.innerHTML = "";
      alumnos.forEach((a) => {
        const aprobadas = Number(a.totalHoras);
        const restantes = Math.max(480 - aprobadas, 0);
        const colorRestante = restantes === 0 ? "green" : "red";
        tbodyAlumnos.innerHTML += `<tr><td><strong>${a.email}</strong></td><td>${a.id}</td><td><span class="badge green">${aprobadas} hrs</span></td><td><span class="badge ${colorRestante}">${restantes} hrs</span></td></tr>`;
      });
    }

    // KPIs
    document.getElementById("kpiPendientes").textContent = pendientes.length;
    document.getElementById("kpiAlumnos").textContent = alumnos.length;
    const totalHorasGlobal = alumnos.reduce((acc, curr) => acc + Number(curr.totalHoras), 0);
    document.getElementById("kpiHorasGlobales").textContent = `${totalHorasGlobal} h`;
    const finalizados = alumnos.filter((a) => Number(a.totalHoras) >= 480).length;
    document.getElementById("kpiTasa").textContent = alumnos.length > 0 ? `${((finalizados / alumnos.length) * 100).toFixed(1)}%` : "0%";
    initChart(finalizados, alumnos.length - finalizados);
  } catch (error) { console.error(error); }
}

// Configuración: Instituciones
async function cargarInstituciones() {
  try {
    const res = await fetch("/instituciones");
    const data = await res.json();
    const tbody = document.getElementById("tablaInstituciones");
    tbody.innerHTML = "";
    data.forEach(inst => {
      tbody.innerHTML += `<tr><td>${inst.id}</td><td><strong>${inst.nombre}</strong></td><td><button class="action-btn btn-reject" onclick="eliminarInstitucion(${inst.id})">🗑️</button></td></tr>`;
    });
  } catch (error) { console.error(error); }
}

window.agregarInstitucion = async () => {
  const token = localStorage.getItem("token");
  const nombre = document.getElementById("nuevaInstInput").value.trim();
  if (!nombre) return showNotification("error", "Campo vacío", "Escribe un nombre.");
  try {
    const res = await fetch("/admin/instituciones", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ nombre }) });
    if (res.ok) { showNotification("success", "Éxito", "Guardado"); document.getElementById("nuevaInstInput").value = ""; cargarInstituciones(); }
  } catch (error) { showNotification("error", "Error de red", "Fallo servidor."); }
};

window.eliminarInstitucion = (id) => {
  const token = localStorage.getItem("token");
  showConfirm("Eliminar", "¿Borrar?", "btn-danger", "Sí, borrar", async () => {
    await fetch(`/admin/instituciones/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    cargarInstituciones();
  });
};

// Validaciones de Horas
window.gestionarRegistro = (id, estado) => {
  const token = localStorage.getItem("token");
  const colorBoton = estado === "aprobado" ? "btn-primary" : "btn-danger";
  showConfirm(`Confirmar`, `¿Marcar como ${estado}?`, colorBoton, `Sí, ${estado}`, async () => {
    const res = await fetch(`/admin/registro/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ estado }) });
    if (res.ok) { showNotification("success", "Actualizado", `Registro ${estado}.`); cargarDashboard(); }
  });
};

// Gráfica
let myChart = null;
function initChart(finalizados, enProgreso) {
  const ctx = document.getElementById("adminChart");
  if (!ctx) return;
  if (myChart) myChart.destroy();
  myChart = new Chart(ctx.getContext("2d"), { type: "doughnut", data: { labels: ["SS Completado", "En Progreso"], datasets: [{ data: [finalizados, enProgreso], backgroundColor: ["#1dbf73", "#E5E7EB"], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } } });
}

// Modales
window.openModal = function (modalId) { document.getElementById(modalId).classList.add("active"); };
window.closeModal = function (modalId) { document.getElementById(modalId).classList.remove("active"); };

window.showNotification = function (type, title, message) {
  const iconEl = document.getElementById("notifIcon"), titleEl = document.getElementById("notifTitle"), btnEl = document.getElementById("notifBtn");
  btnEl.className = "btn-primary"; 
  if (type === "success") { iconEl.textContent = "✅"; titleEl.style.color = "#1dbf73"; } 
  else if (type === "error") { iconEl.textContent = "❌"; titleEl.style.color = "#ef4444"; btnEl.className = "btn-danger"; } 
  else { iconEl.textContent = "ℹ️"; titleEl.style.color = "#3b82f6"; btnEl.className = "btn-info"; }
  titleEl.textContent = title; document.getElementById("notifMessage").innerHTML = message; openModal("notificationModal");
};

window.showConfirm = function (title, message, btnClass, btnText, onConfirm) {
  document.getElementById("confirmTitle").textContent = title; document.getElementById("confirmMessage").innerHTML = message;
  const yesBtn = document.getElementById("confirmYesBtn"); yesBtn.className = btnClass; yesBtn.textContent = btnText;
  yesBtn.onclick = () => { closeModal("confirmModal"); onConfirm(); }; openModal("confirmModal");
};

// =========================================
// GENERACIÓN DE PDF (CONSUMO DE API EXTERNA)
// =========================================
window.generarPDF = async (reportId) => {
  const token = localStorage.getItem("token");
  
  // Mostramos al admin que estamos trabajando en ello
  showNotification("info", "Generando Documento", "Conectando con la API externa para compilar el formato SS.02. Por favor, espera unos segundos...");

  try {
    // Hacemos la petición a nuestra nueva ruta protegida
    const res = await fetch(`/admin/reportes/${reportId}/pdf`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}` 
      }
    });

    if (!res.ok) {
      throw new Error("No se pudo compilar el documento.");
    }

    // Recibimos el archivo PDF en crudo (Blob)
    const blob = await res.blob();
    
    // Creamos una URL temporal en el navegador
    const fileURL = URL.createObjectURL(blob);
    
    // Abrimos el PDF en una pestaña nueva (listo para imprimir/descargar)
    window.open(fileURL, "_blank");

    // Cerramos el modal de "Generando Documento"
    closeModal('notificationModal');

  } catch (error) {
    console.error(error);
    showNotification("error", "Error de Compilación", "Hubo un problema al conectar con el servicio de generación de PDF.");
  }
};