require("dotenv").config(); // Carrega variáveis de ambiente do .env

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg"); // Usa { Pool } para desestruturar
const bcrypt = require("bcrypt");
const path = require("path"); // 'path' é importado mas não será usado para servir estáticos

const app = express();

// 1. Configura a porta para usar a variável de ambiente do Render (ou 3000 localmente)
const PORT = process.env.PORT || 3000;

// Permite requisições de outras origens (CORS)
app.use(cors());

// Permite que o Express leia JSON do corpo das requisições
app.use(express.json());

// Linhas que faziam o backend servir arquivos estáticos do frontend foram removidas/comentadas
// app.use(express.static(path.join(__dirname,"../frontend"))); 
// app.get("/",(req,res)=>{res.sendFile(path.join(__dirname,"../frontend/login.html"))});


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
  cidade: "cidade", // Assumindo dim_cidade tem coluna 'cidade'
  tempo: "data_completa" // Assumindo dim_tempo tem coluna 'data_completa'
};

// Função auxiliar para buscar IDs de dimensão (e inserir se não existir para cidade/tempo)
const getId = async (dimensao, valor) => {
  const colunaBusca = colunasDimensoes[dimensao];
  if (!colunaBusca) {
    throw new Error(`Coluna de busca não definida para ${dimensao}`);
  }

  // Lógica específica para buscar id_cidade usando cidade e estado
  if (dimensao === "cidade") {
      // 'valor' aqui é um objeto { cidade: "...", estado: "..." }
      const resultado = await pool.query(
          `SELECT id_cidade FROM dim_cidade WHERE LOWER(cidade) = LOWER($1) AND LOWER(estado) = LOWER($2)`,
          [valor.cidade, valor.estado]
      );
      if (resultado.rows.length === 0) {
          // Se a cidade não existe, insere e retorna o novo ID
          const insertResult = await pool.query(
              `INSERT INTO dim_cidade (cidade, estado) VALUES ($1, $2) RETURNING id_cidade`,
              [valor.cidade, valor.estado]
          );
          return insertResult.rows[0].id_cidade;
      }
      return resultado.rows[0].id_cidade;
  }
  
  // Lógica específica para buscar id_tempo usando a data
  if (dimensao === "tempo") {
      // 'valor' aqui é a string da data (ex: 'YYYY-MM-DD')
      const resultado = await pool.query(
          `SELECT id_tempo FROM dim_tempo WHERE data_completa = $1`, 
          [valor] 
      );
      if (resultado.rows.length === 0) {
          // Se a data não existe na dim_tempo, insere e retorna o novo ID
          const insertResult = await pool.query(
              `INSERT INTO dim_tempo (data_completa) VALUES ($1) RETURNING id_tempo`,
              [valor]
          );
          return insertResult.rows[0].id_tempo;
      }
      return resultado.rows[0].id_tempo;
  }

  // Lógica geral para outras dimensões (genero, status, cargo, estadocivil, congregacao)
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
    if (resultado.rows.length === 0) { return res.status(401).send("Usuário não encontrado"); }
    const usuarioBanco = resultado.rows[0];
    if (!await bcrypt.compare(senha, usuarioBanco.senha)) { return res.status(401).send("Senha incorreta"); }
    res.send({ mensagem: "Login bem-sucedido" });
  } catch (error) {
    console.error("Erro durante login:", error);
    res.status(500).send("Erro no servidor");
  }
});

// Rota para Salvar Membros (POST - Criar)
app.post("/api/membros", async (req, res) => {
  const membro = req.body;
  try {
    // Obter IDs para dimensões
    const idGenero = await getId("genero", membro.genero);
    const idStatus = await getId("status", membro.status);
    const idCargo = await getId("cargo", membro.cargo);
    const idEstadoCivil = await getId("estadocivil", membro.estadocivil);
    const idCongregacao = await getId("congregacao", membro.congregacao);
    
    // Obter id_cidade (passando cidade e estado para a função getId)
    const idCidade = await getId("cidade", {cidade: membro.cidade, estado: membro.estado}); 
    
    // Obter id_tempo para data_cadastro (ou data_nascimento se for relevante)
    const idTempoNascimento = await getId("tempo", membro.data_nascimento); 
    const idTempoCadastro = await getId("tempo", membro.data_cadastro); 

    const queryTexto = `
      INSERT INTO fato_membros 
      (nome, cpf, rg, endereco, numero, bairro, telefone, email, observacao,
       id_genero, id_status, id_cargo, id_estadocivil, id_congregacao, 
       id_cidade, id_tempo, -- id_tempo será usado para data_cadastro (ou a principal data)
       cep, data_nascimento, data_cadastro, cidade) 
       -- ^^^ Estas colunas devem corresponder EXATAMENTE às colunas na sua tabela fato_membros
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      -- Total 20 parâmetros (contando os $1 a $20)
    `;
    // ATENÇÃO: A ORDEM DOS VALORES ABAIXO DEVE CORRESPONDER EXATAMENTE À ORDEM DAS COLUNAS ACIMA.
    const valores = [
      membro.nome, 
      membro.cpf, 
      membro.rg, 
      membro.endereco, 
      membro.numero,
      membro.bairro, 
      membro.telefone, 
      membro.email, 
      membro.observacao,
      idGenero,       // $10
      idStatus,       // $11
      idCargo,        // $12
      idEstadoCivil,  // $13
      idCongregacao,  // $14
      idCidade,       // $15 (FK para dim_cidade)
      idTempoCadastro, // $16 (FK para dim_tempo, usando data_cadastro como lookup)
      membro.cep,             // $17 (Coluna direta)
      membro.data_nascimento, // $18 (Coluna direta)
      membro.data_cadastro,   // $19 (Coluna direta)
      membro.cidade           // $20 (Coluna direta)
    ];

    await pool.query(queryTexto, valores);
    res.send("Membro salvo com sucesso");
  } catch (error) {
    console.error("Erro detalhado ao salvar membro:", error);
    res.status(500).send("Erro ao salvar membro");
  }
});

