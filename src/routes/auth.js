// src/routes/auth.js
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// Helper para generar token
function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Helper para respuesta sin password
function usuarioPublico(u) {
  const { password, ...rest } = u;
  return rest;
}

// ── POST /api/auth/registro ───────────────────────────────
router.post('/registro', [
  body('nombre').notEmpty().withMessage('Nombre requerido'),
  body('apellido').notEmpty().withMessage('Apellido requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  body('rol').optional().isIn(['usuario', 'monitor']).withMessage('Rol inválido'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { nombre, apellido, email, password, rol = 'usuario' } = req.body;

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return res.status(409).json({ error: 'El correo ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: { nombre, apellido, email, password: hash, rol },
    });

    const token = generarToken(usuario);
    res.status(201).json({ token, usuario: usuarioPublico(usuario) });
  } catch (e) { next(e); }
});

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const ok = await bcrypt.compare(password, usuario.password);
    if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = generarToken(usuario);
    res.json({ token, usuario: usuarioPublico(usuario) });
  } catch (e) { next(e); }
});

// ── POST /api/auth/recuperar ──────────────────────────────
// En producción esto enviaría un email; aquí manda un token de reset
router.post('/recuperar', [
  body('email').isEmail().withMessage('Email inválido'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    // Respuesta genérica para no revelar si el email existe
    if (!usuario) return res.json({ mensaje: 'Si el correo existe, recibirás instrucciones.' });

    // Token de reset válido por 1 hora
    const resetToken = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // TODO: enviar email con el resetToken usando nodemailer
    console.log(`[DEV] Reset token para ${email}:`, resetToken);
    res.json({ mensaje: 'Si el correo existe, recibirás instrucciones.', dev_token: resetToken });
  } catch (e) { next(e); }
});

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({ usuario: usuarioPublico(req.user) });
});

module.exports = router;
