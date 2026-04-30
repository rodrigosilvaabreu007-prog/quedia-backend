# Atualização de Dependências e Node.js Runtime

## Data: 30 de Abril de 2025

### Alterações Realizadas

#### 1. Node.js Runtime Upgrade (20 → 24)
- **Problema**: Node.js 20 foi deprecado e será descomissionado em 30 de outubro de 2026
- **Solução**: Atualizado para Node.js 24 (2nd Gen Cloud Functions)
- **Arquivos Modificados**:
  - `functions/package.json`: `"node": "20"` → `"node": "24"`
  - `firebase.json`: `"nodejs20"` → `"nodejs24"`

#### 2. Firebase Dependencies Update
- **firebase-functions**: 6.3.0 → 7.2.5
  - Suporte melhorado para Node.js 24
  - Segurança e performance aprimoradas
- **firebase-admin**: 13.8.0 (já estava atualizado)

#### 3. Backend Dependencies Updated
- `backend/package-lock.json` atualizado com:
  - mongodb: 7.1.1 → 7.2.0
  - mongoose: patches de segurança
  - kareem: 3.2.0 → 3.3.0
  - Dependências transativas melhoradas

#### 4. Functions Dependencies Updated
- `functions/package-lock.json` atualizado com:
  - @google-cloud/firestore: 7.11.6 → 8.5.0
  - @google-cloud/paginator: 5.0.2 → 6.0.0
  - @google-cloud/projectify: 4.0.0 → 5.0.0
  - @google-cloud/promisify: 4.0.0 → 5.0.0
  - Múltiplas dependências de teste e desenvolvimento

### Commits Git

1. **"Update firebase-functions and Node.js runtime to v24"**
   - Atualizado Node.js de 20 para 24
   - firebase-functions e firebase-admin atualizados

2. **"Update backend and functions dependencies"**
   - Todos os package-lock.json atualizados
   - Dependências críticas modernizadas

### Validação de Deploy

✅ Hosting: https://quedia-bd2fb.web.app
✅ Functions API: https://api-olt53a7vma-uc.a.run.app
✅ Node.js 24 (2nd Gen) - Confirmado nos logs de deploy

### Status de Segurança

- **Backend**: 13 vulnerabilities (2 low, 8 moderate, 3 high)
- **Functions**: 11 vulnerabilities (2 low, 9 moderate)
- Recomendação: Executar `npm audit fix` em ambos os diretórios para resolver vulnerabilidades sem breaking changes

### Próximos Passos

1. Monitorar logs do Firebase para detectar qualquer incompatibilidade
2. Testar fluxos completos: login, criação de eventos, admin approvals
3. Executar `npm audit fix` se necessário para resolver vulnerabilidades remanescentes
4. Avaliar atualização para Node.js 22 ou superior conforme necessário

### Benefícios

- ✅ Segurança: Não há mais dependência de runtime deprecado
- ✅ Performance: Node.js 24 traz melhorias significativas
- ✅ Compatibilidade: Suporte completo para bibliotecas modernas
- ✅ Manutenibilidade: Dependências atualizadas reduzem débito técnico
