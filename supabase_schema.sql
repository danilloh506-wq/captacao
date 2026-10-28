-- Script para rodar no SQL Editor do Supabase

CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    razao_social VARCHAR(255),
    nome_fantasia VARCHAR(255),
    email VARCHAR(255),
    ddd_telefone VARCHAR(15),
    cep VARCHAR(8),
    logradouro VARCHAR(255),
    numero VARCHAR(50),
    bairro VARCHAR(100),
    uf CHAR(2),
    cnae VARCHAR(7),
    capital_social NUMERIC(15, 2)
);

CREATE INDEX idx_empresas_cnae ON empresas(cnae);
CREATE INDEX idx_empresas_cep ON empresas(cep);
CREATE INDEX idx_empresas_capital ON empresas(capital_social);

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura anonima" 
ON empresas FOR SELECT 
USING (true);
