const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

const apiRoutes = require('./src/routes/apiRoutes');
app.use('/', apiRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("================================");
    console.log(`✅ Servidor Full-Stack corriendo en el puerto: ${PORT}`);
    console.log("================================");
});