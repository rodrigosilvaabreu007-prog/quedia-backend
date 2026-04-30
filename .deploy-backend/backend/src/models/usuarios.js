const mongoose = require('mongoose');

// Schema para Usuários
const UsuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    cargo: { type: String, default: "usuario", enum: ["usuario", "adm"] }, // Novo campo para cargo
    criadoEm: { type: Date, default: Date.now }
}, {
    bufferCommands: false
});

// Lista de administradores hardcoded
const ADMINISTRADORES = [
    {
        nome: "rodrigo",
        email: "rodrigo.silva.abreu554466@gmail.com",
        senha: "Rdrg_2007",
        cargo: "adm"
    }
    // Adicione mais admins aqui conforme necessário
];

// Função para inicializar admins se não existirem
UsuarioSchema.statics.inicializarAdmins = async function() {
    console.log('🔧 Iniciando inicialização de admins...');
    const bcrypt = require('bcryptjs');
    for (const admin of ADMINISTRADORES) {
        console.log(`🔍 Verificando se admin ${admin.email} existe...`);
        const existe = await this.findOne({ email: admin.email });
        if (!existe) {
            console.log(`➕ Criando admin ${admin.nome}...`);
            const adminComHash = { ...admin, senha: await bcrypt.hash(admin.senha, 10) };
            const novoAdmin = new this(adminComHash);
            await novoAdmin.save();
            console.log(`✅ Admin ${admin.nome} criado com sucesso.`);
        } else {
            console.log(`ℹ️ Usuário ${admin.email} já existe. Verificando cargo...`);
            if (existe.cargo !== 'adm' || existe.nome !== admin.nome) {
                console.log(`🔄 Atualizando cadastro para admin...`);
                existe.cargo = 'adm';
                existe.nome = admin.nome;
                existe.senha = await bcrypt.hash(admin.senha, 10); // Atualizar senha também
                await existe.save();
                console.log(`✅ Cadastro atualizado para admin.`);
            } else {
                console.log(`✅ Já é admin.`);
            }
        }
    }
    console.log('🎉 Inicialização de admins concluída.');
};

const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);

module.exports = Usuario;