# EventHub - Agenda Pública de Eventos

Sistema completo de gerenciamento de eventos com suporte total para Google Cloud Platform.

---

## ⚠️ AVISO CRÍTICO - PROTEÇÃO DE DADOS

**🚫 NUNCA MODIFIQUE, DELETE OU ALTERE TABELAS DE USUÁRIOS E EVENTOS SEM BACKUP!**

### Importante:
- **Base de dados está em produção** - todo usuário e evento criado é real
- **Alterações no código podem deletar dados** - rotas, schemas ou lógica de negócio
- **SEMPRE fazer backup** antes de:
  - Alterar estrutura de banco de dados
  - Modificar rotas de autenticação ou usuários
  - Mudar lógica de exclusão/atualização
  - Fazer deploy de mudanças estruturais

### Processo OBRIGATÓRIO:
1. **Antes de qualquer mudança**: Fazer commit com mensagem clara
2. **Após cada mudança**: Fazer novo commit específico
3. **Sempre que terminar**: Fazer deploy (commit + deploy)
4. **Se houver erro**: Revertir com `git revert`

### Comando de Deploy:
```bash
# Backend + Frontend
gcloud builds submit --tag gcr.io/quedia-backend/eventhub-api:latest backend
gcloud run deploy eventhub-api --image gcr.io/quedia-backend/eventhub-api:latest --region us-central1 --platform managed --allow-unauthenticated
firebase deploy --only hosting
```

---

## 🚀 Início Rápido (Desenvolvimento Local)

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalar dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Executar Backend (SQLite local)
```bash
cd backend
npm run dev
# Servidor estará disponível em http://localhost:3000
```

### Executar Frontend
```bash
cd frontend
# Abrir index.html no navegador ou usar um servidor HTTP
python -m http.server 8000 # Python 3
```

## 🔥 Setup para Google Cloud Platform

### 1. Preparação
```bash
# Instalar Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# Autenticar
gcloud auth login
gcloud config set project quedia-eventhub
```

### 2. Criar recursos no Google Cloud

Ver arquivo [GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md) para instruções detalhadas.

### 3. Deploy Backend para Cloud Run

```bash
# Com Firebase/Firestore
npm run start:firestore

# Ou fazer deploy direto:
gcloud run deploy eventhub-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

## 📁 Estrutura do Projeto

```
.
├── backend/                    # API Node.js
│   ├── src/
│   │   ├── server.js          # Servidor com SQLite
│   │   ├── server-firestore.js # Servidor com Firestore
│   │   ├── db-sql.js          # Módulo SQLite
│   │   ├── db-firestore.js    # Módulo Firebase
│   │   ├── routes-sql.js      # Rotas (SQLite)
│   │   ├── routes-firestore.js # Rotas (Firestore)
│   │   ├── auth.js            # Autenticação
│   │   └── eventos.js         # Lógica de eventos
│   ├── package.json
│   └── .env.example
│
├── frontend/                  # Interface Web
│   ├── index.html
│   ├── global.js             # Configuração da API
│   ├── login.js
│   ├── event-form.js
│   ├── evento-list.js
│   └── styles.css
│
├── Dockerfile
├── cloudbuild.yaml
└── GOOGLE_CLOUD_SETUP.md
```

## 📡 Rotas da API

### Autenticação
- `POST /api/cadastro` - Registrar novo usuário
- `POST /api/login` - Fazer login
- `GET /api/verificar-email?email=...` - Verificar disponibilidade

### Eventos
- `GET /api/eventos` - Listar todos os eventos
- `GET /api/eventos?organizador_id=123` - Eventos do organizador
- `POST /api/eventos` - Criar evento (requer token)
- `GET /api/eventos/:id` - Obter evento específico
- `PUT /api/eventos/:id` - Atualizar evento (requer token)
- `DELETE /api/eventos/:id` - Deletar evento (requer token)

### Interesses
- `GET /api/eventos/:id/interesse` - Contar interessados
- `POST /api/eventos/:id/interesse` - Marcar interesse
- `DELETE /api/eventos/:id/interesse` - Remover interesse

## 🔐 Variáveis de Ambiente

Criar arquivo `.env` na pasta backend:

```env
# Servidor
NODE_ENV=development
PORT=3000
HOST=localhost

# JWT
JWT_SECRET=sua_chave_secreta_aqui

# CORS
CORS_ORIGIN=*

# Google Cloud (para Firestore)
GOOGLE_CLOUD_PROJECT=quedia-eventhub
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
```

## 🗄️ Banco de Dados

### SQLite (Desenvolvimento)
- Arquivo: `backend/usuarios.db`
- Automático, sem configuração

### Firestore (Produção)
- Banco NoSQL gerenciado do Google Cloud
- Sincronização em tempo real
- Escalabilidade automática

## 📦 Dependências Principais

### Backend
- **express** - Framework web
- **firebase-admin** - SDK para Firestore
- **bcrypt** - Hash de senhas
- **jsonwebtoken** - Tokens JWT
- **cors** - CORS middleware
- **dotenv** - Variáveis de ambiente

### Frontend
- Vanilla JavaScript (sem dependências)
- Fetch API para chamadas HTTP
- LocalStorage para tokens

## 🧪 Testes

```bash
# Backend (teste de conectividade)
node backend/test-server.js
```

## 📝 Notas Importantes

1. **Credenciais Google Cloud**: Nunca fazer commit do arquivo `credentials.json`
2. **Variáveis de Ambiente**: Copiar `.env.example` para `.env`
3. **Frontend API URL**: Configurada automaticamente em `frontend/global.js`
4. **Senha de Teste**: Use senhas fortes em produção

## 🐛 Troubleshooting

### Erro: "Cannot find module 'firebase-admin'"
```bash
cd backend
npm install firebase-admin
```

### Erro: "CORS Error"
Verificar `CORS_ORIGIN` em `.env` ou aumentar a permissividade em `server.js`

### Firestore Connection Error
- Verificar se `credentials.json` está presente
- Verificar permissões da conta de serviço
- Consultarogs: `gcloud run logs read eventhub-api --region us-central1`

## 📚 Recursos Adicionais

- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Firebase Firestore Guide](https://firebase.google.com/docs/firestore)
- [Cloud Run Quickstart](https://cloud.google.com/run/docs/quickstarts)
- [Express.js Documentation](https://expressjs.com/)

## 📄 Licença

MIT

## ✅ Status da Migração

- ✅ Backend corrigido (SQLite funcional)
- ✅ Frontend URLs corrigidas
- ✅ Módulo Firestore criado
- ✅ Docker setup preparado
- ✅ Google Cloud CLI config
- ⏳ Deploy em produção (próximo passo)

---

**Última atualização**: 19 de março de 2026
