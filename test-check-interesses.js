const { connectDB } = require('./backend/src/db');
const mongoose = require('mongoose');
const { removerInteressesPorUsuario } = require('./backend/src/models/interesses');

(async () => {
  try {
    await connectDB();
    const db = mongoose.connection.db;

    const usuarioId = '69cd5044c8a61d5b87a54536';
    const eventoId = '69cd1d0e9e866cd42218cc6c';

    const intereses = await db.collection('interesses').find({ usuario_id: usuarioId, evento_id: eventoId }).toArray();
    console.log('antes de remover, encontrou', intereses.length, 'docs', intereses);

    const removed = await removerInteressesPorUsuario(usuarioId);
    console.log('removidos', removed);

    const after = await db.collection('interesses').find({ usuario_id: usuarioId }).toArray();
    console.log('apos remover, restam', after.length, after);

    const afterCont = await db.collection('interesses').find({ evento_id: eventoId }).count();
    console.log('contador event', afterCont);

    process.exit(0);
  } catch (err) {
    console.error(err);process.exit(1);
  }
})();