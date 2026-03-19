FROM node:18

WORKDIR /app

# Copia package.json
COPY backend/package*.json ./

# Instala dependências
RUN npm install

# Copia o resto do backend
COPY backend ./backend

# Expõe a porta (Cloud Run usa variável, mas ok deixar 3000)
EXPOSE 3000

# Inicia o servidor correto
CMD ["node", "backend/src/server.js"]