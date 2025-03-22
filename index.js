const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = 80;

app.use(cors());
app.use(express.json());

const SECRET_KEY = 'TuLlaveSecreta'; // Cambia esto a una llave más segura

const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '0612',
  database: 'pruebas',
  port: 3306,
});

connection.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

// Middleware para verificar tokens
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).send('Token requerido.');

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).send('Token inválido.');
    req.userId = decoded.id;
    next();
  });
}

// Credenciales por defecto (solo para pruebas)
const DEFAULT_USER = {
  username: 'admin',
  password: 'admin123',
  id: 1, // ID ficticio para el usuario por defecto
};

// Ruta de autenticación
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Verificar credenciales por defecto
  if (username === DEFAULT_USER.username && password === DEFAULT_USER.password) {
    const token = jwt.sign({ id: DEFAULT_USER.id }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }

  // Si no coincide con las credenciales por defecto, consultar la base de datos
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  connection.query(query, [username, password], (err, results) => {
    if (err) return res.status(500).send('Error al autenticar');
    if (results.length === 0) return res.status(401).send('Credenciales inválidas');

    const token = jwt.sign({ id: results[0].id }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  });
});

// Ruta protegida
app.get('/registros', verifyToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const countQuery = 'SELECT COUNT(*) as total FROM registros';
  connection.query(countQuery, (err, countResult) => {
    if (err) {
      return res.status(500).send('Error al contar registros');
    }

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    const dataQuery = `SELECT * FROM registros LIMIT ${limit} OFFSET ${offset}`;
    connection.query(dataQuery, (err, results) => {
      if (err) {
        res.status(500).send('Error al obtener registros');
      } else {
        res.json({
          total,
          totalPages,
          page,
          limit,
          data: results
        });
      }
    });
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});