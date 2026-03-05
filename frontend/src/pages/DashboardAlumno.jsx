import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import swal from "sweetalert";
import "../assets/dashboard.css";

const DashboardAlumno = () => {
  const navigate = useNavigate();
  const [vistaActiva, setVistaActiva] = useState("progreso");
  
  const [perfil, setPerfil] = useState({ 
    nombre: "Cargando...", matricula: "", carrera: "", campus: "Puebla", institucion: "", totalHoras: 480 
  });
  const [datosHoras, setDatosHoras] = useState({ aprobadas: 0, pendientes: 0 });
  const [loading, setLoading] = useState(false);
  const [ritmo, setRitmo] = useState({ horasPorDia: 4, diasPorSemana: 5 });

  useEffect(() => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    if (!token || role !== "alumno") { navigate("/"); return; }
    cargarInformacion(token);
  }, [navigate]);

  // 🔥 1. AHORA SÍ PEDIMOS LOS DATOS REALES A MYSQL
  const cargarInformacion = async (token) => {
    try {
      const res = await axios.get("http://localhost:3000/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if(res.data.perfil) {
        setPerfil({
          nombre: res.data.perfil.nombre,
          matricula: res.data.perfil.matricula,
          carrera: res.data.perfil.carrera,
          campus: "Puebla", 
          institucion: res.data.perfil.institucion,
          totalHoras: res.data.perfil.total_horas || 480
        });
      }
      setDatosHoras({ 
        aprobadas: res.data.totalHoras || 0, 
        pendientes: res.data.horasPendientes || 0 
      });
    } catch (error) {
      console.error("Error al cargar la información:", error);
    }
  };

  const handleGuardarHoras = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:3000/horas", formData, {
        headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` }
      });

      const horasSometidas = Number(formData.get("horas"));
      swal("¡Enviado!", `Tus ${horasSometidas} horas y tu evidencia fueron subidas con éxito.`, "success");
      
      setDatosHoras(prev => ({ ...prev, pendientes: prev.pendientes + horasSometidas }));
      e.target.reset(); 
    } catch (error) {
      console.error(error);
      swal("Error", "Hubo un problema al subir la evidencia.", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 2. AHORA SÍ ENVIAMOS EL REPORTE AL BACKEND REAL
  const handleEnviarReporte = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Recolectamos todos los campos del formulario
    const formData = new FormData(e.target);
    const datosReporte = Object.fromEntries(formData.entries());

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:3000/reportes", datosReporte, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      swal("¡Reporte Enviado!", "Tu reporte SS.02 ha sido enviado. El administrador ahora puede generar tu PDF.", "success");
      e.target.reset(); 
      setVistaActiva("progreso");
    } catch (error) {
      console.error(error);
      swal("Error", "No se pudo enviar el reporte. Verifica tu conexión.", "error");
    } finally {
      setLoading(false);
    }
  };

  const cerrarSesion = () => { localStorage.clear(); navigate("/"); };

  const horasRestantes = Math.max(perfil.totalHoras - datosHoras.aprobadas, 0);
  const horasPorSemana = ritmo.horasPorDia * ritmo.diasPorSemana;
  const semanasRestantes = horasPorSemana > 0 ? horasRestantes / horasPorSemana : 0;
  const mesesAprox = (semanasRestantes / 4.345).toFixed(1);

  const calcularFechaEstimada = () => {
    if (horasPorSemana === 0) return "Sin progreso";
    const hoy = new Date();
    const fechaFin = new Date(hoy.getTime() + (semanasRestantes * 7 * 24 * 60 * 60 * 1000));
    return fechaFin.toLocaleDateString("es-MX", { month: 'long', year: 'numeric' });
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <h2>CSS Control</h2>
          <p>Portal del Alumno</p>
        </div>
        <ul className="menu">
          <li className={vistaActiva === "progreso" ? "active" : ""} onClick={() => setVistaActiva("progreso")}>📊 Mi Progreso</li>
          <li className={vistaActiva === "reportes" ? "active" : ""} onClick={() => setVistaActiva("reportes")}>📑 Reportes SS.02</li>
          <li style={{ color: '#ff6b6b', marginTop: 'auto', cursor: 'pointer' }} onClick={cerrarSesion}>🚪 Salir</li>
        </ul>
      </aside>

      <main className="content">
        <header className="top-header">
          {/* Cortamos el nombre para que solo diga "Hola, Nombre" */}
          <h1>{vistaActiva === "progreso" ? `¡Hola, ${perfil.nombre.split(' ')[0]}! 👋` : '📝 Generador de Reporte SS.02'}</h1>
          <p>Servicio Social en: <strong>{perfil.institucion}</strong></p>
        </header>

        {vistaActiva === "progreso" && (
          <>
            <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="stat-card"><span>Aprobadas</span><h2>{datosHoras.aprobadas} h</h2></div>
              <div className="stat-card" style={{ borderTopColor: '#f59e0b' }}><span>En Revisión</span><h2>{datosHoras.pendientes} h</h2></div>
              <div className="stat-card" style={{ borderTopColor: '#3b82f6' }}><span>Restantes</span><h2>{horasRestantes} h</h2></div>
              <div className="stat-card" style={{ borderTopColor: '#8b5cf6' }}><span>Fin Estimado</span><h2 style={{ fontSize: '24px', textTransform: 'capitalize' }}>{calcularFechaEstimada()}</h2></div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <section className="card-white" style={{ marginBottom: 0 }}>
                <h3>📝 Registrar Horas</h3>
                <form onSubmit={handleGuardarHoras} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                  <div><label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '5px' }}>Fecha de la actividad</label><input type="date" name="fecha" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} /></div>
                  <div><label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '5px' }}>Horas realizadas</label><input type="number" name="horas" placeholder="Ej: 4" min="1" max="10" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} /></div>
                  
                  <div><label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '5px' }}>Foto de Evidencia</label><input type="file" name="foto" accept="image/*, application/pdf" required style={{ width: '100%', padding: '8px', border: '1px dashed #1dbf73', borderRadius: '8px', backgroundColor: '#f0fdf4' }} /></div>
                  
                  <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Enviando..." : "Subir Evidencia"}</button>
                </form>
              </section>

              <section className="card-white" style={{ marginBottom: 0, border: '2px solid #f3f4f6', backgroundColor: '#fafafa' }}>
                <h3>🚀 Simulador de Progreso</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Horas por día</label><span style={{ color: '#1dbf73', fontWeight: 'bold' }}>{ritmo.horasPorDia} h</span></div>
                    <input type="range" min="1" max="8" value={ritmo.horasPorDia} onChange={(e) => setRitmo({...ritmo, horasPorDia: Number(e.target.value)})} style={{ width: '100%', accentColor: '#1dbf73', cursor: 'pointer' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Días por semana</label><span style={{ color: '#1dbf73', fontWeight: 'bold' }}>{ritmo.diasPorSemana} días</span></div>
                    <input type="range" min="1" max="7" value={ritmo.diasPorSemana} onChange={(e) => setRitmo({...ritmo, diasPorSemana: Number(e.target.value)})} style={{ width: '100%', accentColor: '#1dbf73', cursor: 'pointer' }} />
                  </div>
                  <div style={{ backgroundColor: '#e6f7ef', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #1dbf73', marginTop: '10px' }}>
                    <p style={{ fontSize: '14px', color: '#163528', margin: 0 }}>A este ritmo, harás <strong>{horasPorSemana} horas por semana</strong>. <br/><br/>Te tomará aproximadamente <strong>{Math.ceil(semanasRestantes)} semanas</strong> (unos {mesesAprox} meses) completar tu servicio.</p>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}

        {vistaActiva === "reportes" && (
          <section className="card-white" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ borderBottom: '2px solid #1dbf73', paddingBottom: '10px', marginBottom: '20px' }}>
              <h2 style={{ color: '#112a20', fontSize: '20px' }}>1º Reporte de Servicio Social (Medio Término)</h2>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>Completa los campos para enviar tu información al administrador.</p>
            </div>

            <form onSubmit={handleEnviarReporte} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div>
                <h3 style={{ fontSize: '16px', color: '#163528', marginBottom: '10px' }}>I. Información General del Estudiante</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                  <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>Nombre Completo:</label><p style={{ margin: 0, fontSize: '14px' }}>{perfil.nombre}</p></div>
                  <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>Matrícula:</label><p style={{ margin: 0, fontSize: '14px' }}>{perfil.matricula}</p></div>
                  <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>Carrera:</label><p style={{ margin: 0, fontSize: '14px' }}>{perfil.carrera}</p></div>
                  <div><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>Campus:</label><p style={{ margin: 0, fontSize: '14px' }}>{perfil.campus}</p></div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', color: '#163528', marginBottom: '10px' }}>II. Información de la Institución Receptora</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '5px' }}>Nombre de la Institución</label>
                    <input type="text" value={perfil.institucion} readOnly style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6' }} />
                  </div>
                  {/* 🔥 3. QUITAMOS LOS TEXTOS FALSOS DE "EJEMPLO" DE AQUÍ */}
                  <div><label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '5px' }}>Área o Departamento Asignado *</label><input type="text" name="area_asignada" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} /></div>
                  <div><label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '5px' }}>Nombre del Supervisor *</label><input type="text" name="supervisor" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} /></div>
                  <div><label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '5px' }}>Correo Electrónico de Contacto *</label><input type="email" name="correo_supervisor" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} /></div>
                  <div><label style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '5px' }}>Teléfono de Contacto</label><input type="text" name="telefono_supervisor" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} /></div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', color: '#163528', marginBottom: '10px' }}>III. Descripción de Actividades Realizadas</h3>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '5px' }}>Proporciona un resumen detallado</label>
                <textarea name="actividades" rows="4" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}></textarea>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '5px', marginTop: '10px' }}>Menciona si participas en un proyecto en especial</label>
                <textarea name="proyecto_especial" rows="3" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}></textarea>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', color: '#163528', marginBottom: '10px' }}>IV. Impacto del Servicio Social</h3>
                <textarea name="impacto" rows="3" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', color: '#163528', marginBottom: '10px' }}>V. Áreas de Mejora</h3>
                  <textarea name="areas_mejora" placeholder="Áreas de mejora identificadas..." rows="3" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', marginBottom: '10px' }}></textarea>
                  <textarea name="propuestas_solucion" placeholder="Propuestas de solución..." rows="3" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}></textarea>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', color: '#163528', marginBottom: '10px' }}>VI. Autoevaluación</h3>
                  <textarea name="fortalezas" placeholder="Fortalezas Identificadas..." rows="3" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', marginBottom: '10px' }}></textarea>
                  <textarea name="areas_oportunidad" placeholder="Áreas de oportunidad..." rows="3" required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}></textarea>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', color: '#163528', marginBottom: '10px' }}>VII. Detalles Finales</h3>
                <textarea name="comentarios" rows="3" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', marginBottom: '15px' }}></textarea>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#e6f7ef', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #1dbf73' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#163528', margin: 0 }}>Total de horas reportadas:</label>
                  <input type="number" name="horas_reportadas" defaultValue={datosHoras.aprobadas} required style={{ width: '100px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontWeight: 'bold' }} />
                </div>
              </div>

              <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button type="button" onClick={() => setVistaActiva("progreso")} style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#374151' }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 30px' }}>{loading ? "Procesando..." : "Enviar al Administrador"}</button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
};

export default DashboardAlumno;