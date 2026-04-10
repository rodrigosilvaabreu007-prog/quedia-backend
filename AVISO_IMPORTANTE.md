# ⚠️ AVISO IMPORTANTE - NÃO DELETAR DADOS!

## 🚨 Crítico

**NUNCA delete usuários, eventos ou dados reais do banco de dados enquanto desenvolvimento!**

- ❌ Não execute queries DELETE sem backup
- ❌ Não limpe tabelas do banco de dados
- ❌ Não reset do banco de dados sem confirmação

Se o site estiver em produção com usuários reais, **TODAS As alterações CRÍTICAS podem causar perda irreversível de dados**.

---

## 📋 Protocolo de Mudanças

Sempre que fizer uma alteração no código:

### 1️⃣ **Crie um Commit Git**
```bash
git add .
git commit -m "Descrição clara da mudança realizada"
```

### 2️⃣ **Faça Deploy Imediatamente**
```bash
npm run deploy
# ou
npx firebase deploy --only hosting
```

### 3️⃣ **Não deixe alterações locais apenas!**
- Backup local ≠ Producão ao vivo
- Colaboradores/usuários só veem mudanças após deploy
- Não é suficiente apenas rodar localmente

---

## 🔒 Dados Seguros

### Usuários
- Cada usuário tem dados únicos (email, preferências, eventos criados)
- Quando multiplicado por milhares de usuários - impossível recuperar se deletado

### Eventos  
- Eventos criados por usuários não devem ser deletados
- Usuários podem estar interessados, com coordenadas marcadas, etc.

### Preferências
- Categorias e subcategorias selecionadas pelos usuários
- Histórico de interações

---

## ✅ Workflow Correto

### Fazer uma Mudança:
1. Editar código
2. Testar localmente
3. Fazer commit: `git commit -m "..."`
4. **FAZER DEPLOY:** `npm run deploy`
5. Verificar no site ao vivo que está funcionando

### Exemplo:
```bash
# Editar arquivo
# ... fazer mudanças ...

# Commit
git add frontend/styles.css
git commit -m "Corrigir visual dos botões de categorias"

# Deploy
npm run deploy

# Resultado: Mudanças estão ATIVAS no site para todos os usuários
```

---

## 🛡️ Proteções Implementadas

- ❌ **Não há** delete automático de eventos/usuários
- ❌ **Não há** reset automático de banco de dados  
- ✅ **Deve confirmar** qualquer operação destrutiva
- ✅ Backend valida todas as requisições

---

## 📞 Contatos Importantes

- **Alterações pequenas** → Commit + Deploy imediato
- **Alterações CRÍTICAS** → Backup PRIMEIRO + Commit + Deploy + Teste
- **Quando em dúvida** → NÃO DELETAR! Comentar código em vez de remover

---

**Última Atualização:** 10/04/2026  
**Status:** Ativo e em uso
