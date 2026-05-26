// src/routes/favoritos.js
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// ── GET /api/favoritos ────────────────────────────────────
// Devuelve publicaciones y monitorías favoritas del usuario actual
router.get('/', authenticate, async (req, res, next) => {
  try {
    const [pubs, mons] = await Promise.all([
      prisma.favPublicacion.findMany({
        where: { usuarioId: req.user.id },
        include: {
          publicacion: {
            include: {
              autor:   { select: { id: true, nombre: true, apellido: true } },
              materia: { select: { id: true, nombre: true } },
              tema:    { select: { id: true, nombre: true } },
            },
          },
        },
      }),
      prisma.favMonitoria.findMany({
        where: { usuarioId: req.user.id },
        include: {
          monitoria: {
            include: {
              autor:   { select: { id: true, nombre: true, apellido: true } },
              materia: { select: { id: true, nombre: true } },
              tema:    { select: { id: true, nombre: true } },
            },
          },
        },
      }),
    ]);

    res.json({
      publicaciones: pubs.map(f => f.publicacion),
      monitorias:    mons.map(f => f.monitoria),
    });
  } catch (e) { next(e); }
});

// ── POST /api/favoritos/publicaciones/:id ─────────────────
router.post('/publicaciones/:id', authenticate, async (req, res, next) => {
  try {
    const publicacionId = Number(req.params.id);
    await prisma.favPublicacion.upsert({
      where:  { usuarioId_publicacionId: { usuarioId: req.user.id, publicacionId } },
      update: {},
      create: { usuarioId: req.user.id, publicacionId },
    });
    res.json({ guardado: true });
  } catch (e) { next(e); }
});

// ── DELETE /api/favoritos/publicaciones/:id ───────────────
router.delete('/publicaciones/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.favPublicacion.deleteMany({
      where: { usuarioId: req.user.id, publicacionId: Number(req.params.id) },
    });
    res.json({ guardado: false });
  } catch (e) { next(e); }
});

// ── POST /api/favoritos/monitorias/:id ───────────────────
router.post('/monitorias/:id', authenticate, async (req, res, next) => {
  try {
    const monitoriaId = Number(req.params.id);
    await prisma.favMonitoria.upsert({
      where:  { usuarioId_monitoriaId: { usuarioId: req.user.id, monitoriaId } },
      update: {},
      create: { usuarioId: req.user.id, monitoriaId },
    });
    res.json({ guardado: true });
  } catch (e) { next(e); }
});

// ── DELETE /api/favoritos/monitorias/:id ──────────────────
router.delete('/monitorias/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.favMonitoria.deleteMany({
      where: { usuarioId: req.user.id, monitoriaId: Number(req.params.id) },
    });
    res.json({ guardado: false });
  } catch (e) { next(e); }
});

module.exports = router;
