# Sistema de Extração de Leads (Alto Padrão)

Este repositório contém o front-end do buscador de leads de alto padrão para venda de consórcio, desenvolvido em HTML, CSS e Vanilla JS para máxima performance e design estruturado.

## Etapa 1: Preparar o Banco (Supabase)
1. Crie um projeto em supabase.com.
2. Acesse o **SQL Editor**, cole o conteúdo de `supabase_schema.sql` e execute.
3. Vá em **Project Settings > API**. Copie a `Project URL` e a `anon public key`.
4. Abra o arquivo `app.js` e cole as chaves nas variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY`.

## Etapa 2: Publicar (GitHub + Vercel)
1. Suba esta pasta para um repositório no seu GitHub.
2. Acesse a Vercel e importe este repositório.
3. Como não há build tools (Vanilla JS), o deploy será imediato.

A interface utiliza tipografia Inter, cards brancos limpos (#ffffff) sobre fundo cinza (#f4f6f8), botões azuis (#2563eb) e máscara monetária em Real já aplicada no JS.
