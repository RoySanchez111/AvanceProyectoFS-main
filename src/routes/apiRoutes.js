const express = require("express");
const router = express.Router();

const { auth, isAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware"); 

const authController = require("../controllers/authController");
const dashboardController = require("../controllers/dashboardController");
const adminController = require("../controllers/adminController");
const reporteController = require("../controllers/reporteController");

// ==========================================
// Auth Routes (Rutas Públicas)
// ==========================================
router.post("/auth/login", authController.login);
router.post("/auth/register", authController.register); 
router.get("/instituciones", authController.getInstituciones); 

// ==========================================
// Student Dashboard Routes
// ==========================================
router.get("/dashboard", auth, dashboardController.getDashboardData);
router.post("/horas", auth, upload.single("foto"), dashboardController.logHours);
router.post("/reportes", auth, reporteController.submitReport);
router.get("/mis-reportes", auth, reporteController.getMyReports);

// ==========================================
// Admin Routes
// ==========================================
router.get("/admin/registros", auth, isAdmin, adminController.getPendingRecords);
router.put("/admin/registro/:id", auth, isAdmin, adminController.updateRecordStatus);
router.get("/admin/alumnos", auth, isAdmin, adminController.getStudentTotals);

// Admin Config Routes
router.post("/admin/instituciones", auth, isAdmin, adminController.addInstitucion);
router.delete("/admin/instituciones/:id", auth, isAdmin, adminController.deleteInstitucion);

// Admin Reports Route
router.get("/admin/reportes", auth, isAdmin, reporteController.getAdminReports);

module.exports = router;