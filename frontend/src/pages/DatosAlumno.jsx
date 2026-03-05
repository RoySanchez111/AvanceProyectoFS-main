import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import swal from "sweetalert";
import "../assets/datos.css";

const DatosAlumno = () => {
  const navigate = useNavigate();
  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:3000/instituciones")
      .then(res => setInstituciones(res.data))
      .catch(() => console.error("Error al cargar instituciones de la base de datos"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      await axios.post("http://localhost:3000/auth/register", data);
      
      swal("¡Éxito!", "Cuenta creada correctamente. Ahora puedes iniciar sesión.", "success")
        .then(() => navigate("/"));
        
    } catch (error) {
      swal("Error", "No se pudo registrar. Verifica que el correo no esté en uso.", "error");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="registro-wrapper">
      <div className="registro-card">
        
        {/* PANEL IZQUIERDO OSCURO */}
        <div className="registro-left">
          <div>
            <h2>CSS Control</h2>
            <p>Plataforma de Alumnos</p>
          </div>
          <div className="registro-left-footer">
            <h3>Únete al Sistema 🚀</h3>
            <p>Registra tus datos oficiales para iniciar el control de tus horas de Servicio Social.</p>
          </div>
        </div>

        {/* PANEL DERECHO CON FORMULARIO */}
        <div className="registro-right">
          <h2>Completar Perfil</h2>
          <p>Ingresa tu información institucional</p>

          <form onSubmit={handleSubmit} className="registro-form">
            <input type="text" name="nombre" placeholder="Nombre Completo" required />
            
            <div className="form-grid">
              <input type="text" name="matricula" placeholder="Matrícula" required />
              <input type="text" name="carrera" placeholder="Carrera (Ej: IDS)" required />
            </div>

            <div className="input-group">
              <label>Lugar de Servicio Social</label>
              <select name="institucion" required>
                <option value="">Selecciona una opción...</option>
                {/* Aquí inyectamos los lugares desde la Base de Datos */}
                {instituciones.map(inst => (
                  <option key={inst.id} value={inst.nombre}>{inst.nombre}</option>
                ))}
              </select>
            </div>

            {/* ---> EL NUEVO CAMPO DE HORAS <--- */}
            <div className="input-group">
              <label>Total de Horas a Realizar</label>
              <input 
                type="number" 
                name="totalHoras" 
                placeholder="Ej: 480" 
                defaultValue="480" 
                min="1" 
                required 
              />
            </div>

            <input type="email" name="email" placeholder="Correo Electrónico" required />
            <input type="password" name="password" placeholder="Crea una contraseña" required />
            
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Registrando..." : "Crear Cuenta"}
            </button>
          </form>
          
          <div className="registro-footer">
            <p>¿Ya tienes cuenta? <span onClick={() => navigate("/")}>Inicia Sesión</span></p>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default DatosAlumno;