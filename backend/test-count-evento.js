const { connectDB } = require('./src/db');
const mongoose = require('mongoose');

(async () => {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    const eventoId = '69cd1d0e9e866cd42218cc6c';
    const total = await db.collection('interesses').countDocuments({ evento_id: eventoId });
    const docs = await db.collection('interesses').find({ evento_id: eventoId }).toArray();
    console.log('total interesse evento', total);
    console.log('docs', docs);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();