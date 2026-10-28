// Máscara monetária para o campo de capital (R$)
const inputCapital = document.getElementById('capital');
inputCapital.addEventListener('input', (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor) {
        valor = (parseInt(valor) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }
    e.target.value = valor;
});

// Configurações do Supabase (Substitua pelas suas chaves após criar o projeto)
const SUPABASE_URL = 'https://ogtuawhwjbzrtkwnvlyp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_s7sJ40oQI5LybX7N-VrZGQ_mnYXRPLM';
```[cite: 4]

> **Aviso de Segurança:** Nunca utilize o `SUPABASE_SECRET_KEY` no arquivo do site (`app.js`). Ele é a sua chave secreta com acesso administrativo total e **jamais** deve ficar visível publicamente no navegador.

<FollowUp> Agora que o `app.js` está configurado com as chaves corretas, quer abrir o arquivo `index.html` no seu navegador para testarmos a busca de leads? </FollowUp>

document.getElementById('btn-buscar').addEventListener('click', async () => {
    const cnae = document.getElementById('cnae').value;
    const cepPrefixo = document.getElementById('cep').value.trim();
    
    // Converte o valor formatado de volta para número puro para o banco
    const capitalMinimoRaw = document.getElementById('capital').value.replace(/\./g, '').replace(',', '.');
    const capitalMinimo = parseFloat(capitalMinimoRaw) || 500000;
    
    const btn = document.getElementById('btn-buscar');
    const status = document.getElementById('status');

    if (!cepPrefixo) {
        alert("Por favor, insira o prefixo do CEP para focar no metro quadrado correto.");
        return;
    }

    if (SUPABASE_URL === 'COLE_SUA_URL_AQUI') {
        alert("Autenticação pendente: Insira a URL e Key do Supabase no arquivo app.js.");
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Buscando Leads...';
    status.textContent = 'Consultando banco de dados...';

    try {
        const url = `${SUPABASE_URL}/rest/v1/empresas?cnae=eq.${cnae}&cep=like.${cepPrefixo}%&capital_social=gte.${capitalMinimo}`;
        
        const resposta = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        });

        if (!resposta.ok) throw new Error('Erro na comunicação com a API.');

        const leads = await resposta.json();
        
        if (leads.length === 0) {
            status.textContent = 'Nenhum lead encontrado com este perfil.';
        } else {
            status.textContent = `${leads.length} leads qualificados! Exportando CSV...`;
            gerarCSV(leads);
            status.textContent = 'Exportação concluída.';
        }
    } catch (erro) {
        console.error(erro);
        status.textContent = 'Erro ao processar a busca.';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Buscar e Exportar CSV';
    }
});

function gerarCSV(dados) {
    if (dados.length === 0) return;
    const cabecalho = Object.keys(dados[0]).join(";") + "\n";
    const linhas = dados.map(lead => {
        return Object.values(lead).map(valor => {
            let stringValor = valor === null ? '' : String(valor);
            return stringValor.replace(/;/g, ',');
        }).join(";");
    }).join("\n");

    const csvContent = cabecalho + linhas;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads_consorcio_${new Date().getTime()}.csv`;
    link.click();
}
