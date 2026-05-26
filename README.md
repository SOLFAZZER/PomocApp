# PomocApp — Backend

API REST construida con **Node.js + Express + Prisma + PostgreSQL**.

---

## Requisitos previos

- Node.js 18+
- PostgreSQL 14+ instalado y corriendo
- Cuenta gratuita en [Cloudinary](https://cloudinary.com) (para archivos adjuntos)

---

## Instalación paso a paso

### 1. Clonar e instalar dependencias
```bash
cd pomocapp-backend
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Edita .env con tus credenciales reales
```

Variables importantes en `.env`:
```
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/pomocapp"
JWT_SECRET="una_clave_larga_y_segura"
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"
```

### 3. Crear la base de datos en PostgreSQL
```bash
# Conéctate a PostgreSQL y crea la base de datos
psql -U postgres
CREATE DATABASE pomocapp;
\q
```

### 4. Ejecutar migraciones (crea las tablas)
```bash
npx prisma migrate dev --name init
```

### 5. Sembrar datos de prueba
```bash
npm run db:seed
```
Esto crea:
- Admin: `admin@pomocapp.com` / `admin123`
- Monitor: `monitor@test.com` / `123456`
- Usuario: `usuario@test.com` / `123456`

### 6. Iniciar el servidor
```bash
npm run dev      # Desarrollo (con auto-reload)
npm start        # Producción
```

El servidor corre en `http://localhost:3000`

---

## Endpoints de la API

Todas las rutas (excepto login y registro) requieren el header:
```
Authorization: Bearer <token>
```

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/registro` | Crear cuenta |
| POST | `/api/auth/login` | Iniciar sesión → devuelve token |
| POST | `/api/auth/recuperar` | Recuperar contraseña |
| GET  | `/api/auth/me` | Ver mi perfil (requiere token) |

### Usuarios
| Método | Ruta | Rol requerido |
|--------|------|---------------|
| GET | `/api/usuarios` | Admin |
| GET | `/api/usuarios/:id` | Cualquiera |
| PATCH | `/api/usuarios/perfil` | Cualquiera (propio) |
| POST | `/api/usuarios` | Admin |
| PATCH | `/api/usuarios/:id/rol` | Admin |
| DELETE | `/api/usuarios/:id` | Admin |

### Publicaciones
| Método | Ruta | Rol requerido |
|--------|------|---------------|
| GET | `/api/publicaciones?materia=1&tema=2&q=texto` | Cualquiera |
| GET | `/api/publicaciones/:id` | Cualquiera |
| POST | `/api/publicaciones` (multipart/form-data) | Monitor/Admin |
| PATCH | `/api/publicaciones/:id` | Autor/Admin |
| DELETE | `/api/publicaciones/:id` | Autor/Admin |

### Monitorías
| Método | Ruta | Rol requerido |
|--------|------|---------------|
| GET | `/api/monitorias?materia=1&tema=2&q=texto` | Cualquiera |
| GET | `/api/monitorias/:id` | Cualquiera |
| POST | `/api/monitorias` | Monitor/Admin |
| PATCH | `/api/monitorias/:id` | Autor/Admin |
| DELETE | `/api/monitorias/:id` | Autor/Admin |

### Favoritos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/favoritos` | Mis favoritos |
| POST | `/api/favoritos/publicaciones/:id` | Guardar pub |
| DELETE | `/api/favoritos/publicaciones/:id` | Quitar pub |
| POST | `/api/favoritos/monitorias/:id` | Guardar monitoría |
| DELETE | `/api/favoritos/monitorias/:id` | Quitar monitoría |

### Reportes
| Método | Ruta | Rol requerido |
|--------|------|---------------|
| GET | `/api/reportes` | Admin |
| POST | `/api/reportes` | Cualquiera |
| PATCH | `/api/reportes/:id` | Admin |
| DELETE | `/api/reportes/:id/contenido` | Admin |

### Catálogo (Materias y Temas)
| Método | Ruta | Rol requerido |
|--------|------|---------------|
| GET | `/api/catalogo/materias` | Cualquiera |
| POST | `/api/catalogo/materias` | Admin |
| DELETE | `/api/catalogo/materias/:id` | Admin |
| GET | `/api/catalogo/temas` | Cualquiera |
| POST | `/api/catalogo/temas` | Admin |
| DELETE | `/api/catalogo/temas/:id` | Admin |

---

## Estructura del proyecto

```
pomocapp-backend/
├── prisma/
│   ├── schema.prisma      # Modelos de la base de datos
│   └── seed.js            # Datos iniciales de prueba
├── src/
│   ├── index.js           # Servidor principal
│   ├── middleware/
│   │   ├── auth.js        # Verificación JWT y roles
│   │   └── upload.js      # Subida de archivos a Cloudinary
│   └── routes/
│       ├── auth.js        # Login, registro, recuperar contraseña
│       ├── usuarios.js    # CRUD de usuarios
│       ├── publicaciones.js
│       ├── monitorias.js
│       ├── favoritos.js
│       ├── reportes.js
│       └── catalogo.js    # Materias y temas
├── .env.example
├── package.json
└── README.md
```

---

## Conectar con el frontend

En el HTML del frontend, reemplaza las funciones `doLogin`, `doRegister`, etc. para que hagan fetch a la API en lugar de usar el array `db`:

```javascript
// Ejemplo: login desde el frontend
async function doLogin() {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('token', data.token);
    loginUser(data.usuario);
  }
}
```

---

## Herramientas útiles

```bash
npx prisma studio     # GUI visual de la base de datos en el navegador
npx prisma migrate dev --name nombre   # Crear nueva migración
npx prisma db push    # Sincronizar schema sin migración (desarrollo rápido)
```

---

## Deploy en Railway (recomendado)

1. Sube el proyecto a GitHub
2. En [railway.app](https://railway.app), crea un proyecto nuevo
3. Agrega un servicio PostgreSQL — Railway genera el `DATABASE_URL` automáticamente
4. Agrega el repositorio como segundo servicio
5. Configura las variables de entorno en el panel
6. Railway hace el deploy automáticamente con cada push
