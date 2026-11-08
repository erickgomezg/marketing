# Administrador inicial

Compose ejecuta el servicio de una sola vez `admin-bootstrap` después de `database-init` y antes del backend. El servicio de inicialización aislado lee `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` y `BOOTSTRAP_ADMIN_NAME`, genera un hash Argon2id en el backend y envía únicamente el hash al procedimiento `dbo.usp_Auth_BootstrapAdministrator` usando el login administrativo SQL que no recibe el backend normal. El login `app_user` tiene denegado explícitamente ese procedimiento.

El procedimiento usa un application lock transaccional. Si ya existe cualquier usuario con rol `Administrador`, termina sin cambiar ni crear cuentas. Si el correo configurado ya pertenece a otro usuario y aún no existe Administrador, falla sin elevar ese usuario. Una contraseña debe tener al menos 12 caracteres. La cuenta Administrador obtiene acceso global por los predicados de autorización; no requiere filas de permiso granular.

## Entorno local

1. Configura el `.env` local (no versionado) con los valores habituales de Compose y define `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME` y `BOOTSTRAP_ADMIN_PASSWORD` con datos propios. Usa una contraseña aleatoria de al menos 12 caracteres; no reutilices credenciales personales.
2. Arranca el stack:

   ```bash
   docker compose up -d --build
   ```

3. Abre `http://localhost/` e ingresa con el correo y contraseña configurados.

No escribas la contraseña en el repositorio, en comandos compartidos ni en logs. Si Compose indica que falta una variable de bootstrap, complétala localmente; no se provisiona una cuenta predeterminada.

## Producción

Entrega las tres variables al proceso de despliegue mediante el gestor de secretos/variables protegidas del entorno. Limita su lectura al job de primera instalación, conserva la contraseña inicial en el gestor corporativo autorizado y no la incluyas en imágenes ni en archivos versionados. Ejecuta el despliegue Compose normal. Si el bootstrap informa que ya existe un Administrador, no cambia su contraseña; el acceso se recupera mediante el flujo de recuperación que se implementará en un bloque posterior.

El bootstrap es seguro de repetir respecto de duplicados y sobrescritura. La contraseña se vuelve a hashear en ejecuciones posteriores, pero el SP no la persiste ni reemplaza cuando ya existe un Administrador. Se comprobó en un SQL Server efímero que la primera ejecución crea la cuenta, una segunda no altera credenciales ni duplica Admin y el login HTTP acepta sólo la contraseña original. No se ha ejecutado sobre el volumen persistente del proyecto.
