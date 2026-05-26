// src/routes/catalogo.js
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, soloAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// ── GET /api/catalogo/materias ────────────────────────────
router.get('/materias', authenticate, async (req, res, next) => {
  try {
    const materias = await prisma.materia.findMany({
      orderBy: { nombre: 'asc' },
      include: { temas: { orderBy: { nombre: 'asc' } } },
    });
    res.json(materias);
  } catch (e) { next(e); }
});

// ── POST /api/catalogo/materias ───────────────────────────
router.post('/materias', authenticate, soloAdmin, [
  body('nombre').notEmpty().withMessage('Nombre requerido'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const materia = await prisma.materia.create({ data: { nombre: req.body.nombre } });
    res.status(201).json(materia);
  } catch (e) { next(e); }
});

// ── DELETE /api/catalogo/materias/:id ────────────────────
router.delete('/materias/:id', authenticate, soloAdmin, async (req, res, next) => {
  try {
    await prisma.materia.delete({ where: { id: Number(req.params.id) } });
    res.json({ mensaje: 'Materia eliminada' });
  } catch (e) { next(e); }
});

// ── GET /api/catalogo/temas ───────────────────────────────
router.get('/temas', authenticate, async (req, res, next) => {
  try {
    const temas = await prisma.tema.findMany({
      orderBy: { nombre: 'asc' },
      include: { materia: { select: { id: true, nombre: true } } },
    });
    res.json(temas);
  } catch (e) { next(e); }
});

// ── POST /api/catalogo/temas ──────────────────────────────
router.post('/temas', authenticate, soloAdmin, [
  body('nombre').notEmpty().withMessage('Nombre requerido'),
  body('materiaId').optional().isInt(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { nombre, materiaId } = req.body;
    const tema = await prisma.tema.create({
      data: { nombre, materiaId: materiaId ? Number(materiaId) : null },
    });
    res.status(201).json(tema);
  } catch (e) { next(e); }
});

// ── DELETE /api/catalogo/temas/:id ───────────────────────
router.delete('/temas/:id', authenticate, soloAdmin, async (req, res, next) => {
  try {
    await prisma.tema.delete({ where: { id: Number(req.params.id) } });
    res.json({ mensaje: 'Tema eliminado' });
  } catch (e) { next(e); }
});

module.exports = router;
