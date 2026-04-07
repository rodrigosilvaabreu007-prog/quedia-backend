const mongoose = require('mongoose');
const { connectDB } = require('./src/db');
const { buscarEventoPorId } = require('./src/models/eventos');
(async () => {
  try {
    await connectDB();
    const id = '69d52e553b4f89ccfd5370a8';
    const evento = await buscarEventoPorId(id);
    console.log({
      id: evento?._id?.toString(),
      nome: evento?.nome,
      latitude: evento?.latitude,
      longitude: evento?.longitude,
      local: evento?.local,
      endereco: evento?.endereco
    });
  } catch (err) {
    console.error(err);
  } finally {
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
  }
})();