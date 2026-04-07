# GUIA PARA TESTAR A CORREÇÃO DO MAPA

## ✅ Resumo da Correção

### Problema Encontrado
- FormData enviava latitude/longitude como **strings**
- Backend recebia e salvava como **números**
- Frontend recebia corretamente
- **MAS**: Se o banco tivesse dados antigos com `null`, `Number(null)` = 0
- Então o marcador aparecia em coordenada [0, 0] (oceano) ao invés de não aparecer

### Solução Implementada
1. **Backend** (`routes.js`, `models/eventos.js`, `routes-memory.js`)
   - Usa `Number.isFinite()` para validar antes de salvar
   - Agora rejeita 0 como coordenada válida
   - Adicionado endpoint de debug

2. **Frontend** (`evento-detalhes.js`)
   - Valida que coordenadas estão dentro do Brasil
   - Rejeita lat=0 e lon=0
   - Se inválidas, tenta geocoding
   - Logging completo

---

## 🧪 PASSO A PASSO DO TESTE

### Teste 1: Verifica Logs do Formulário
1. Abra [evento-form.html](https://quedia-bd2fb.web.app/event-form.html) (página de cadastro)
2. Pressione F12 para abrir **Console**
3. Preencha os campos:
   - Nome: "Teste Marcador"
   - Descrição: "teste"
   - Organizador: "Eu"
   - Estado/Cidade: escolha um
   - Endereço: "São Paulo, SP"
   - Data: data futura
   - Horário: hora qualquer
4. **CLIQUE NO MAPA** para marcar um ponto
5. Veja os campos Latitude/Longitude preencherem
6. **Veja no Console**:
   ```
   [DEBUG] FormData enviado: {
       latitude: "-23.550520",
       longitude: "-46.633309",
       ...
   }
   ```
   **Confirma**: latitude/longitude são strings! ✓

---

### Teste 2: Verifica Backend Recebimento
1. Com F12 aberto, procure por uma aba de **Network**
2. Clique em **PUBLICAR EVENTO**
3. Procure pelo POST `/api/eventos`
4. Clique e vá em **Response**
5. Procure por: `"evento": { latitude: ..., longitude: ... }`
6. **Confirma**: backend salvou como números! ✓

---

### Teste 3: Verifica Debug Endpoint
1. Abra: `https://quedia-bd2fb.web.app/api/debug/ultimos-eventos`
2. Você verá os 3 últimos eventos com suas coordenadas:
   ```json
   {
       "ultimos": [
           {
               "_id": "...",
               "nome": "Teste Marcador",
               "latitude": -23.550520,
               "longitude": -46.633309,
               "latitudeType": "number",
               "longitudeType": "number"
           }
       ]
   }
   ```
3. **Confirma**: banco está salvando como numbers! ✓

---

### Teste 4: Verifica Mapa na Página de Detalhes
1. Após publicar, você será redirecionado ao index
2. Procure pelo evento recém-criado "Teste Marcador"
3. Clique nele para abrir a página de detalhes
4. Abra o **Console** (F12)
5. **Procure pelos logs**:
   ```
   [DEBUG] evento-detalhes carregou evento: { ..., latitude: -23.550520, longitude: -46.633309 }
   [DEBUG] Chamando configurarMapa com: { ..., latitude: -23.550520, longitude: -46.633309 }
   [DEBUG] configurarMapa raw input: { latitude: -23.550520, longitude: -46.633309 }
   [DEBUG] configurarMapa parsed: { lat: -23.550520, lon: -46.633309 }
   [DEBUG] isValidBrazilCoords: true
   [DEBUG] Renderizando marcador em: [-23.550520, -46.633309]
   ```
6. **Confirma**: o marcador será renderizado! ✓

---

### Teste 5: Visual - Marcador no Mapa
1. Na seção "**Localização**" da página do evento
2. Você deve ver um marcador 📍 **EXATAMENTE** onde clicou no cadastro
3. **SE NÃO APARECER**:
   - Abra o Console (F12)
   - Procure por erros em vermelho
   - Anote o erro e reporte

---

## 📋 Checklist Final

- [ ] FormData mostra latitude/longitude como strings no console
- [ ] Backend retorna latitude/longitude como numbers
- [ ] `/api/debug/ultimos-eventos` mostra coordenadas salvas
- [ ] Página de detalhes mostra TODOS os logs [DEBUG]
- [ ] Marcador aparece VISUALMENTE no mapa
- [ ] Marcador está na posição correta (onde clicou)

---

## ❌ Se Ainda Não Funcionar

1. **Hard Refresh** (Ctrl+Shift+R ou Cmd+Shift+R) no navegador
2. **Limpe o cache** do navegador
3. **Teste em modo anônimo/privado**
4. Reporte os logs do Console

---

## 🔗 URLs de Teste

- Frontend: https://quedia-bd2fb.web.app/event-form.html
- Último evento debug: https://quedia-bd2fb.web.app/api/debug/ultimos-eventos
