const API = 'http://localhost:8080/api';

(async () => {
  console.log('=== TESTE Interesse + DELETE USUARIO ===');
  try {
    // 1) cadastro
    const email = `testedelete${Date.now()}@example.com`;
    const senha = 'senha123';

    let res = await fetch(`${API}/cadastro`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({nome:'Teste Delete', email, senha, estado:'SP', cidade:'SP'}) });
    let data = await res.json();
    if (!res.ok) throw new Error('Cadastro falhou: ' + JSON.stringify(data));
    const userId = data.id;
    console.log('userId', userId);

    // 2) login
    res = await fetch(`${API}/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, senha}) });
    data = await res.json();
    if (!res.ok) throw new Error('Login falhou: ' + JSON.stringify(data));
    const token = data.token;
    console.log('login ok token len', token.length);

    // 3) pegar um evento existente
    res = await fetch(`${API}/eventos`);
    data = await res.json();
    if (!Array.isArray(data) || data.length===0) throw new Error('Sem eventos');
    const eventoId = data[0]._id;
    console.log('eventoId', eventoId);

    // 4) adicionar interesse
    res = await fetch(`${API}/interesses`, { method:'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({evento_id:eventoId}) });
    data = await res.json();
    console.log('interesse add', data);

    // 5) remover interesse
    res = await fetch(`${API}/interesses`, { method:'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({evento_id:eventoId}) });
    data = await res.json();
    console.log('interesse toggled (remove)', data);

    // 6) adicionar interesse novamente e deletar usuario
    res = await fetch(`${API}/interesses`, { method:'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({evento_id:eventoId}) });
    data = await res.json();
    console.log('interesse segundo add', data);

    // 7) contador antes
    res = await fetch(`${API}/interesses/contador/${eventoId}`);
    data = await res.json();
    console.log('contador antes delete usuario', data);

    // 8) deletar usuario
    res = await fetch(`${API}/usuario/${userId}`, { method:'DELETE', headers:{Authorization:`Bearer ${token}`} });
    data = await res.json();
    console.log('delete user', data);

    // 9) contador apos
    res = await fetch(`${API}/interesses/contador/${eventoId}`);
    data = await res.json();
    console.log('contador apos delete usuario', data);

    console.log('=== teste finalizado ===');
  } catch (err) {
    console.error(err);
  }
})();