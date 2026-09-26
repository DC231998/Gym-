# Guía de Despliegue en Producción: GitHub + Supabase + Vercel

Esta guía detalla los pasos exactos para publicar **3D Business Manager** en la nube con persistencia real en PostgreSQL (Supabase) y alojamiento serverless global (Vercel).

---

## 1. Preparación para GitHub

1. Inicializa el repositorio Git en la carpeta del proyecto si aún no está inicializado:
   ```bash
   git init
   git add .
   git commit -m "feat: 3D Business Manager producción listo"
   ```

2. Crea un nuevo repositorio en [GitHub](https://github.com/new) (puede ser público o privado).

3. Vincula el remoto y sube tu código:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/3d-business-manager.git
   git branch -M main
   git push -u origin main
   ```

> **Seguridad**: El archivo `.gitignore` ya está configurado para excluir `.env`, `node_modules`, `.next` y la base de datos local `dev.db`. Ningún secreto será expuesto en GitHub.

---

## 2. Configuración de Supabase (Base de Datos PostgreSQL)

1. Ingresa a [Supabase](https://supabase.com) e inicia sesión o regístrate.
2. Haz clic en **New Project** y asigna:
   - **Name**: `3d-business-manager`
   - **Database Password**: Genera una contraseña segura y guárdala.
   - **Region**: Selecciona la más cercana a tus clientes (ej. `us-east-1` o `us-west-1`).
3. Una vez creado el proyecto, ve a:
   - **Project Settings** (icono de engrane) &rarr; **Database**.
4. En la sección **Connection string**, selecciona el modo **URI**:
   - **Mode: Session / Transaction (Port 6543)**: Esta es tu `DATABASE_URL` para producción con Connection Pooling:
     ```env
     DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[TU-CONTRASEÑA]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
     ```
   - **Mode: Direct (Port 5432)**: Esta es tu `DIRECT_URL` para ejecutar migraciones directas:
     ```env
     DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[TU-CONTRASEÑA]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
     ```

5. Configura tu proyecto local para conectar con Supabase ejecutando:
   ```bash
   npm run db:use:supabase
   ```
   (Esto ajusta automáticamente el datasource de Prisma a `postgresql`).

6. Envía el esquema de tablas completo a Supabase:
   ```bash
   npx prisma db push
   ```

7. Opcional: Carga los datos iniciales y la configuración de Bambu Lab P1S Combo a Supabase:
   ```bash
   node scripts/seed.mjs
   ```

---

## 3. Despliegue en Vercel

1. Ingresa a [Vercel](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **Add New...** &rarr; **Project**.
3. Importa el repositorio `3d-business-manager` que subiste a GitHub.
4. En la pantalla de configuración del proyecto:
   - **Framework Preset**: `Next.js` (detectado automáticamente).
   - **Root Directory**: `./` (o la raíz del proyecto).
   - **Build Command**: `npx prisma generate && next build` (configurado automáticamente en `vercel.json`).
5. En la sección **Environment Variables**, añade las siguientes variables:

   | Variable | Valor | Descripción |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@[HOST]:6543/postgres?pgbouncer=true` | Cadena con Connection Pooler de Supabase |
   | `DIRECT_URL` | `postgresql://postgres.[REF]:[PASS]@[HOST]:5432/postgres` | Conexión directa para Prisma |
   | `NODE_ENV` | `production` | Modo de producción |

6. Haz clic en **Deploy**.
7. Vercel compilará automáticamente el proyecto, generará el cliente Prisma y te entregará una URL pública segura (ej. `https://3d-business-manager.vercel.app`).

---

## 4. Retornar a Desarrollo Local Offline

Si deseas continuar desarrollando en tu máquina local sin conexión a internet ni a Supabase, puedes volver a SQLite en cualquier momento ejecutando:
```bash
npm run db:use:sqlite
```
Y para volver a producción:
```bash
npm run db:use:supabase
```
