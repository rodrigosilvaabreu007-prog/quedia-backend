import requests

url = 'http://localhost:8080/api/eventos'
data = {
    'nome': 'Evento Teste',
    'descricao': 'Descrição teste',
    'cidade': 'São Paulo',
    'estado': 'SP',
    'local': 'Local teste',
    'latitude': '-23.5505',
    'longitude': '-46.6333',
    'data': '2026-04-15',
    'horario': '14:00',
    'horario_fim': '16:00',
    'categoria': 'Teste',
    'preco': '0',
    'gratuito': 'true',
    'organizador': 'Teste',
    'datas': '[{"data": "2026-04-15", "horario_inicio": "14:00", "horario_fim": "16:00"}]'
}

try:
    response = requests.post(url, data=data)
    print('Status:', response.status_code)
    print('Resposta:', response.json())
except Exception as e:
    print('Erro:', str(e))