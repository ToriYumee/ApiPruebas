const mysql = require('mysql2');
const express = require('express');
const app = express();
const port = 80;

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

app.get('/registros', (req, res) => {
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
