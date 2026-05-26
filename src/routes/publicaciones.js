// src/routes/publicaciones.js
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, soloMonitorOAdmin, soloAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const prisma = new PrismaClient();

const include = {
  autor:   { select: { id: true, nombre: true, apellido: true, rol: true } },
  materia: { select: { id: true, nombre: true } },
  tema:    { select: { id: true, nombre: true } },
};

// ── GET /api/publicaciones ────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { materia, tema, q } = req.query;
    const where = {};
    if (materia) where.materiaId = Number(materia);
    if (tema)    where.temaId    = Number(tema);
    if (q)       where.nombre    = { contains: q, mode: 'insensitive' };

    const pubs = await prisma.publicacion.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
    });
    res.json(pubs);
  } catch (e) { next(e); }
});

// ── GET /api/publicaciones/:id ────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const pub = await prisma.publicacion.findUnique({
      where: { id: Number(req.params.id) },
      include,
    });
    if (!pub) return res.status(404).json({ error: 'Publicación no encontrada' });
    res.json(pub);
  } catch (e) { next(e); }
});

// ── POST /api/publicaciones ───────────────────────────────
router.post('/', authenticate, soloMonitorOAdmin, [
  body('nombre').notEmpty().withMessage('Nombre requerido'),
  body('materiaId').isInt().withMessage('Materia requerida'),
  body('temaId').isInt().withMessage('Tema requerido'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { nombre, desc, materiaId, temaId, archivo } = req.body;

    const pub = await prisma.publicacion.create({
      data: {
        nombre,
        desc:      desc || null,
        archivo:   archivo || null,
        materiaId: Number(materiaId),
        temaId:    Number(temaId),
        autorId:   req.user.id,
      },
      include,
    });
    res.status(201).json(pub);
  } catch (e) { next(e); }
});

// ── PATCH /api/publicaciones/:id ──────────────────────────
router.patch('/:id', authenticate, soloMonitorOAdmin, async (req, res, next) => {
  try {
    const id  = Number(req.params.id);
    const pub = await prisma.publicacion.findUnique({ where: { id } });
    if (!pub) return res.status(404).json({ error: 'Publicación no encontrada' });

    if (pub.autorId !== req.user.id && req.user.rol !== 'administrador') {
      return res.status(403).json({ error: 'Sin permiso para editar esta publicación' });
    }

    const { nombre, desc, materiaId, temaId, archivo } = req.body;

    const updated = await prisma.publicacion.update({
      where: { id },
      data: {
        nombre:    nombre    || pub.nombre,
        desc:      desc      ?? pub.desc,
        archivo:   archivo !== undefined ? archivo : pub.archivo,
        materiaId: materiaId ? Number(materiaId) : pub.materiaId,
        temaId:    temaId    ? Number(temaId)    : pub.temaId,
      },
      include,
    });
    res.json(updated);
  } catch (e) { next(e); }
});

// ── DELETE /api/publicaciones/:id ─────────────────────────
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const id  = Number(req.params.id);
    const pub = await prisma.publicacion.findUnique({ where: { id } });
    if (!pub) return res.status(404).json({ error: 'Publicación no encontrada' });

    if (pub.autorId !== req.user.id && req.user.rol !== 'administrador') {
      return res.status(403).json({ error: 'Sin permiso para eliminar esta publicación' });
    }

    await prisma.publicacion.delete({ where: { id } });
    res.json({ mensaje: 'Publicación eliminada' });
  } catch (e) { next(e); }
});

module.exports = router;
