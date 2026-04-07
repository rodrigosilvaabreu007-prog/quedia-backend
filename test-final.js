const formData = new FormData();
formData.append('nome', 'TESTE FINAL - ' + new Date().toISOString());
formData.append('descricao', 'Teste final das correções');
formData.append('organizador', 'Teste Organizador');
formData.append('data', '2026-04-15');
formData.append('horario', '20:00');
formData.append('estado', 'ES');
formData.append('cidade', 'Vitória');
formData.append('local', 'Praia de Camburi');
formData.append('latitude', '-20.2976');
formData.append('longitude', '-40.2958');
formData.append('categoria', 'Teste');
formData.append('preco', '0');
formData.append('gratuito', 'true');

fetch('https://eventhub-api-649702844549.us-central1.run.app/api/eventos', {
  method: 'POST',
  body: formData
}).then(r => r.json()).then(d => {
  console.log('Evento criado:', d.evento._id);
  console.log('Organizador:', d.evento.organizador);
  console.log('Latitude:', d.evento.latitude);
  console.log('Longitude:', d.evento.longitude);
}).catch(e => console.error(e));