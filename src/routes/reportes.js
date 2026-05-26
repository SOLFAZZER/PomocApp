// src/routes/reportes.js
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, soloAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// ── GET /api/reportes ─────────────────────────────────────
// Solo admin
router.get('/', authenticate, soloAdmin, async (req, res, next) => {
  try {
    const reportes = await prisma.reporte.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reportadoPor: { select: { id: true, nombre: true, apellido: true, email: true } },
      },
    });
    res.json(reportes);
  } catch (e) { next(e); }
});

// ── POST /api/reportes ────────────────────────────────────
router.post('/', authenticate, [
  body('motivo').notEmpty().withMessage('Motivo requerido'),
  body('targetType').isIn(['publicacion', 'monitoria']).withMessage('Tipo inválido'),
  body('targetId').isInt().withMessage('ID de contenido requerido'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { motivo, desc, targetType, targetId } = req.body;
    const reporte = await prisma.reporte.create({
      data: {
        motivo,
        desc:          desc || null,
        targetType,
        targetId:      Number(targetId),
        reportadoPorId: req.user.id,
      },
    });
    res.status(201).json(reporte);
  } catch (e) { next(e); }
});

// ── PATCH /api/reportes/:id ───────────────────────────────
// Admin cambia estado del reporte
router.patch('/:id', authenticate, soloAdmin, [
  body('estado').isIn(['pendiente', 'resuelto', 'descartado']),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const reporte = await prisma.reporte.update({
      where: { id: Number(req.params.id) },
      data:  { estado: req.body.estado },
    });
    res.json(reporte);
  } catch (e) { next(e); }
});

// ── DELETE /api/reportes/:id/contenido ───────────────────
// Admin elimina el contenido reportado
router.delete('/:id/contenido', authenticate, soloAdmin, async (req, res, next) => {
  try {
    const reporte = await prisma.reporte.findUnique({ where: { id: Number(req.params.id) } });
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });

    if (reporte.targetType === 'publicacion') {
      await prisma.publicacion.delete({ where: { id: reporte.targetId } });
    } else {
      await prisma.monitoria.delete({ where: { id: reporte.targetId } });
    }

    await prisma.reporte.update({ where: { id: reporte.id }, data: { estado: 'resuelto' } });
    res.json({ mensaje: 'Contenido eliminado y reporte marcado como resuelto' });
  } catch (e) { next(e); }
});

module.exports = router;
