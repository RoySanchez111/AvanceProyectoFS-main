let doughnutChart;
let lineChart;

// --- Configuración Global ---
const CONFIG = {
    totalGoal: 480,
    currentAcum: 0,
    daysPerWeek: 5
};

// --- Cargar datos reales del backend ---
async function loadDashboardData() {
    try {
        const res = await fetch("http://127.0.0.1:3000/dashboard", {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!res.ok) throw new Error("No autorizado");

        const data = await res.json();

        CONFIG.currentAcum = data.totalHoras;

        initCharts(data.registros);

    } catch (error) {
        console.error("Error dashboard:", error);
        alert("No se pudieron cargar los datos del dashboard ❌");
    }
}

// --- Al cargar la página ---
document.addEventListener("DOMContentLoaded", async () => {
    await loadDashboardData();

    const btnCalc = document.getElementById("btnCalculate");
    btnCalc.addEventListener("click", runPrediction);

    runPrediction();
});

// --- Función del Predictor ---
function runPrediction() {
    const weeklyInput = Number(document.getElementById("weeklyHours").value);
    const remainingHours = CONFIG.totalGoal - CONFIG.currentAcum;

    if (weeklyInput > 0) {
        const weeksNeeded = (remainingHours / weeklyInput).toFixed(1);
        const totalDays = Math.ceil(weeksNeeded * CONFIG.daysPerWeek);

        document.getElementById("resWeeks").innerText = `${weeksNeeded} semanas`;
        document.getElementById("resDays").innerText = `${totalDays} días`;
    }
}

// --- Inicialización de Gráficos (Chart.js) ---
function initCharts(registros = []) {

    // Preparar datos reales
    const weeklyHours = registros.map(r => Number(r.horas));
    const labels = registros.map((_, i) => `Semana ${i + 1}`);

    // 🔁 Evitar duplicar gráficos
    if (doughnutChart) doughnutChart.destroy();
    if (lineChart) lineChart.destroy();

    // --- Gráfico de Dona ---
    const ctxDoughnut = document
        .getElementById("doughnutChart")
        .getContext("2d");

    doughnutChart = new Chart(ctxDoughnut, {
        type: "doughnut",
        data: {
            labels: ["Completado", "Restante"],
            datasets: [{
                data: [
                    CONFIG.currentAcum,
                    CONFIG.totalGoal - CONFIG.currentAcum
                ],
                backgroundColor: ["#10b981", "#f3f4f6"],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "75%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        font: { family: "Inter", size: 12 },
                        boxWidth: 15,
                        usePointStyle: true
                    }
                }
            }
        }
    });

    // --- Gráfico de Líneas ---
    const ctxLine = document
        .getElementById("lineChart")
        .getContext("2d");

    lineChart = new Chart(ctxLine, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Horas Registradas",
                data: weeklyHours,
                borderColor: "#10b981",
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, "rgba(16, 185, 129, 0.2)");
                    gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: "#10b981"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: "#f3f4f6" },
                    ticks: { font: { family: "Inter", size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: "Inter", size: 11 } }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}