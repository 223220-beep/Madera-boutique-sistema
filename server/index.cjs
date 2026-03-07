const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');
const database = require('./database.cjs');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
  maxHttpBufferSize: 50e6,
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ========== RUTAS DE NOTAS ==========

app.get('/api/notas', (req, res) => {
  try {
    const notas = database.getAllNotas();
    res.json(notas);
  } catch (err) {
    console.error('Error al obtener notas:', err);
    res.status(500).json({ error: 'Error al obtener notas' });
  }
});

app.get('/api/notas/:id', (req, res) => {
  try {
    const nota = database.getNotaById(req.params.id);
    if (!nota) return res.status(404).json({ error: 'Nota no encontrada' });
    res.json(nota);
  } catch (err) {
    console.error('Error al obtener nota:', err);
    res.status(500).json({ error: 'Error al obtener nota' });
  }
});

app.post('/api/notas', (req, res) => {
  try {
    const nota = database.createNota(req.body);
    io.emit('nota:created', nota);
    res.status(201).json(nota);
  } catch (err) {
    console.error('Error al crear nota:', err);
    res.status(500).json({ error: 'Error al crear nota' });
  }
});

app.put('/api/notas/:id', (req, res) => {
  try {
    const nota = database.updateNota(req.params.id, req.body);
    if (!nota) return res.status(404).json({ error: 'Nota no encontrada' });
    io.emit('nota:updated', nota);
    res.json(nota);
  } catch (err) {
    console.error('Error al actualizar nota:', err);
    res.status(500).json({ error: 'Error al actualizar nota' });
  }
});

app.patch('/api/notas/:id', (req, res) => {
  try {
    const nota = database.updateNota(req.params.id, req.body);
    if (!nota) return res.status(404).json({ error: 'Nota no encontrada' });
    io.emit('nota:updated', nota);
    res.json(nota);
  } catch (err) {
    console.error('Error al actualizar nota:', err);
    res.status(500).json({ error: 'Error al actualizar nota' });
  }
});

// ========== RUTAS DE DISEÑADORES ==========

app.get('/api/disenadores', (req, res) => {
  try {
    const disenadores = database.getDisenadores();
    res.json(disenadores);
  } catch (err) {
    console.error('Error al obtener diseñadores:', err);
    res.status(500).json({ error: 'Error al obtener diseñadores' });
  }
});

app.post('/api/disenadores', (req, res) => {
  try {
    const { nombre } = req.body;
    const success = database.addDisenador(nombre);
    if (!success) return res.status(409).json({ error: 'Diseñador ya existe' });
    io.emit('disenadores:updated', database.getDisenadores());
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error al agregar diseñador:', err);
    res.status(500).json({ error: 'Error al agregar diseñador' });
  }
});

app.put('/api/disenadores/:nombre', (req, res) => {
  try {
    const { nuevoNombre } = req.body;
    const success = database.updateDisenador(req.params.nombre, nuevoNombre);
    if (!success) return res.status(404).json({ error: 'Diseñador no encontrado' });
    io.emit('disenadores:updated', database.getDisenadores());
    res.json({ success: true });
  } catch (err) {
    console.error('Error al actualizar diseñador:', err);
    res.status(500).json({ error: 'Error al actualizar diseñador' });
  }
});

app.delete('/api/disenadores/:nombre', (req, res) => {
  try {
    const success = database.deleteDisenador(req.params.nombre);
    if (!success) return res.status(400).json({ error: 'No se puede eliminar' });
    io.emit('disenadores:updated', database.getDisenadores());
    res.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar diseñador:', err);
    res.status(500).json({ error: 'Error al eliminar diseñador' });
  }
});

// ========== WEBSOCKET ==========

io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// ========== INICIAR ==========

const PORT = process.env.PORT || 3001;

async function start() {
  await database.initDatabase();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Servidor iniciado en puerto ${PORT}`);
    console.log(`📡 API disponible en:`);

    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`   🖥️  http://${iface.address}:${PORT}`);
        }
      }
    }
    console.log(`   💻 http://localhost:${PORT}`);
    console.log(`\n📂 Base de datos: ${require('path').join(__dirname, '..', 'data', 'negocio.db')}`);
    console.log(`\n✅ Listo para recibir conexiones`);
  });
}

start().catch(err => {
  console.error('Error al iniciar servidor:', err);
  process.exit(1);
});
