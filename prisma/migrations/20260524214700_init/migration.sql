-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('usuario', 'monitor', 'administrador');

-- CreateEnum
CREATE TYPE "EstadoReporte" AS ENUM ('pendiente', 'resuelto', 'descartado');

-- CreateEnum
CREATE TYPE "TipoTarget" AS ENUM ('publicacion', 'monitoria');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'usuario',
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "materias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "materiaId" INTEGER,

    CONSTRAINT "temas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publicaciones" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "desc" TEXT,
    "archivo" TEXT,
    "materiaId" INTEGER NOT NULL,
    "temaId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitorias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "horario" TEXT NOT NULL,
    "precio" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "materiaId" INTEGER NOT NULL,
    "temaId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fav_publicaciones" (
    "usuarioId" INTEGER NOT NULL,
    "publicacionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fav_publicaciones_pkey" PRIMARY KEY ("usuarioId","publicacionId")
);

-- CreateTable
CREATE TABLE "fav_monitorias" (
    "usuarioId" INTEGER NOT NULL,
    "monitoriaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fav_monitorias_pkey" PRIMARY KEY ("usuarioId","monitoriaId")
);

-- CreateTable
CREATE TABLE "reportes" (
    "id" SERIAL NOT NULL,
    "motivo" TEXT NOT NULL,
    "desc" TEXT,
    "estado" "EstadoReporte" NOT NULL DEFAULT 'pendiente',
    "targetType" "TipoTarget" NOT NULL,
    "targetId" INTEGER NOT NULL,
    "reportadoPorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "materias_nombre_key" ON "materias"("nombre");

-- AddForeignKey
ALTER TABLE "temas" ADD CONSTRAINT "temas_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "materias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitorias" ADD CONSTRAINT "monitorias_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitorias" ADD CONSTRAINT "monitorias_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "temas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitorias" ADD CONSTRAINT "monitorias_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fav_publicaciones" ADD CONSTRAINT "fav_publicaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fav_publicaciones" ADD CONSTRAINT "fav_publicaciones_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "publicaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fav_monitorias" ADD CONSTRAINT "fav_monitorias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fav_monitorias" ADD CONSTRAINT "fav_monitorias_monitoriaId_fkey" FOREIGN KEY ("monitoriaId") REFERENCES "monitorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_reportadoPorId_fkey" FOREIGN KEY ("reportadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_publicacion_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "publicaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_monitoria_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "monitorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
