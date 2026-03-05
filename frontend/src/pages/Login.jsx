import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import swal from "sweetalert";
import "../assets/login.css"; 

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); 

    try {
      const response = await axios.post("http://localhost:3000/auth/login", { 
        email, 
        password 
      });
      
      const { token, role } = response.data;

      // Guardamos la sesión
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("email", email);

      // Verificamos el rol y REDIRECCIONAMOS
      if (role === "admin") {
        swal("Bienvenido", "Iniciando sesión como Administrador", "success").then(() => {
          navigate("/admin");
        });
      } else {
        swal("Bienvenido", "Iniciando sesión como Alumno", "success").then(() => {
          navigate("/alumno");
        });
      }
      
    } catch (error) {
      swal("Error de Acceso", "Credenciales incorrectas. Intenta de nuevo.", "error");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-left">
          <h2>CSS Control</h2>
          <p>Control de Servicio Social</p>
          <div className="login-left-footer">
            <h3>Bienvenido 👋</h3>
            <p>Inicia sesión para monitorear tu progreso en tiempo real.</p>
          </div>
        </div>

        <div className="login-right">
          <h2>Iniciar Sesión</h2>
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label>Correo</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              <label>Contraseña</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn-enter">Entrar</button>
          </form>
          <div className="login-footer">
            <p>¿No tienes cuenta? <span onClick={() => navigate("/completar-perfil")}>Regístrate</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;