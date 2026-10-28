import json

def handler(request):
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'status': 'sucesso',
            'mensagem': 'Atualização acionada com sucesso na nuvem!'
        })
    }
