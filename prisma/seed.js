// prisma/seed.js
// Ejecutar: node prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando base de datos...');

  // Materias
  const materias = await Promise.all([
    prisma.materia.upsert({ where: { nombre: 'Cálculo Diferencial' }, update: {}, create: { nombre: 'Cálculo Diferencial' } }),
    prisma.materia.upsert({ where: { nombre: 'Álgebra' }, update: {}, create: { nombre: 'Álgebra' } }),
    prisma.materia.upsert({ where: { nombre: 'Programación' }, update: {}, create: { nombre: 'Programación' } }),
    prisma.materia.upsert({ where: { nombre: 'Física' }, update: {}, create: { nombre: 'Física' } }),
  ]);
  console.log(`✅ ${materias.length} materias creadas`);

  // Temas
  const temas = await Promise.all([
    prisma.tema.upsert({ where: { id: 1 }, update: {}, create: { nombre: 'Derivadas', materiaId: materias[0].id } }),
    prisma.tema.upsert({ where: { id: 2 }, update: {}, create: { nombre: 'Integrales', materiaId: materias[0].id } }),
    prisma.tema.upsert({ where: { id: 3 }, update: {}, create: { nombre: 'Álgebra Lineal', materiaId: materias[1].id } }),
    prisma.tema.upsert({ where: { id: 4 }, update: {}, create: { nombre: 'POO', materiaId: materias[2].id } }),
  ]);
  console.log(`✅ ${temas.length} temas creados`);

  // Usuarios
  const adminPass  = await bcrypt.hash('admin123', 10);
  const monPass    = await bcrypt.hash('123456', 10);
  const userPass   = await bcrypt.hash('123456', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@pomocapp.com' },
    update: {},
    create: { nombre: 'Admin', apellido: 'Sistema', email: 'admin@pomocapp.com', password: adminPass, rol: 'administrador' },
  });
  const monitor = await prisma.usuario.upsert({
    where: { email: 'monitor@test.com' },
    update: {},
    create: { nombre: 'Carlos', apellido: 'Martínez', email: 'monitor@test.com', password: monPass, rol: 'monitor', descripcion: 'Monitor de Cálculo. WhatsApp: 300-000-0000' },
  });
  const usuario = await prisma.usuario.upsert({
    where: { email: 'usuario@test.com' },
    update: {},
    create: { nombre: 'Laura', apellido: 'Gómez', email: 'usuario@test.com', password: userPass, rol: 'usuario' },
  });
  console.log('✅ 3 usuarios creados');

  // Publicaciones de ejemplo
  await prisma.publicacion.createMany({
    skipDuplicates: true,
    data: [
      { nombre: 'Resumen derivadas', desc: 'Conceptos clave de derivadas con ejemplos', materiaId: materias[0].id, temaId: temas[0].id, autorId: monitor.id },
      { nombre: 'Guía integrales', desc: 'Técnicas de integración paso a paso', materiaId: materias[0].id, temaId: temas[1].id, autorId: monitor.id },
      { nombre: 'POO en Java', desc: 'Clases, herencia y polimorfismo', materiaId: materias[2].id, temaId: temas[3].id, autorId: monitor.id },
    ],
  });
  console.log('✅ Publicaciones de ejemplo creadas');

  // Monitorías de ejemplo
  await prisma.monitoria.createMany({
    skipDuplicates: true,
    data: [
      { nombre: 'Monitoría Cálculo', horario: 'Lunes y Miércoles 4-6pm', precio: '$15.000/hora', link: 'https://meet.google.com/ejemplo', materiaId: materias[0].id, temaId: temas[0].id, autorId: monitor.id },
      { nombre: 'Monitoría Programación', horario: 'Martes y Jueves 2-4pm', precio: '$20.000/hora', link: 'https://meet.google.com/ejemplo2', materiaId: materias[2].id, temaId: temas[3].id, autorId: monitor.id },
    ],
  });
  console.log('✅ Monitorías de ejemplo creadas');

  console.log('\n🎉 Base de datos lista');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
