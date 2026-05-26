// src/routes/monitorias.js
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, soloMonitorOAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

const include = {
  autor:   { select: { id: true, nombre: true, apellido: true, rol: true, descripcion: true } },
  materia: { select: { id: true, nombre: true } },
  tema:    { select: { id: true, nombre: true } },
};

// ── GET /api/monitorias ───────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { materia, tema, q } = req.query;
    const where = {};
    if (materia) where.materiaId = Number(materia);
    if (tema)    where.temaId    = Number(tema);
    if (q)       where.nombre    = { contains: q, mode: 'insensitive' };

    const mons = await prisma.monitoria.findMany({ where, include, orderBy: { createdAt: 'desc' } });
    res.json(mons);
  } catch (e) { next(e); }
});

// ── GET /api/monitorias/:id ───────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const mon = await prisma.monitoria.findUnique({
      where: { id: Number(req.params.id) },
      include,
    });
    if (!mon) return res.status(404).json({ error: 'Monitoría no encontrada' });
    res.json(mon);
  } catch (e) { next(e); }
});

// ── POST /api/monitorias ──────────────────────────────────
router.post('/', authenticate, soloMonitorOAdmin, [
  body('nombre').notEmpty().withMessage('Nombre requerido'),
  body('horario').notEmpty().withMessage('Horario requerido'),
  body('precio').notEmpty().withMessage('Precio requerido'),
  body('link').isURL().withMessage('Link inválido'),
  body('materiaId').isInt(),
  body('temaId').isInt(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { nombre, horario, precio, link, materiaId, temaId } = req.body;
    const mon = await prisma.monitoria.create({
      data: {
        nombre, horario, precio, link,
        materiaId: Number(materiaId),
        temaId:    Number(temaId),
        autorId:   req.user.id,
      },
      include,
    });
    res.status(201).json(mon);
  } catch (e) { next(e); }
});

// ── PATCH /api/monitorias/:id ─────────────────────────────
router.patch('/:id', authenticate, soloMonitorOAdmin, async (req, res, next) => {
  try {
    const id  = Number(req.params.id);
    const mon = await prisma.monitoria.findUnique({ where: { id } });
    if (!mon) return res.status(404).json({ error: 'Monitoría no encontrada' });

    if (mon.autorId !== req.user.id && req.user.rol !== 'administrador') {
      return res.status(403).json({ error: 'Sin permiso para editar esta monitoría' });
    }

    const { nombre, horario, precio, link, materiaId, temaId } = req.body;
    const updated = await prisma.monitoria.update({
      where: { id },
      data: {
        nombre:    nombre    || mon.nombre,
        horario:   horario   || mon.horario,
        precio:    precio    || mon.precio,
        link:      link      || mon.link,
        materiaId: materiaId ? Number(materiaId) : mon.materiaId,
        temaId:    temaId    ? Number(temaId)    : mon.temaId,
      },
      include,
    });
    res.json(updated);
  } catch (e) { next(e); }
});

// ── DELETE /api/monitorias/:id ────────────────────────────
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const id  = Number(req.params.id);
    const mon = await prisma.monitoria.findUnique({ where: { id } });
    if (!mon) return res.status(404).json({ error: 'Monitoría no encontrada' });

    if (mon.autorId !== req.user.id && req.user.rol !== 'administrador') {
      return res.status(403).json({ error: 'Sin permiso para eliminar esta monitoría' });
    }

    await prisma.monitoria.delete({ where: { id } });
    res.json({ mensaje: 'Monitoría eliminada' });
  } catch (e) { next(e); }
});

module.exports = router;
