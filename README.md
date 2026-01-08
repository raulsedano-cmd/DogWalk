# 🐕 DogWalk MVP (Mejorado)

Una plataforma web para conectar dueños de perros con paseadores confiables. Construido con React, Node.js, Express y PostgreSQL.

## 🌟 Nuevas Características (MVP Mejorado v2.0)

### 👤 Perfil de Paseador Potenciado
- **Perfil Completo**: Los paseadores ahora pueden detallar su experiencia, subir foto de perfil, y definir sus preferencias (tamaños de perro aceptados, máximo de perros a la vez).
- **Configuración de Servicio**: Definición de Ciudad y Zona base de operación, y radio de servicio en Km.
- **Control de Disponibilidad**: Toggle rápido "Disponible/No Disponible" en el Dashboard. Si no estás disponible, no aparecerán nuevas solicitudes.

### � Filtrado Inteligente
- **Matching por Zona**: Los paseadores ven automáticamente solo las solicitudes en su ciudad base.
- **Filtros Avanzados**: Búsqueda por zonas específicas y tamaño de perro.

### ❤️ Favoritos y Bloqueos (Social)
- **Favoritos**: Los dueños pueden marcar paseadores como favoritos para encontrarlos rápido en su Dashboard.
- **Bloqueos**: Los dueños pueden bloquear paseadores. Un paseador bloqueado no puede enviar ofertas a ese dueño.
- **Gestión Visual**: Iconos de corazón y bloqueo directamente en la lista de ofertas recibidas.

### 💬 Mensajería Integrada
- **Chat Contextual**: Chat simple integrado en el detalle de la solicitud.
- **Comunicación Directa**: Permite aclarar dudas antes o durante el paseo entre Dueño y Paseador (o postulant).

### � Reportes de Paseo
- **Feedback Detallado**: Al completar un paseo, el paseador llena un mini-reporte:
  - ¿Hizo Pipí? 💧
  - ¿Hizo Popó? 💩
  - Calificación de Comportamiento (1-5)
  - Notas adicionales
### 🛡️ Cumplimiento Legal y Seguridad (v3.0 - Perú 🇵🇪)
- **Marco de Intermediación Digital**: DogWalk opera legalmente como intermediario tecnológico (Art. 1361 CC), no como prestador directo del servicio.
- **Términos y Condiciones Mandatorios**: Consentimiento expreso y verificable requerido para todos los usuarios.
- **Verificación de Identidad (DNI)**: Los paseadores deben subir fotos de su DNI frontal y reverso. No pueden enviar ofertas ni aceptar paseos hasta ser **VERIFICADOS**.
- **Deslinde de Responsabilidad Sólido**: Protección legal de la plataforma ante incidentes entre terceros (Art. 1969 CC).
- **Canal de Ayuda e Incidencias**: Sistema de tickets "Indecopi-friendly" para reportar seguridad, pagos o problemas en el servicio.
- **Privacidad de Datos**: Conforme a la Ley N° 29733 de Protección de Datos Personales en Perú.
- **Ficha del Perro (Manejo Seguro)**: Perfiles detallados con foto, raza, nivel de energía y alertas de reactividad/bozal/leash, garantizando que el paseador sepa exactamente cómo manejar a cada mascota.
- **Pagos (MVP v1)**: Registro de pagos externos (Efectivo/Transferencia). El dueño marca como pagado una vez completado el paseo.
- **Comisiones (Intermediación)**: Cálculo automático del 15% de comisión de plataforma al completar cada paseo, permitiendo un seguimiento claro de la deuda técnica del paseador con la app.

---

## � Cómo Iniciar

### Prerrequisitos
- Node.js (v18+)
- PostgreSQL (v14+)

### Instalación

1. **Clonar el repositorio**
2. **Backend**:
   ```bash
   cd server
   npm install
   # Crear .env basado en .env.example
   npx prisma db push  # Sincroniza la nueva base de datos
   npm run seed        # (Opcional) Carga datos de prueba v2
   npm run dev
   ```
3. **Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## � Flujos de Usuario Actualizados

### Dueño (Owner)
1. **Registro/Login**.
2. **Dashboard**: Ve sus solicitudes (Abiertas, Asignadas, Completadas) y su lista de **Paseadores Favoritos**.
3. **Crear Solicitud**: Define fecha, hora, zona y precio.
4. **Ver Ofertas**:
   - Ve lista de paseadores postulados.
   - Puede ver perfiles detallados (foto, experiencia, verificación).
   - Puede **Marcar Favorito** o **Bloquear**.
   - Acepta una oferta.
