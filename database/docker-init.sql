-- ==========================================
-- INICIALIZACIÓN DE BASE DE DATOS: CSS Control
-- ==========================================

-- Forzamos la creación de la base de datos si no existe
CREATE DATABASE IF NOT EXISTS UsuariosSS;

-- Seleccionamos la base de datos
USE UsuariosSS;

-- 1. TABLA DE INSTITUCIONES
CREATE TABLE IF NOT EXISTS instituciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 2. TABLA DE USUARIOS (Alumnos y Administradores)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    matricula VARCHAR(50),
    carrera VARCHAR(100),
    institucion VARCHAR(255),
    total_horas INT DEFAULT 480,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('alumno', 'admin') NOT NULL DEFAULT 'alumno',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. TABLA DE REGISTRO DE HORAS Y EVIDENCIAS
CREATE TABLE IF NOT EXISTS registros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    fecha DATE NOT NULL,
    horas INT NOT NULL,
    archivo VARCHAR(255) NOT NULL,
    estado ENUM('Pendiente', 'Aprobado', 'Rechazado') DEFAULT 'Pendiente',
    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. TABLA DE REPORTES (Formato SS.02)
CREATE TABLE IF NOT EXISTS reportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    area_asignada VARCHAR(255),
    supervisor VARCHAR(255),
    correo_supervisor VARCHAR(255),
    telefono_supervisor VARCHAR(50),
    actividades TEXT,
    proyecto_especial TEXT,
    impacto TEXT,
    areas_mejora TEXT,
    propuestas_solucion TEXT,
    fortalezas TEXT,
    areas_oportunidad TEXT,
    detalles TEXT,
    horas_reportadas INT NOT NULL,
    estado VARCHAR(50) DEFAULT 'Pendiente',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==========================================
-- DATOS DE PRUEBA Y CONFIGURACIÓN INICIAL
-- ==========================================

-- Insertar algunas instituciones comunes para el catálogo
INSERT IGNORE INTO instituciones (nombre) VALUES 
('Grupo Proactivo'),
('Zona Industrial Huejotzingo'),
('Parque Industrial Cuautlancingo'),
('Parque Industrial FINSA'),
('Parque Industrial San Miguel'),
('Parque Industrial Xoxtla');

-- Insertar un Administrador Global por defecto
-- Correo: admin@tecmilenio.mx | Contraseña: admin123
INSERT IGNORE INTO users (nombre, matricula, email, password, role) 
VALUES (
    'Administrador CSS', 
    'ADMIN001', 
    'admin@tecmilenio.mx', 
    '$2a$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQix53KdO.sZnySOPm', -- bcrypt hash de "admin123"
    'admin'
);