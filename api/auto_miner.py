import os
import zipfile
import pandas as pd
import requests

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ogtuawhwjbzrtkwnvlyp.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_s7sJ40oQI5LybX7N-VrZGQ_mnYXRPLM")

CNAES_ALVO = ['8630501', '4120400', '6911701', '6462000', '0111301']
CEPS_ALVO = ['045', '014', '040', '054', '224', '220', '226', '88330', '804', '88015', '301', '700', '29055']

def executar_mineracao_automatica():
    print("Iniciando processo de mineração automatizada em nuvem...")
    
    # URL oficial dos dados abertos de Estabelecimentos da Receita Federal
    url_receita = "https://dadosabertos.rfb.gov.br/CNPJ/K3241327.E3868.G40213.E00001.Estabelecimentos0.zip"
    zip_destino = "estabelecimentos.zip"
    
    print("Baixando lote de dados da Receita Federal...")
    resposta = requests.get(url_receita, stream=True)
    if resposta.status_code == 200:
        with open(zip_destino, 'wb') as f:
            for chunk in resposta.iter_content(chunk_size=1024*1024):
                if chunk:
                    f.write(chunk)
        print("Download concluído.")
    else:
        print("Não foi possível acessar os servidores da Receita Federal no momento.")
        return

    # Extração e leitura otimizada
    print("Filtrando empresas ativas nos metros quadrados mais caros...")
    with zipfile.ZipFile(zip_destino, 'r') as zip_ref:
        arquivo_csv = zip_ref.namelist()[0]
        zip_ref.extract(arquivo_csv)

    colunas = ['cnpj_basico', 'cnpj_ordem', 'cnpj_dv', 'matriz_filial', 'nome_fantasia',
               'situacao', 'data_situacao', 'motivo', 'cidade_ext', 'pais', 'data_inicio',
               'cnae', 'cnae_sec', 'tipo_log', 'logradouro', 'numero', 'complemento',
               'bairro', 'cep', 'uf', 'municipio', 'ddd1', 'tel1', 'ddd2', 'tel2', 'ddd_fax', 'fax', 'email']

    padrao_cep = '^(' + '|'.join(CEPS_ALVO) + ')'
    leads_para_enviar = []

    for chunk in pd.read_csv(arquivo_csv, sep=';', chunksize=50000, names=colunas, dtype=str, encoding='latin1', na_filter=False):
        ativas = chunk[chunk['situacao'] == '02']
        alvos = ativas[ativas['cnae'].isin(CNAES_ALVO)]
        
        if not alvos.empty:
            filtrados = alvos[alvos['cep'].str.contains(padrao_cep)]
            for _, row in filtrados.iterrows():
                leads_para_enviar.append({
                    "cnpj": row['cnpj_basico'] + row['cnpj_ordem'] + row['cnpj_dv'],
                    "nome_fantasia": row['nome_fantasia'] or "Não Informado",
                    "email": row['email'],
                    "ddd_telefone": row['ddd1'] + row['tel1'],
                    "cep": row['cep'],
                    "logradouro": row['logradouro'],
                    "numero": row['numero'],
                    "bairro": row['bairro'],
                    "uf": row['uf'],
                    "cnae": row['cnae'],
                    "capital_social": 500000.00
                })

    print(f"Total de {len(leads_para_enviar)} leads qualificados encontrados.")
    
    # Envio em lotes para o Supabase
    if leads_para_enviar:
        endpoint = f"{SUPABASE_URL}/rest/v1/empresas"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        
        tamanho_lote = 500
        for i in range(0, len(leads_para_enviar), tamanho_lote):
            lote = leads_para_enviar[i:i + tamanho_lote]
            req = requests.post(endpoint, headers=headers, json=lote)
            if req.status_code in [200, 201]:
                print(f"Lote {i // tamanho_lote + 1} gravado no Supabase.")

if __name__ == "__main__":
    executar_mineracao_automatica()
