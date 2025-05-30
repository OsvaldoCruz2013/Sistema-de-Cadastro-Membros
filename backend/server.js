
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

// Rota de login
app.post('/api/login', async (req, res) => {
  const { usuario, senha } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);
    if (result.rows.length === 0) return res.status(401).send('Usuário não encontrado');

    const usuarioDB = result.rows[0];
    const isMatch = await bcrypt.compare(senha, usuarioDB.senha);
    if (!isMatch) return res.status(401).send('Senha incorreta');

    res.send({ mensagem: 'Login bem-sucedido' });
  } catch (err) {
    res.status(500).send('Erro no servidor');
  }
});

// Rota para salvar membro
app.post('/api/membros', async (req, res) => {
  const m = req.body;
  const query = `
    INSERT INTO membros 
    (nome, genero, cpf, rg, endereco, numero, bairro, cidade, estado, cep, telefone, email, data_nascimento, data_cadastro, estadocivil, congregacao, cargo, status, observacao)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
  `;
  const values = [
    m.nome, m.genero, m.cpf, m.rg, m.endereco, m.numero, m.bairro, m.cidade,
    m.estado, m.cep, m.telefone, m.email, m.data_nascimento, m.data_cadastro,
    m.estadocivil, m.congregacao, m.cargo, m.status, m.observacao
  ];

  try {
    await pool.query(query, values);
    res.send('Membro salvo com sucesso');
  } catch (err) {
    res.status(500).send('Erro ao salvar membro');
  }
});

// Rota para obter membros (GET)
app.get('/api/membros', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM membros ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Erro ao buscar membros');
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