5. **Durante el Paseo**: Puede **chatear** con el paseador asignado.
6. **Finalizar**: Al terminar, ve el **Reporte del Paseo** (necesidades, notas) y deja una Reseña.

### Paseador (Walker)
1. **Registro/Login**.
2. **Perfil**: Configura su **Disponibilidad**, **Zona Base**, Radio y Preferencias.
3. **Dashboard**:
   - Toggle de **Disponibilidad** (ON/OFF).
   - Ve solicitudes disponibles FILTRADAS por su ciudad/zona.
   - Aplica filtros extra (tamaño perro).
4. **Ofertar**: Se postula a una solicitud con un precio y mensaje.
5. **Asignación**: Si es elegido, ve el paseo en "Mis Paseos".
6. **Chat**: Puede enviar mensajes al dueño.
7. **Completar**: Al finalizar, marca "Completar" y llena el **Reporte de Paseo** obligatorio.

## 🚀 Guía de Despliegue (Free Tier)

Esta aplicación está lista para ser desplegada en servicios gratuitos.

### 1. Base de Datos (Supabase)
1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Copia la `DATABASE_URL` (Connection String) desde Settings > Database.
3. Asegúrate de que el password no tenga caracteres especiales problemáticos en la URL.

### 2. Almacenamiento de Imágenes (Cloudinary)
1. Crea una cuenta en [Cloudinary](https://cloudinary.com/).
2. Copia tu `Cloud Name`, `API Key` y `API Secret` desde el Dashboard.

### 3. Backend (Render / Google Cloud Run)
**Configuración en Render:**
1. Conecta tu repositorio de GitHub.
2. Build Command: `npm install && npx prisma generate`
3. Start Command: `npm start` (Asegúrate de tener un script `start` en `server/package.json`)
4. **Variables de Entorno:**
   - `DATABASE_URL`: Tu URL de Supabase.
   - `JWT_SECRET`: Una cadena aleatoria larga.
   - `CLOUDINARY_CLOUD_NAME`: Tu Cloud Name.
   - `CLOUDINARY_API_KEY`: Tu API Key.
   - `CLOUDINARY_API_SECRET`: Tu API Secret.
   - `CORS_ORIGIN`: La URL de tu frontend (ej: `https://tu-app.vercel.app`).

### 4. Frontend (Vercel / Netlify)
1. Conecta tu repositorio de GitHub.
2. Root Directory: `client`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. **Variables de Entorno:**
   - `VITE_API_BASE_URL`: La URL pública de tu backend en Render.
   - `VITE_GOOGLE_MAPS_API_KEY`: Tu API Key de Google Maps.

---

## 📱 Mejoras de Responsividad (Checklist 320px)

- [x] **Menú Mobile:** Implementado con hamburguesa y navegación fluida.
- [x] **Modales:** Todos los modales tienen `max-h-[90vh]` y scroll interno para pantallas pequeñas.
- [x] **Tablas vs Cards:** Los listados (como Pagos) cambian automáticamente de tablas (desktop) a tarjetas elegantes (mobile).
- [x] **Formularios:** Alineados en una sola columna en pantallas móviles para máxima usabilidad.

---

## 🔑 Login Social (OAuth 2.0)
La aplicación soporta registro e inicio de sesión rápido con un clic.

### Configuración
1. **Google:** Crea un proyecto en Google Cloud Console, habilita OAuth 2.0 y obtén el `Client ID`.
2. **Facebook:** Crea una App en Facebook Developers, habilita "Facebook Login" y obtén el `App ID` y `App Secret`.
3. **Microsoft:** Registra una aplicación en Azure Portal (App Registrations) y obtén el `Application (client) ID`.

### Variables de Entorno Necesarias
**Backend (.env):**
- `GOOGLE_CLIENT_ID`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `MICROSOFT_CLIENT_ID`

**Frontend (.env):**
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_FACEBOOK_APP_ID`
- `VITE_MICROSOFT_CLIENT_ID`

---

## 🛠️ Tecnologías Utilizadas
- **Frontend:** React, Vite, TailwindCSS, Axios, React Router, @react-oauth/google.
- **Backend:** Node.js, Express, Prisma ORM, Multer, Google Auth Library.
- **Base de Datos:** PostgreSQL (via Prisma).
- **Servicios:** Cloudinary (Imágenes), Google Maps API (Ubicación), OAuth 2.0 (Social Auth).
- **Validación Social**: Bloqueos y Favoritos a nivel base de datos.

