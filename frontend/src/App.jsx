import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import DatosAlumno from './pages/DatosAlumno';
import DashboardAlumno from './pages/DashboardAlumno';
import DashboardAdmin from './pages/DashboardAdmin'; // <-- Importamos el nuevo panel

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/completar-perfil" element={<DatosAlumno />} />
        <Route path="/alumno" element={<DashboardAlumno />} />
        <Route path="/admin" element={<DashboardAdmin />} /> {/* <-- Activamos la ruta */}
      </Routes>
    </Router>
  );
}

export default App;