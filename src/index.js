// src/index.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes         = require('./routes/auth');
const usuariosRoutes     = require('./routes/usuarios');
const publicacionesRoutes = require('./routes/publicaciones');
const monitoriasRoutes   = require('./routes/monitorias');
const favoritosRoutes    = require('./routes/favoritos');
const reportesRoutes     = require('./routes/reportes');
const catalogoRoutes     = require('./routes/catalogo');

const app = express();

// ── CORS ──────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// ── BODY PARSERS ──────────────────────────────────────────
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ extended: true, limit: '150mb' }));

// ── RUTAS ─────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/usuarios',      usuariosRoutes);
app.use('/api/publicaciones', publicacionesRoutes);
app.use('/api/monitorias',    monitoriasRoutes);
app.use('/api/favoritos',     favoritosRoutes);
app.use('/api/reportes',      reportesRoutes);
app.use('/api/catalogo',      catalogoRoutes);

// ── STATS PÚBLICOS ─────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const [pubs, mons, users] = await Promise.all([
      prisma.publicacion.count(),
      prisma.monitoria.count(),
      prisma.usuario.count(),
    ]);
    res.json({ publicaciones: pubs, monitorias: mons, usuarios: users });
  } catch(e) { res.json({ publicaciones: 0, monitorias: 0, usuarios: 0 }); }
});

// ── HEALTH CHECK ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── MANEJO DE ERRORES ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Error interno del servidor',
  });
});

// ── INICIO ────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 PomocApp API corriendo en http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
});
