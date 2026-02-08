document.addEventListener("DOMContentLoaded", async () => {

  // ==========================================
  // 1. SEGURIDAD (Auth Guard)
  // ==========================================
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "admin") {
    alert("⛔ Acceso denegado.");
    window.location.href = "login.html";
    return;
  }

  // Configurar botón salir
  document.getElementById("btnLogout")?.addEventListener("click", () => {
    if(confirm("¿Cerrar sesión de administrador?")){
      localStorage.clear();
      window.location.href = "login.html";
    }
  });

  // ==========================================
  // 2. CARGAR DATOS
  // ==========================================
  await cargarDashboard();
});

// Función Principal de Carga
async function cargarDashboard() {
  const token = localStorage.getItem("token");

  try {
    // A) Obtener Registros Pendientes
    const resPendientes = await fetch("http://127.0.0.1:3000/admin/registros", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const pendientes = await resPendientes.json();

    // B) Obtener Alumnos (Para estadísticas)
    const resAlumnos = await fetch("http://127.0.0.1:3000/admin/alumnos", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const alumnos = await resAlumnos.json();

    // ==========================================
    // 3. RENDERIZAR TABLA (PENDIENTES)
    // ==========================================
    const tbody = document.getElementById("tablaPendientes");
    if (tbody) {
      tbody.innerHTML = "";

      if (pendientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">✅ No hay validaciones pendientes</td></tr>`;
      } else {
        pendientes.forEach(r => {
          // Formatear fecha
          // Nota: Agregamos 'T12:00:00' para evitar desfases de zona horaria al formatear
          const fechaObj = new Date(r.fecha); 
          const fechaFmt = fechaObj.toLocaleDateString("es-MX");
          
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>
              <strong>${r.email}</strong><br>
              <span style="font-size:11px; opacity:0.7">ID Reg: ${r.id}</span>
            </td>
            <td>${fechaFmt}</td>
            <td><span class="badge yellow" style="font-size:12px">${r.horas_registradas} h</span></td>
            <td>
              <button class="btn-pdf">📄 PDF</button>
            </td>
            <td>
              <button class="action-btn btn-check" onclick="gestionarRegistro(${r.id}, 'aprobado')" title="Aprobar">✔</button>
              <button class="action-btn btn-reject" onclick="gestionarRegistro(${r.id}, 'rechazado')" title="Rechazar">✖</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }
    }

    // ==========================================
    // 4. ACTUALIZAR KPIs (LÓGICA NUEVA)
    // ==========================================
    
    // KPI 1: Pendientes
    const elPendientes = document.getElementById("kpiPendientes");
    if (elPendientes) elPendientes.textContent = pendientes.length;
    
    // KPI 2: Total Alumnos
    const elAlumnos = document.getElementById("kpiAlumnos");
    if (elAlumnos) elAlumnos.textContent = alumnos.length;

    // KPI 3: HORAS TOTALES APROBADAS (Suma global)
    // Nota: Para filtrar "por mes" estricto, necesitaríamos un endpoint nuevo en backend.
    // Aquí mostramos el total histórico aprobado.
    const totalHorasGlobal = alumnos.reduce((acc, curr) => acc + Number(curr.totalHoras), 0);
    const elHoras = document.getElementById("kpiHorasGlobales"); // ID actualizado en HTML
    if (elHoras) elHoras.textContent = `${totalHorasGlobal} h`;

    // KPI 4: TASA DE FINALIZACIÓN (NUEVO CÁLCULO)
    // Contamos cuántos alumnos tienen >= 480 horas
    const alumnosFinalizados = alumnos.filter(a => Number(a.totalHoras) >= 480).length;
    const totalAlumnos = alumnos.length;
    
    // Evitar división entre cero
    const tasa = totalAlumnos > 0 ? ((alumnosFinalizados / totalAlumnos) * 100).toFixed(1) : 0;
    
    const elTasa = document.getElementById("kpiTasa"); // ID actualizado en HTML
    if (elTasa) elTasa.textContent = `${tasa}%`;

    // ==========================================
    // 5. GRÁFICO (Chart.js)
    // ==========================================
    // Mostramos Completados vs En Progreso en el gráfico
    initChart(alumnosFinalizados, totalAlumnos - alumnosFinalizados);

  } catch (error) {
    console.error("Error cargando admin:", error);
    // alert("❌ Error de conexión con el servidor"); 
  }
}

// ==========================================
// 6. FUNCIÓN APROBAR / RECHAZAR
// ==========================================
window.gestionarRegistro = async (id, estado) => {
  const token = localStorage.getItem("token");
  
  if (!confirm(`¿Estás seguro de marcar esto como ${estado.toUpperCase()}?`)) return;

  try {
    const res = await fetch(`http://127.0.0.1:3000/admin/registro/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ estado })
    });

    if (res.ok) {
      cargarDashboard(); // Recargar datos
    } else {
      alert("Error al actualizar ❌");
    }
  } catch (error) {
    console.error(error);
    alert("Error de red ❌");
  }
};

// ==========================================
// 7. CONFIGURACIÓN GRÁFICO
// ==========================================
let myChart = null;

function initChart(finalizados, enProgreso) {
  const ctx = document.getElementById('adminChart');
  if(!ctx) return;

  if (myChart) myChart.destroy();

  myChart = new Chart(ctx.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['SS Completado (480h)', 'En Progreso'],
      datasets: [{
        data: [finalizados, enProgreso],
        backgroundColor: ['#8e44ad', '#E5E7EB'], // Morado y Gris
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}