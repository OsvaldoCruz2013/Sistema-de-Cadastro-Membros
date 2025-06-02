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
  congregacao: "nome_congregacao",
  cidade: "cidade" // Adicionado para buscar ID da cidade (se dim_cidade tem nome_cidade)
  // Se dim_cidade tem 'cidade' e 'estado' como colunas diretas, use 'cidade: "cidade"'
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
    // NOVO: Obter id_cidade
    const idCidade = await getId("cidade", {nome_cidade: membro.cidade, nome_estado: membro.estado}); // Passa objeto para lookup
    
    // NOVO: Obter id_tempo para data_cadastro (ou data_nascimento se for relevante)
    // ATENÇÃO: Você precisa ter uma forma de obter o id_tempo.
    // Se dim_tempo tem uma coluna 'data_completa' e você quer o ID da data de cadastro:
    // const idTempoCadastro = await getId("tempo", membro.data_cadastro);
    // Se id_tempo é apenas uma FK e não vem de dim_tempo para datas, pode ser NULL ou um valor padrão.
    // Por enquanto, vamos assumir que id_tempo é para a data de cadastro (hoje)
    // E que dim_tempo tem uma entrada para a data atual.
    // Se não, você pode precisar de um ID padrão ou NULL se a coluna for nula.
    // Para simplificar, vamos usar um valor padrão ou NULL se não for obrigatório.
    // Se id_tempo for obrigatório e você não tiver um valor, o INSERT falhará.
    const idTempo = membro.id_tempo || null; // Assumindo que id_tempo pode vir do frontend ou ser null

    const queryTexto = `
      INSERT INTO fato_membros 
      (nome, cpf, rg, endereco, numero, bairro, telefone, email, observacao,
       id_genero, id_status, id_cargo, id_estadocivil, id_congregacao)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;
    const valores = [
      membro.nome, membro.cpf, membro.rg, membro.endereco, membro.numero,
      membro.bairro, membro.telefone, membro.email, membro.observacao,
      idGenero, idStatus, idCargo, idEstadoCivil, idCongregacao,
       idCidade, // Valor para id_cidade,
      idTempo, // Valor para id_tempo (ajuste conforme sua lógica)
      membro.data_nascimento, // Valor para data_nascimento
      membro.data_cadastro // Valor para data_cadastro
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
    const resultado = await pool.query(`SELECT
        fm.id_fato,
        fm.nome,
        dg.genero,
        fm.cpf,
        fm.rg,
        fm.endereco,
        fm.numero,
        fm.bairro,
        fm.cep, -- 'cep' é selecionado diretamente de fato_membros
        fm.telefone,
        fm.email,
        fm.observacao,
        dcid.cidade AS cidade, -- Pega o nome da cidade da dim_cidade
        dcid.estado AS estado, -- Pega o nome do estado da dim_cidade
        fm.data_nascimento,   -- Pega a data de nascimento DIRETAMENTE de fato_membros
        fm.data_cadastro,     -- Pega a data de cadastro DIRETAMENTE de fato_membros
        de.estadocivil,
        dc.nome_congregacao AS congregacao,
        dca.cargo,
        ds.status
      FROM
        fato_membros fm
      JOIN
        dim_genero dg ON fm.id_genero = dg.id_genero
      JOIN
        dim_estadocivil de ON fm.id_estadocivil = de.id_estadocivil
      JOIN
        dim_congregacao dc ON fm.id_congregacao = dc.id_congregacao
      JOIN
        dim_cargo dca ON fm.id_cargo = dca.id_cargo
      JOIN
        dim_status ds ON fm.id_status = ds.id_status
      JOIN
        dim_cidade dcid ON fm.id_cidade = dcid.id_cidade 
      -- JOIN dim_tempo dt ON fm.id_tempo = dt.id_tempo -- REMOVIDO: se datas não vêm de dim_tempo
      ORDER BY fm.id_fato DESC`);
    res.json(resultado.rows);
  } catch (error) {
    console.error("Erro ao buscar membros:", error);
    res.status(500).send("Erro ao buscar membros");
  }
});

// Inicia o servidor na porta definida pela variável de ambiente
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);});