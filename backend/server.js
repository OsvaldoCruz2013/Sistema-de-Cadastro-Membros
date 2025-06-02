require("dotenv").config(); // Carrega variáveis de ambiente do .env

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg"); // Usa { Pool } para desestruturar
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();

// --- INÍCIO DAS CORREÇÕES ---

// 1. Configura a porta para usar a variável de ambiente do Render (ou 3000 localmente)
const PORT = process.env.PORT || 3000;

// Permite requisições de outras origens (CORS)
app.use(cors());

// Permite que o Express leia JSON do corpo das requisições
app.use(express.json());

// 2. REMOVIDO: Linha que fazia o backend servir arquivos estáticos do frontend
// app.use(express.static(path.join(__dirname,"../frontend"))); 

// 3. REMOVIDO: Rota que fazia o backend servir a página HTML raiz
// app.get("/",(req,res)=>{res.sendFile(path.join(__dirname,"../frontend/login.html"))});

// --- FIM DAS CORREÇÕES ---


// Configuração do pool de conexão com o PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false // Necessário para alguns bancos de dados em nuvem
  }
});

// Mapeamento de colunas para IDs de dimensão
const colunasDimensoes = {
  genero: "genero",
  status: "status",
  cargo: "cargo",
  estadocivil: "estadocivil",
  congregacao: "nome_congregacao"
};

// Função auxiliar para buscar IDs de dimensão
const getId = async (dimensao, valor) => {
  const colunaBusca = colunasDimensoes[dimensao];
  if (!colunaBusca) {
    throw new Error(`Coluna de busca não definida para ${dimensao}`);
  }
  const resultado = await pool.query(
    `SELECT id_${dimensao} FROM dim_${dimensao} WHERE LOWER(${colunaBusca}) = LOWER($1)`,
    [valor]
  );
  if (resultado.rows.length === 0) {
    throw new Error(`Valor "${valor}" não encontrado em dim_${dimensao}`);
  }
  return resultado.rows[0][`id_${dimensao}`];
};

// Rota de Login
app.post("/api/login", async (req, res) => {
  const { usuario, senha } = req.body;
  try {
    const resultado = await pool.query("SELECT * FROM usuarios WHERE usuario = $1", [usuario]);
    if (resultado.rows.length === 0) {
      return res.status(401).send("Usuário não encontrado");
    }
    const usuarioBanco = resultado.rows[0];
    if (!await bcrypt.compare(senha, usuarioBanco.senha)) {
      return res.status(401).send("Senha incorreta");
    }
    res.send({ mensagem: "Login bem-sucedido" });
  } catch (error) {
    console.error("Erro durante login:", error);
    res.status(500).send("Erro no servidor");
  }
});

// Rota para Salvar Membros
app.post("/api/membros", async (req, res) => {
  const membro = req.body;
  try {
    const idGenero = await getId("genero", membro.genero);
    const idStatus = await getId("status", membro.status);
    const idCargo = await getId("cargo", membro.cargo);
    const idEstadoCivil = await getId("estadocivil", membro.estadocivil);
    const idCongregacao = await getId("congregacao", membro.congregacao);

    const queryTexto = `
      INSERT INTO fato_membros 
      (nome, cpf, rg, endereco, numero, bairro, telefone, email, observacao,
       id_genero, id_status, id_cargo, id_estadocivil, id_congregacao)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;
    const valores = [
      membro.nome, membro.cpf, membro.rg, membro.endereco, membro.numero,
      membro.bairro, membro.telefone, membro.email, membro.observacao,
      idGenero, idStatus, idCargo, idEstadoCivil, idCongregacao
    ];

    await pool.query(queryTexto, valores);
    res.send("Membro salvo com sucesso");
  } catch (error) {
    console.error("Erro detalhado ao salvar membro:", error);
    res.status(500).send("Erro ao salvar membro");
  }
});

// Rota para Buscar Membros
app.get("/api/membros", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM fato_membros ORDER BY id_fato DESC");
    res.json(resultado.rows);
  } catch (error) {
    console.error("Erro ao buscar membros:", error);
    res.status(500).send("Erro ao buscar membros");
  }
});

// Inicia o servidor na porta definida pela variável de ambiente
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});