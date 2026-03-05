import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import swal from "sweetalert";
import html2pdf from "html2pdf.js"; 
import "../assets/dashboard.css";

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [vistaActiva, setVistaActiva] = useState("revision");

  const [alumnos, setAlumnos] = useState([]);
  const [evidencias, setEvidencias] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [reportes, setReportes] = useState([]); // <-- Ahora inicia vacío para recibir datos reales

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const resEvidencias = await axios.get("http://localhost:3000/admin/registros", config);
      setEvidencias(resEvidencias.data);

      const resAlumnos = await axios.get("http://localhost:3000/admin/alumnos", config);
      setAlumnos(resAlumnos.data);

      const resInstituciones = await axios.get("http://localhost:3000/instituciones", config);
      if(resInstituciones.data.length > 0){
        setInstituciones(resInstituciones.data);
      }

      // 🔥 NUEVO: Traemos los reportes reales de los alumnos
      try {
        const resReportes = await axios.get("http://localhost:3000/admin/reportes", config);
        setReportes(resReportes.data);
      } catch (e) {
        console.log("Aún no hay reportes o falta la tabla en BD");
      }

    } catch (error) {
      console.error("Error al cargar datos del admin", error);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    if (!token || role !== "admin") {
      navigate("/");
    } else {
      cargarDatos();
    }
  }, [navigate]);

  const cerrarSesion = () => { localStorage.clear(); navigate("/"); };

  const handleVerEvidencia = (archivoRuta) => {
    const urlCompleta = `http://localhost:3000${archivoRuta}`;
    window.open(urlCompleta, '_blank'); 
  };

  const cambiarEstadoEvidencia = async (idEvidencia, nuevoEstado) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:3000/admin/registro/${idEvidencia}`, 
        { estado: nuevoEstado }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await cargarDatos(); 
      swal("¡Listo!", `La evidencia ha sido ${nuevoEstado.toLowerCase()}.`, "success");
    } catch (error) {
      swal("Error", "No se pudo actualizar la evidencia.", "error");
    }
  };

  const handleAprobar = (idEvidencia) => swal({ title: "¿Aprobar horas?", icon: "warning", buttons: ["Cancelar", "Sí"] }).then(w => { if (w) cambiarEstadoEvidencia(idEvidencia, "Aprobado"); });
  const handleRechazar = (idEvidencia) => swal({ title: "¿Rechazar evidencia?", icon: "error", buttons: ["Cancelar", "Sí"], dangerMode: true }).then(w => { if (w) cambiarEstadoEvidencia(idEvidencia, "Rechazado"); });

  const handleAgregarInstitucion = async () => {
    const nombre = await swal({ title: "Nueva Institución", content: "input", buttons: ["Cancelar", "Guardar"] });
    if (nombre) {
      try {
        const token = localStorage.getItem("token");
        const respuesta = await axios.post("http://localhost:3000/admin/instituciones", { nombre }, { headers: { Authorization: `Bearer ${token}` } });
        setInstituciones(prev => [...prev, { id: respuesta.data.id, nombre: nombre, alumnosActivos: 0 }]);
        swal("¡Guardada!", "La institución se agregó.", "success");
      } catch (error) {
        swal("Error", "No se pudo guardar la institución.", "error");
      }
    }
  };

  // ==========================================
  // 🚀 GENERADOR DE PDF (PLANTILLA COMPLETA)
  // ==========================================
  const generarPDF = (reporte) => {
    swal({ title: "Generando Formato SS.02", text: "Creando PDF con todos los datos...", icon: "info", buttons: false });

    const elemento = document.createElement("div");
    // Extraemos las fechas de MySQL y las ponemos bonitas
    const fechaGeneracion = new Date().toLocaleDateString();
    const fechaReporte = reporte.fecha_creacion ? new Date(reporte.fecha_creacion).toLocaleDateString() : fechaGeneracion;

    elemento.innerHTML = `
      <div style="padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333;">
        
        <div style="border-bottom: 3px solid #1dbf73; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="color: #112a20; margin: 0; font-size: 26px;">TECMILENIO</h1>
          <h2 style="color: #4b5563; margin: 5px 0 0 0; font-size: 15px; font-weight: normal;">SS.02. Plantilla Reporte de Seguimiento</h2>
        </div>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
          <h3 style="margin-top: 0; font-size: 16px; color: #112a20; border-bottom: 1px solid #d1d5db; padding-bottom: 5px;">I. Datos del Alumno</h3>
          <table style="width: 100%; font-size: 13px;">
            <tr>
              <td style="padding-bottom: 5px;"><strong>Nombre:</strong> ${reporte.alumno}</td>
              <td style="padding-bottom: 5px;"><strong>Matrícula:</strong> ${reporte.matricula}</td>
            </tr>
            <tr>
              <td><strong>Fecha de Envío:</strong> ${fechaReporte}</td>
              <td><strong>Total de Horas Reportadas:</strong> <span style="color: #1dbf73; font-weight: bold;">${reporte.horas_reportadas || 0} h</span></td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 15px; color: #112a20; border-bottom: 1px solid #1dbf73; padding-bottom: 4px;">IV. Impacto del Servicio Social</h3>
          <p style="font-size: 12px; text-align: justify; line-height: 1.5; background: #fff; border: 1px solid #e5e7eb; padding: 10px; border-radius: 5px;">
            ${reporte.impacto || "El alumno no proporcionó detalles de impacto."}
          </p>
        </div>

        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div style="flex: 1;">
            <h3 style="font-size: 15px; color: #112a20; border-bottom: 1px solid #f59e0b; padding-bottom: 4px;">V. Áreas de Mejora</h3>
            <div style="font-size: 12px; background: #fff; border: 1px solid #e5e7eb; padding: 10px; border-radius: 5px; height: 100px; overflow: hidden;">
              <strong>Áreas identificadas:</strong><br/> ${reporte.areas_mejora || "N/A"}<br/><br/>
              <strong>Propuestas de solución:</strong><br/> ${reporte.propuestas_solucion || "N/A"}
            </div>
          </div>
          <div style="flex: 1;">
            <h3 style="font-size: 15px; color: #112a20; border-bottom: 1px solid #3b82f6; padding-bottom: 4px;">VI. Autoevaluación</h3>
            <div style="font-size: 12px; background: #fff; border: 1px solid #e5e7eb; padding: 10px; border-radius: 5px; height: 100px; overflow: hidden;">
              <strong>Fortalezas:</strong><br/> ${reporte.fortalezas || "N/A"}<br/><br/>
              <strong>Áreas de oportunidad:</strong><br/> ${reporte.areas_oportunidad || "N/A"}
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 15px; color: #112a20; border-bottom: 1px solid #6b7280; padding-bottom: 4px;">VII. Detalles Finales</h3>
          <p style="font-size: 12px; text-align: justify; line-height: 1.5; background: #fff; border: 1px solid #e5e7eb; padding: 10px; border-radius: 5px;">
            ${reporte.detalles || "Sin comentarios adicionales."}
          </p>
        </div>

        <div style="text-align: center; margin-top: 50px;">
          <hr style="width: 250px; border: none; border-top: 1px solid #000;">
          <p style="margin-top: 5px; font-weight: bold; font-size: 14px;">Firma del Estudiante</p>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">${reporte.alumno}</p>
        </div>
      </div>
    `;

    const opciones = {
      margin:       0.4,
      filename:     `SS02_${reporte.matricula}_${reporte.alumno}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 }, 
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opciones).from(elemento).save().then(() => {
      swal("¡PDF Descargado!", "El documento se generó con toda la información.", "success");
    });
  };

  const totalAlumnos = alumnos.length;
  const evidenciasPendientes = evidencias.length;
  const alumnosTerminados = alumnos.filter(a => Number(a.horasAprobadas) >= Number(a.total_horas)).length;
  const tagStyle = { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };
  const getCarreraColor = (carrera) => {
    if (carrera === 'IDS') return { backgroundColor: '#e0e7ff', color: '#4338ca' };
    if (carrera === 'LDG') return { backgroundColor: '#fce7f3', color: '#be185d' };
    return { backgroundColor: '#f3f4f6', color: '#4b5563' };
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo"><h2>CSS Control</h2><p>Panel de Administración</p></div>
        <ul className="menu">
          <li className={vistaActiva === "revision" ? "active" : ""} onClick={() => setVistaActiva("revision")}>⏱️ Validar Horas</li>
          <li className={vistaActiva === "alumnos" ? "active" : ""} onClick={() => setVistaActiva("alumnos")}>👥 Base de Alumnos</li>
          <li className={vistaActiva === "instituciones" ? "active" : ""} onClick={() => setVistaActiva("instituciones")}>🏢 Instituciones SS</li>
          <li className={vistaActiva === "reportes" ? "active" : ""} onClick={() => setVistaActiva("reportes")}>📑 Generar PDFs SS.02</li>
          <li style={{ color: '#ff6b6b', marginTop: 'auto', cursor: 'pointer' }} onClick={cerrarSesion}>🚪 Salir del Sistema</li>
        </ul>
      </aside>

      <main className="content">
        <header className="top-header">
          <h1>Panel de Control Administrador 🛡️</h1>
          <p>Supervisa y gestiona el Servicio Social del campus.</p>
        </header>

        <section className="stats-grid">
          <div className="stat-card" style={{ borderTopColor: '#3b82f6' }}><span>Alumnos Activos</span><h2>{totalAlumnos}</h2></div>
          <div className="stat-card" style={{ borderTopColor: '#f59e0b' }}><span>Evidencias Pendientes</span><h2>{evidenciasPendientes}</h2></div>
          <div className="stat-card" style={{ borderTopColor: '#10b981' }}><span>Alumnos Graduados 🎉</span><h2>{alumnosTerminados}</h2></div>
        </section>

        {vistaActiva === "revision" && (
          <section className="card-white">
            <h3 style={{ marginBottom: '15px' }}>📋 Evidencias en Revisión</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px' }}>Alumno</th>
                    <th style={{ padding: '12px' }}>Carrera</th>
                    <th style={{ padding: '12px' }}>Fecha Act.</th>
                    <th style={{ padding: '12px' }}>Horas</th>
                    <th style={{ padding: '12px' }}>Evidencia</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {evidencias.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>🎉 ¡Todo al día! No hay evidencias pendientes.</td></tr>
                  ) : (
                    evidencias.map((ev) => (
                      <tr key={ev.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px' }}><strong>{ev.nombre}</strong><br/><span style={{ fontSize: '12px', color: '#6b7280' }}>{ev.matricula}</span></td>
                        <td style={{ padding: '12px' }}><span style={{...tagStyle, ...getCarreraColor(ev.carrera)}}>{ev.carrera}</span></td>
                        <td style={{ padding: '12px' }}>{new Date(ev.fecha).toLocaleDateString()}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#1dbf73' }}>+{ev.horas} h</td>
                        <td style={{ padding: '12px' }}>
                          <button onClick={() => handleVerEvidencia(ev.archivo)} style={{ padding: '6px 12px', backgroundColor: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🖼️ Ver</button>
                        </td>
                        <td style={{ padding: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => handleAprobar(ev.id)} style={{ padding: '6px 12px', backgroundColor: '#1dbf73', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✓ Aprobar</button>
                          <button onClick={() => handleRechazar(ev.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {vistaActiva === "alumnos" && (
           <section className="card-white">
           <h3 style={{ marginBottom: '15px' }}>👥 Directorio de Alumnos</h3>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
             {alumnos.map(al => {
               const porcentaje = (al.horasAprobadas / al.total_horas) * 100;
               const terminado = al.horasAprobadas >= al.total_horas;
               return (
                 <div key={al.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', position: 'relative', backgroundColor: terminado ? '#f0fdf4' : 'white' }}>
                   {terminado && <span style={{ position: 'absolute', top: 10, right: 10, fontSize: '20px' }}>🏆</span>}
                   <h4 style={{ margin: '0 0 5px 0', color: '#112a20' }}>{al.nombre}</h4>
                   <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#6b7280' }}>{al.matricula} | {al.institucion || 'Sin asignar'}</p>
                   <span style={{...tagStyle, ...getCarreraColor(al.carrera)}}>{al.carrera}</span>
                   <div style={{ marginTop: '20px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                       <span style={{ color: terminado ? '#166534' : '#374151' }}>Progreso</span>
                       <span style={{ color: terminado ? '#166534' : '#1dbf73' }}>{al.horasAprobadas} / {al.total_horas} h</span>
                     </div>
                     <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                       <div style={{ width: `${Math.min(porcentaje, 100)}%`, backgroundColor: terminado ? '#16a34a' : '#1dbf73', height: '100%', transition: 'width 0.5s ease' }}></div>
                     </div>
                   </div>
                 </div>
               )
             })}
           </div>
         </section>
        )}

        {vistaActiva === "instituciones" && (
          <section className="card-white">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>🏢 Instituciones Vinculadas</h3>
              <button onClick={handleAgregarInstitucion} style={{ padding: '8px 15px', backgroundColor: '#112a20', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Nueva Institución</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px' }}>Nombre</th>
                  <th style={{ padding: '12px' }}>Alumnos Activos</th>
                </tr>
              </thead>
              <tbody>
                {instituciones.map(inst => (
                  <tr key={inst.id || inst.nombre} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{inst.nombre}</td>
                    <td style={{ padding: '12px' }}>{inst.alumnosActivos || 0} alumnos</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {vistaActiva === "reportes" && (
          <section className="card-white">
            <h3 style={{ marginBottom: '15px' }}>📑 Generador de Formatos SS.02</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead><tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}><th style={{ padding: '12px' }}>Alumno</th><th style={{ padding: '12px' }}>Fecha Reporte</th><th style={{ padding: '12px' }}>Horas</th><th style={{ padding: '12px', textAlign: 'center' }}>Acción</th></tr></thead>
              <tbody>
                {reportes.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No hay reportes enviados por los alumnos aún.</td></tr>
                ) : (
                  reportes.map(rep => (
                    <tr key={rep.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px' }}><strong>{rep.alumno}</strong><br/><span style={{ fontSize: '12px', color: '#6b7280' }}>{rep.matricula}</span></td>
                      <td style={{ padding: '12px' }}>{new Date(rep.fecha_creacion).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}><span style={{ padding: '4px 8px', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{rep.horas_reportadas} hrs</span></td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => generarPDF(rep)} style={{ padding: '8px 15px', backgroundColor: '#112a20', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>📥 Descargar PDF Completo</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
};

export default DashboardAdmin;