// Rota para Buscar Membros (GET - Ler)
app.get("/api/membros", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        fm.id_fato,
        fm.nome,
        dg.genero,
        fm.cpf,
        fm.rg,
        fm.endereco,
        fm.numero,
        fm.bairro,
        fm.cep, 
        fm.telefone,
        fm.email,
        fm.observacao,
        dcid.cidade AS cidade, 
        dcid.estado AS estado, 
        fm.data_nascimento,   
        fm.data_cadastro,     
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
      -- JOIN dim_tempo dt ON fm.id_tempo = dt.id_tempo -- Removido, pois datas vêm diretamente de fato_membros
      ORDER BY fm.id_fato DESC
    `);
    res.json(resultado.rows);
  } catch (error) {
    console.error("Erro ao buscar membros:", error);
    res.status(500).send("Erro ao buscar membros");
  }
});

// --- INÍCIO DA NOVA ROTA PUT ---
// Rota para Atualizar Membros (PUT - Atualizar)
app.put("/api/membros/:id", async (req, res) => {
  const idMembro = req.params.id; // Pega o ID do membro da URL
  const membro = req.body; // Pega os dados atualizados do corpo da requisição

  try {
    // Obter IDs para dimensões (necessário para o UPDATE se os nomes mudaram)
    const idGenero = await getId("genero", membro.genero);
    const idStatus = await getId("status", membro.status);
    const idCargo = await getId("cargo", membro.cargo);
    const idEstadoCivil = await getId("estadocivil", membro.estadocivil);
    const idCongregacao = await getId("congregacao", membro.congregacao);
    
    // Obter id_cidade (passando cidade e estado para a função getId)
    const idCidade = await getId("cidade", {cidade: membro.cidade, estado: membro.estado}); 
    
    // Obter id_tempo para data_cadastro (ou data_nascimento se for relevante)
    const idTempoNascimento = await getId("tempo", membro.data_nascimento); 
    const idTempoCadastro = await getId("tempo", membro.data_cadastro); 

    const queryTexto = `
      UPDATE fato_membros
      SET 
        nome = $1, 
        cpf = $2, 
        rg = $3, 
        endereco = $4, 
        numero = $5, 
        bairro = $6, 
        telefone = $7, 
        email = $8, 
        observacao = $9,
        id_genero = $10, 
        id_status = $11, 
        id_cargo = $12, 
        id_estadocivil = $13, 
        id_congregacao = $14,
        id_cidade = $15, 
        id_tempo = $16, 
        cep = $17, 
        data_nascimento = $18, 
        data_cadastro = $19, 
        cidade = $20
      WHERE id_fato = $21
    `;
    // ATENÇÃO: A ORDEM DOS VALORES ABAIXO DEVE CORRESPONDER EXATAMENTE À ORDEM DAS COLUNAS ACIMA.
    const valores = [
      membro.nome, 
      membro.cpf, 
      membro.rg, 
      membro.endereco, 
      membro.numero,
      membro.bairro, 
      membro.telefone, 
      membro.email, 
      membro.observacao,
      idGenero,       // $10
      idStatus,       // $11
      idCargo,        // $12
      idEstadoCivil,  // $13
      idCongregacao,  // $14
      idCidade,       // $15
      idTempoCadastro, // $16 (usando data_cadastro como lookup para id_tempo)
      membro.cep,             // $17
      membro.data_nascimento, // $18
      membro.data_cadastro,   // $19
      membro.cidade,          // $20
      idMembro                // $21 - O ID para a cláusula WHERE
    ];

    const resultado = await pool.query(queryTexto, valores);

    if (resultado.rowCount > 0) {
      res.send("Membro atualizado com sucesso!");
    } else {
      res.status(404).send("Membro não encontrado para atualização.");
    }
  } catch (error) {
    console.error("Erro detalhado ao atualizar membro:", error);
    res.status(500).send("Erro ao atualizar membro");
  }
});
// --- FIM DA NOVA ROTA PUT ---

// Rota para Excluir Membros (DELETE)
app.delete("/api/membros/:id", async (req, res) => {
  const idMembro = req.params.id; // Pega o ID do membro da URL
  try {
    const queryTexto = `DELETE FROM fato_membros WHERE id_fato = $1`;
    const resultado = await pool.query(queryTexto, [idMembro]);

    if (resultado.rowCount > 0) {
      res.send("Membro excluído com sucesso!");
    } else {
      res.status(404).send("Membro não encontrado para exclusão.");
    }
  } catch (error) {
    console.error("Erro ao excluir membro:", error);
    res.status(500).send("Erro ao excluir membro");
  }
});


// Inicia o servidor na porta definida pela variável de ambiente
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
