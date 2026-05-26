// src/routes/usuarios.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, soloAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

function usuarioPublico(u) {
  const { password, ...rest } = u;
  return rest;
}

// ── GET /api/usuarios ─────────────────────────────────────
// Solo admin ve la lista completa
router.get('/', authenticate, soloAdmin, async (req, res, next) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, nombre: true, apellido: true, email: true, rol: true, descripcion: true, createdAt: true },
    });
    res.json(usuarios);
  } catch (e) { next(e); }
});

// ── GET /api/usuarios/:id ─────────────────────────────────
// Perfil público de cualquier usuario
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(req.params.id) },
      select: {
        id: true, nombre: true, apellido: true, rol: true, descripcion: true, createdAt: true,
        _count: { select: { publicaciones: true, monitorias: true } },
      },
    });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (e) { next(e); }
});

// ── PATCH /api/usuarios/perfil ────────────────────────────
// El usuario edita su propia descripción
router.patch('/perfil', authenticate, [
  body('descripcion').optional().isString(),
], async (req, res, next) => {
  try {
    const { descripcion } = req.body;
    const usuario = await prisma.usuario.update({
      where: { id: req.user.id },
      data: { descripcion },
    });
    res.json(usuarioPublico(usuario));
  } catch (e) { next(e); }
});

// ── POST /api/usuarios ────────────────────────────────────
// Admin crea usuario
router.post('/', authenticate, soloAdmin, [
  body('nombre').notEmpty(),
  body('apellido').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('rol').isIn(['usuario', 'monitor', 'administrador']),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { nombre, apellido, email, password, rol } = req.body;
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return res.status(409).json({ error: 'El correo ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: { nombre, apellido, email, password: hash, rol },
    });
    res.status(201).json(usuarioPublico(usuario));
  } catch (e) { next(e); }
});

// ── PATCH /api/usuarios/:id/rol ───────────────────────────
// Admin cambia el rol de un usuario
router.patch('/:id/rol', authenticate, soloAdmin, [
  body('rol').isIn(['usuario', 'monitor', 'administrador']),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const usuario = await prisma.usuario.update({
      where: { id: Number(req.params.id) },
      data: { rol: req.body.rol },
    });
    res.json(usuarioPublico(usuario));
  } catch (e) { next(e); }
});

// ── DELETE /api/usuarios/:id ──────────────────────────────
// Admin elimina usuario (cascadea publicaciones y monitorías)
router.delete('/:id', authenticate, soloAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    await prisma.usuario.delete({ where: { id } });
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (e) { next(e); }
});

module.exports = router;
