const axios = require('axios');

exports.generarPDF = async (req, res) => {
    try {
        const reporte = req.body;
        console.log("=== 📄 SOLICITANDO PDF A DOCRAPTOR ===");
        console.log("Alumno:", reporte.alumno);

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;padding:20px;}</style></head>
            <body>
                <h1 style="border-bottom: 3px solid #1dbf73; color: #112a20;">TECMILENIO</h1>
                <h2>1º Reporte de Servicio Social</h2>
                <p><strong>Alumno:</strong> ${reporte.alumno}</p>
                <p><strong>Matrícula:</strong> ${reporte.matricula}</p>
                <p><strong>Horas Aprobadas:</strong> ${reporte.horasAprobadas || '0'} h</p>
            </body>
            </html>
        `;

        const docRaptorResponse = await axios.post('https://docraptor.com/docs/api', {
            test: true, 
            document_type: "pdf",
            document_content: htmlContent,
            name: `SS02_${reporte.matricula}.pdf`
        }, {
            auth: {
                username: "YOUR_API_KEY_HERE", // En modo test esto suele funcionar
                password: ""
            },
            responseType: 'arraybuffer'
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=SS02.pdf`);
        res.send(docRaptorResponse.data);
        
        console.log("✅ PDF Generado y enviado a React.");

    } catch (error) {
        // AQUÍ ATRAPAMOS EL ERROR REAL DE LA API
        console.error("❌ ERROR FATAL EN DOCRAPTOR:");
        if (error.response) {
            // Convierte el arraybuffer de error a texto para que podamos leerlo
            const errorText = Buffer.from(error.response.data).toString('utf8');
            console.error("Razón:", errorText);
        } else {
            console.error(error.message);
        }
        res.status(500).json({ message: 'Error al generar el PDF' });
    }
};