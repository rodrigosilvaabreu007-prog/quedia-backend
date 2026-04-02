// 🧪 Teste completo de atualização de perfil
const API = 'http://localhost:8080/api';

async function testeCompleto() {
  console.log('🚀 TESTE COMPLETO DE ATUALIZAÇÃO DE PERFIL\n');
  
  // 1. Registrar usuário
  console.log('1️⃣ Registrando novo usuário...');
  const email = `teste${Date.now()}@teste.com`;
  const senha = 'teste123';
  
  try {
    const regResp = await fetch(`${API}/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Teste Usuario',
        email: email,
        senha: senha,
        estado: 'SP',
        cidade: 'São Paulo',
        preferencias: []
      })
    });
    
    const regData = await regResp.json();
    if (!regResp.ok) {
      console.log('❌ Erro no registro:', regData.erro);
      return;
    }
    console.log('✅ Usuário registrado:', regData.id);
    
    // 2. Login
    console.log('\n2️⃣ Fazendo login...');
    const loginResp = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    
    const loginData = await loginResp.json();
    if (!loginResp.ok) {
      console.log('❌ Erro no login:', loginData.erro);
      return;
    }
    const token = loginData.token;
    const uid = loginData.usuario._id;
    console.log('✅ Login OK');
    console.log('   Token:', token.substring(0, 30) + '...');
    console.log('   ID:', uid);
    
    // 3. Atualizar perfil
    console.log('\n3️⃣ Atualizando perfil...');
    const updateResp = await fetch(`${API}/usuario/${uid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nome: 'Novo Nome Teste',
        email: email,
        estado: 'RJ',
        cidade: 'Rio de Janeiro',
        preferencias: ['Música', 'Tecnologia']
      })
    });
    
    const updateData = await updateResp.json();
    
    if (!updateResp.ok) {
      console.log('❌ Erro na atualização:', updateData.erro);
      console.log('Status:', updateResp.status);
      return;
    }
    
    console.log('✅ Perfil atualizado!');
    console.log('   Nome:', updateData.nome);
    console.log('   Cidade:', updateData.cidade);
    console.log('   Preferências:', updateData.preferencias);
    
    console.log('\n🎉 TESTE PASSOU COM SUCESSO!');
    
  } catch (e) {
    console.log('❌ Erro:', e.message);
  }
}

testeCompleto();
