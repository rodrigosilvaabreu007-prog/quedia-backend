const mongoose = require('mongoose');

// Definindo como é um "Interesse" no MongoDB
const InteresseSchema = new mongoose.Schema({
  usuario_id: { type: String, required: true },
  evento_id: { type: String, required: true }
});

// Garante que o mesmo usuário não marque interesse duas vezes no mesmo evento
InteresseSchema.index({ usuario_id: 1, evento_id: 1 }, { unique: true });

const Interesse = mongoose.model('Interesse', InteresseSchema);

// Marcar interesse (Lógica MongoDB)
async function marcarInteresse(usuario_id, evento_id) {
  try {
    await Interesse.findOneAndUpdate(
      { usuario_id, evento_id },
      { usuario_id, evento_id },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("Erro ao marcar interesse:", err.message);
  }
}

// Contador de interessados (Lógica MongoDB)
async function contarInteressados(evento_id) {
  try {
    const total = await Interesse.countDocuments({ evento_id });
    return total;
  } catch (err) {
    console.error("Erro ao contar interessados:", err.message);
    return 0;
  }
}

module.exports = {
  marcarInteresse,
  contarInteressados
};