document.addEventListener("DOMContentLoaded", async () => {
    loadStudents();
  await cargarRegistros();
  initCharts();
});

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

const payload = JSON.parse(atob(token.split(".")[1]));

if (payload.role !== "admin") {
  alert("Acceso denegado ❌");
  window.location.href = "login.html";
}

async function cargarRegistros() {
  try {
    const res = await fetch("http://127.0.0.1:3000/admin/registros", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });

    const data = await res.json();

    const tbody = document.getElementById("validationsTable");
    tbody.innerHTML = "";

    data.forEach(r => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${r.nombre}</td>
        <td>${new Date(r.fecha).toLocaleDateString()}</td>
        <td>${r.horas} hrs</td>
        <td><button class="btn-pdf">📄 PDF</button></td>
        <td>
          <button class="action-btn btn-check" onclick="aprobar(${r.id})">✔</button>
          <button class="action-btn btn-reject" onclick="rechazar(${r.id})">✖</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error("Error admin:", error);
    alert("No se pudieron cargar los registros ❌");
  }
}

async function aprobar(id) {
  await fetch(`http://127.0.0.1:3000/admin/aprobar/${id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });
  cargarRegistros();
}

async function rechazar(id) {
  await fetch(`http://127.0.0.1:3000/admin/rechazar/${id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });
}
async function loadStudents() {

  const token = localStorage.getItem("token");

  const res = await fetch("http://127.0.0.1:3000/admin/alumnos", {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  const students = await res.json();

  const tbody = document.getElementById("validationsTable");

  tbody.innerHTML = students.map(s => `
    <tr>
      <td>${s.email}</td>
      <td>---</td>
      <td>${s.totalHoras} hrs</td>
      <td><button onclick="viewDetail(${s.id})">Ver</button></td>
    </tr>
  `).join("");
}

async function viewDetail(userId) {

  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://127.0.0.1:3000/admin/alumno/${userId}`,
    {
      headers: { Authorization: "Bearer " + token }
    }
  );

  const registros = await res.json();

  console.log(registros);
}