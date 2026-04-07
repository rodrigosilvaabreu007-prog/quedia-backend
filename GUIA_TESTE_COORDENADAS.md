# 🔍 GUIA DE TESTE: FLUXO COMPLETO DE COORDENADAS

## Objetivo
Verificar se as coordenadas que você marca no mapa durante a **criação de um evento** aparecem quando você **abre os detalhes** desse evento.

---

## ✅ CHECKLIST PRÉ-TESTE

- [ ] Você está logado em quedia.com.br
- [ ] Navegador: Chrome, Firefox ou Edge (com DevTools F12)
- [ ] Conexão com internet estável

---

## 📋 TESTE PASSO A PASSO

### PASSO 1: Abrir o DevTools (Console)

1. Vá para: **https://quedia.com.br/event-form.html**
2. Pressione **F12** para abrir o DevTools
3. Clique na aba **Console** 

Você vai ver uma tela preta com linhas de texto.

---

### PASSO 2: Preencher o Formulário

Preencha os campos obrigatórios:
- **Nome do Evento**: "Teste Marcação Mapa - [Sua data/hora]"
- **Descrição**: "Teste de marcação de coordenadas"
- **Organizador**: Seu nome
- **Data**: Escolha uma data FUTURA
- **Horário**: Qualquer hora
- **Estado**: ES (Espírito Santo)
- **Cidade**: Cachoeiro de Itapemirim 
- **Endereço**: Avenida Something
- **Imagem de Capa**: Escolha qualquer imagem

---

### PASSO 3: MARCAR A LOCALIZAÇÃO NO MAPA

Este é o passo CRÍTICO:

1. **Olhe para o Console** (DevTools aberto em F12)
2. **Clique em algum lugar no mapa** (aquele mapa grande Brasil que aparece)
3. **NO CONSOLE**, você deve ver linhas aparecendo com:
   - `[MAPA-FORM-CLICK] Usuário clicou no mapa: { lat: -20.847..., lon: -41.146... }`
   - `[MAPA-FORM-CLICK-03] Latitude preenchida: -20.847831`
   - `[MAPA-FORM-CLICK-04] Longitude preenchida: -41.146524`
   - E mais alguns logs

**Se você NÃO ver esses logs no console:**
- ❌ Há um problema com o click handler do mapa
- ✋ PARE aqui e avise!

**Se você VER esses logs:**
- ✅ Parabéns! Os campos estão sendo preenchidos
- ➡️ Continue para o próximo passo

---

### PASSO 4: Verificar que Lat/Lon foram preenchidos

Feche o DevTools (ou minimize) e **verifique os campos de Latitude e Longitude**:
- [ ] Latitude tem um número negativo (ex: -20.847831)
- [ ] Longitude tem um número negativo (ex: -41.146524)

Se ambos têm números, você vai poder publicar.

---

### PASSO 5: Publicar o Evento

1. Clique no botão **"PUBLICAR EVENTO"**
2. Aguarde a mensagem "✅ EVENTO PUBLICADO COM SUCESSO!"
3. Você será redirecionado para a página inicial

**Anote o ID do URL se quiser**. Ele vai aparecer em "Meus Eventos" ou você pode buscar na página inicial.

---

### PASSO 6: Abrir os Detalhes do Evento

1. Vá para **https://quedia.com.br** (página inicial)
2. Encontre o evento que você acabou de publicar
3. Clique para abrir os detalhes

---

### PASSO 7: Verificar o Marcador NO MAPA

Quando a página de detalhes abrir:

#### 7A: Console (DevTools)

1. Pressione **F12** novamente
2. Vá para a aba Console
3. Procure por logs que começam com `[MAPA-`:
   - `[MAPA-14] Checagem final: { lat: -20.847..., lon: -41.146..., isFinite: true }`
   - `[MAPA-15] RENDERIZANDO MARCADOR EM: [-20.847831, -41.146524]`
   - `[MAPA-16] MARCADOR RENDERIZADO`

**Se você VER esses logs:**
- ✅ O marcador DEVERIA aparecer no mapa
- ➡️ Vá para o passo 7B

**Se você VER erro ou `isFinite: false`:**
- ❌ Há um problema - as coordenadas não foram salvas ou vieram inválidas
- ✋ SCREENSHOT do console e avise!

#### 7B: Visualizar o Marcador

1. **Olhe para o MAPA** na página (seção "Localização")
2. Você deve ver um **PIN AZUL** em algum local do mapa

**Se você VER o marcador (pin azul):**
- ✅✅✅ **FUNCIONA!** Problema resolvido!

**Se você NÃO vê o marcador:**
- ❌ Continuamos debugando - continue no passo 8

---

### PASSO 8: Debug Box Visual

Você deve ver um **quadrado VERDE** no canto superior direito com DEBUG INFO:

```
DEBUG INFO
ID: 69d52ce46b376a4e683e3150
Nome: TESTE AUTO ...
Latitude: -20.847831 (number)
Longitude: -41.146524 (number)
Local: Av. Jones dos Santos Neves
Endereco: Av. Jones dos Santos Neves ...
[Fechar]
```

**Verificar:**
- [ ] LATITUDE aparece como um NÚMERO (não diz "undefined")
- [ ] LONGITUDE aparece como um NÚMERO (não diz "undefined")

---

## 📸 SE ALGO DER ERRADO

**FAÇA SCREENSHOT DE:**
1. O Console (F12 → Console)
2. O Debug Box Verde (canto superior direito)
3. O Mapa (a seção "Localização")

**ENVIE COMIGO O SCREENSHOT** e diga:
- Qual passo falhou?
- Qual a mensagem de erro no console?
- O Debug Box apareceu? Qual o valor de Latitude/Longitude?

---

## 🎯 Resumo Esperado

### Se TUDO der certo:

```
✅ PASSO 1: Login OK
✅ PASSO 2: Formulário preenchido
✅ PASSO 3: Console mostra [MAPA-FORM-CLICK]
✅ PASSO 4: Latitude/Longitude preenchidos
✅ PASSO 5: Evento publicado
✅ PASSO 6: Detalhes abertos
✅ PASSO 7: Console mostra [MAPA-16] MARCADOR RENDERIZADO
✅ PASSO 8: PIN AZUL visível no mapa
✅ PASSO 9: Debug Box mostra números para lat/lon

🎉 PROBLEMA RESOLVIDO!
```

---

## 📞 Próximos Passos

Teste isso, tire screenshot e me mostra. Dependendo do resultado, a gente vai saber:

1. Se o problema está no FORMULÁRIO (passo 3 falha)
2. Se o problema está no BANCO (passo 8 mostra undefined)
3. Se o problema está no MAPA (passo 7 funciona mas não renderiza)

Cada um tem uma solução diferente. Mas vamos identificar qual é!
