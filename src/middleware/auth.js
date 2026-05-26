// src/middleware/auth.js
const jwt     = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Verifica que el token JWT sea válido
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Carga el usuario completo desde la DB para tener el rol actualizado
    const usuario = await prisma.usuario.findUnique({ where: { id: payload.id } });
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });
    req.user = usuario;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Solo permite administradores
function soloAdmin(req, res, next) {
  if (req.user?.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol administrador' });
  }
  next();
}

// Permite monitores y administradores
function soloMonitorOAdmin(req, res, next) {
  if (!['monitor', 'administrador'].includes(req.user?.rol)) {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol monitor o administrador' });
  }
  next();
}

module.exports = { authenticate, soloAdmin, soloMonitorOAdmin };
