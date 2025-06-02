
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS membros (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100),
  genero VARCHAR(10),
  cpf VARCHAR(20),
  rg VARCHAR(20),
  endereco VARCHAR(100),
  numero VARCHAR(10),
  bairro VARCHAR(50),
  cidade VARCHAR(50),
  estado VARCHAR(2),
  cep VARCHAR(10),
  telefone VARCHAR(20),
  email VARCHAR(100),
  data_nascimento DATE,
  data_cadastro DATE,
  estadocivil VARCHAR(20),
  congregacao VARCHAR(50),
  cargo VARCHAR(50),
  status VARCHAR(20),
  observacao TEXT
);
