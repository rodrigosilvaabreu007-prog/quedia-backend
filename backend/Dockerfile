FROM node:18

WORKDIR /app

# Copia os arquivos de dependência (package.json e package-lock.json)
COPY package*.json ./

# Instala as dependências (incluindo o nodemailer)
RUN npm install

# Copia todo o conteúdo da pasta backend para dentro do container
COPY . .

# Expõe a porta que o Cloud Run exige
EXPOSE 8080

# 🚨 O AJUSTE ESTÁ AQUI:
# Como seu arquivo está em backend/src/server.js, o caminho correto é:
CMD ["node", "src/server.js"]