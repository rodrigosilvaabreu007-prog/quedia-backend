# 🚀 Instruções de Commit e Deploy

## Toda Alteração Deve Ter Commit + Deploy

**REGRA DE OURO:**
- ✅ Fazer alteração no código
- ✅ Commit com mensagem clara (`git commit -m "..."`)
- ✅ Deploy imediatamente (`npm run deploy`)
- ✅ **Apenas assim as mudanças ficam ativas para os usuários!**

---

##  1️⃣ Commit (Salvar Mudanças)

### Adicionar Arquivos Modificados
```bash
# Adicionar TODOS os arquivos alterados
git add .

# Ou adicionar apenas específicos
git add frontend/styles.css
git add frontend/event-form.js
```

### Fazer Commit
```bash
# Commit com mensagem descritiva
git commit -m "Corrigir visual dos botões de categorias na página de eventos"

# Ou para múltiplos arquivos
git commit -m "Atualizar sistema de categorias em todas as páginas"
```

### Mensagens de Commit Boas ✅
- "Corrigir CSS dos botões de categorias"
- "Implementar novo seletor de categorias interativo"
- "Atualizar informações do README.md"
- "Adicionar validação de email no cadastro"

### Mensagens de Commit Ruins ❌
- "Atualizar"
- "Fix"
- "..."
- "Mudanças"

---

## 2️⃣ Deploy (Publicar no Site)

### Deploy para Firebase Hosting
```bash
# Deploy APENAS o frontend (recomendado)
npx firebase deploy --only hosting

# Deploy completo (frontend + backend)
firebase deploy
```

### Verificar Status do Deploy
```bash
# Logout e login (se necessário)
firebase logout
firebase login

# Listar projetos
firebase list

# Usar projeto específico
firebase use seu-projeto-id
```

---

## 📋 Fluxo Completo Passo a Passo

### Exemplo Real: Corrigir um Bug

```bash
# 1. Você encontra um bug e corrige o código
# (Edita o arquivo frontend/meus-eventos.js)

# 2. Adiciona o arquivo ao staging
git add frontend/meus-eventos.js

# 3. Faz o commit
git commit -m "Corrigir bug na listagem de eventos do usuário"

# 4. Faz o deploy
npx firebase deploy --only hosting

# 5. AGUARDA... (deploy leva alguns segundos a poucos minutos)

# 6. Acessa o site: https://quedia.com.br/meus-eventos.html
# 7. Verifica se o bug foi corrigido para todos os usuários ✅
```

---

## 🔄 Git Status

### Ver o que mudou
```bash
git status
```

Output:
```
On branch main
Changes not staged for commit:
  modified: frontend/styles.css
  modified: frontend/event-form.js
```

### Ver diferenças
```bash
git diff frontend/styles.css
```

### Histórico de commits
```bash
git log --oneline -10
```

---

## ⚡ Atalhos Úteis

### Commit + Push automático
```bash
# 1. Shortcut (não funciona diretamente em GitHub Pages, mas funciona em git)
git add . && git commit -m "Mensagem" && git push
```

### Desfazer mudanças
```bash
# Cancelar alterações de um arquivo
git checkout frontend/styles.css

# Cancelar todos as mudanças (CUIDADO!)
git reset --hard
```

### Voltar um commit
```bash
# Ver último commit sem desfazer
git log -1

# Desfazer o último commit (CUIDADO!)
git reset --soft HEAD~1
```

---

## ✅ Checklist Antes do Deploy

- [ ] Código foi testado localmente
- [ ] Não há erros no browser (console sem erros)
- [ ] Commit foi feito com mensagem clara
- [ ] `git status` mostra "nothing to commit"
- [ ] Firebase está conectado (`firebase login` se necessário)
- [ ] Rodou `npm run deploy` ou `npx firebase deploy --only hosting`
- [ ] Deploy completou sem erros
- [ ] Acessou o site ao vivo para verificar

---

## 📞 Troubleshooting

### "Permission denied"
```bash
firebase logout
firebase login
```

### "No firebase.json found"
```bash
# Certifique-se de estar no diretório correto
cd /caminho/para/quedia.com.br
```

### Deploy não atualiza
```bash
# Limpar cache do navegador
# Ctrl + Shift + Delete (Windows/Linux)
# Cmd + Shift + Delete (Mac)
# Ou F12 → Application → Clear Storage
```

---

**Lembre-se: Sem commit e deploy = Ninguém vê suas mudanças!**

Última Atualização: 10/04/2026
