# Instrucciones para configurar Cloudinary

Para que las imágenes funcionen correctamente en producción (Vercel) y no se borren, debes conectar Cloudinary.

## 1. Crear cuenta en Cloudinary
Si no tienes una, crea una cuenta gratuita en [cloudinary.com](https://cloudinary.com/).

## 2. Obtener credenciales
En tu Dashboard de Cloudinary, copia los siguientes valores:
- **Cloud Name**
- **API Key**
- **API Secret**

## 3. Configurar en Vercel
1. Ve a tu proyecto en Vercel.
2. Ve a **Settings** > **Environment Variables**.
3. Agrega las siguientes variables:

| Key | Value |
| --- | --- |
| `CLOUDINARY_CLOUD_NAME` | (Tu Cloud Name) |
| `CLOUDINARY_API_KEY` | (Tu API Key) |
| `CLOUDINARY_API_SECRET` | (Tu API Secret) |

## 4. Redesplegar
Una vez agregadas las variables, ve a **Deployments** y redepliega tu aplicación (o haz un nuevo push) para que los cambios surtan efecto.

¡Listo! A partir de ahora, todas las imágenes nuevas (perfil, perros, dni, paseos) se guardarán en Cloudinary y no se perderán.
