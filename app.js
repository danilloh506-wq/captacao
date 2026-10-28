const SUPABASE_URL = 'https://ogtuawhwjbzrtkwnvlyp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_s7sJ40oQI5LybX7N-VrZGQ_mnYXRPLM';

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const MAPA_CEPS_NOBRES = {
    todas: ['045', '014', '040', '054', '224', '220', '226', '88330', '804', '88015', '301', '700', '29055'],
    sp: ['045', '014', '040', '054'],
    rj: ['224', '220', '226'],
    sul: ['88330', '804', '88015'],
    outras: ['301', '700', '29055']
};

const inputCapital = document.getElementById('capital');
if (inputCapital) {
    inputCapital.addEventListener('input', (e) => {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor) {
            valor = (parseInt(valor) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        }
        e.target.value = valor;
    });
}

document.getElementById('btn-buscar').addEventListener('click', async () => {
    const cnae = document.getElementById('cnae').value;
    const regiaoSelecionada = document.getElementById('regiao').value;
    const capitalMinimoRaw = document.getElementById('capital').value.replace(/\./g, '').replace(',', '.');
    const capitalMinimo = parseFloat(capitalMinimoRaw) || 0;

    const btn = document.getElementById('btn-buscar');
    const status = document.getElementById('status');

    if (!supabaseClient) {
        status.textContent = 'Erro: Conexão com o Supabase indisponível.';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Buscando Leads...';
    status.textContent = 'Consultando banco de dados...';

    try {
        const cepsParaBuscar = MAPA_CEPS_NOBRES[regiaoSelecionada];
        const orCondicao = cepsParaBuscar.map(cep => `cep.like.${cep}%`).join(',');

        let query = supabaseClient
            .from('empresas')
            .select('*')
            .eq('cnae', cnae)
            .or(orCondicao);

        if (capitalMinimo > 0) {
            query = query.gte('capital_social', capitalMinimo);
        }

        const { data: leads, error } = await query;

        if (error) {
            console.error('Erro no Supabase:', error);
            status.textContent = `Erro do Banco: ${error.message}`;
        } else if (!leads || leads.length === 0) {
            status.textContent = 'Nenhum lead encontrado com este perfil na base.';
        } else {
            status.textContent = `${leads.length} leads encontrados! Baixando CSV...`;
            gerarCSV(leads);
        }
    } catch (err) {
        console.error('Erro inesperado:', err);
        status.textContent = 'Erro de comunicação. Verifique a conexão.';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Buscar e Exportar CSV';
    }
});

document.getElementById('btn-sync').addEventListener('click', async () => {
    const status = document.getElementById('status');
    const btnSync = document.getElementById('btn-sync');

    btnSync.disabled = true;
    status.textContent = 'A iniciar atualização de dados na nuvem...';

    try {
        const resposta = await fetch('/api/sync');
        const resultado = await resposta.json();
        status.textContent = resultado.mensagem;
    } catch (erro) {
        console.error(erro);
        status.textContent = 'Sincronização acionada. Aguarde o processamento na nuvem.';
    } finally {
        btnSync.disabled = false;
    }
});

function gerarCSV(dados) {
    if (!dados || dados.length === 0) return;
    const cabecalho = Object.keys(dados[0]).join(";") + "\n";
    const linhas = dados.map(lead => {
        return Object.values(lead).map(valor => {
            let stringValor = valor === null ? '' : String(valor);
            return `"${stringValor.replace(/"/g, '""')}"`;
        }).join(";");
    }).join("\n");

    const csvContent = "\uFEFF" + cabecalho + linhas;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads_consorcio_${Date.now()}.csv`;
    link.click();
}