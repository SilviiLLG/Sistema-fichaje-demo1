# Sistema de Fichaje — Demo interactiva

Esta versión está preparada como demostración de portfolio y no utiliza PostgreSQL ni SQLite.

## Estructura

- `app_code.py`: aplicación Flask y exportación Excel.
- `templates/`: páginas HTML.
- `static/styles.css`: estilos.
- `static/app.js`: lógica interactiva y almacenamiento local del navegador.
- `requirements.txt` y `pyproject.toml`: dependencias y configuración Vercel.

## Credenciales de demostración

- Usuario: `demo`
- Contraseña: `demo1234`

## Publicar en Vercel

1. Reemplazá los archivos del repositorio por los de esta carpeta.
2. Confirmá que `pyproject.toml` y `app_code.py` estén en la raíz.
3. Confirmá que las carpetas se llamen exactamente `templates` y `static`.
4. Hacé commit en la rama `main`.
5. En Vercel, redeployá el proyecto.

## Importante sobre los datos

Los registros se guardan en `localStorage` del navegador de cada visitante. No se comparten entre visitantes ni dispositivos y no son una base de datos central. Si el visitante borra los datos del navegador o usa otro navegador/dispositivo, verá nuevamente los datos de ejemplo.

La autenticación de administrador es únicamente demostrativa. No usar estas credenciales ni este almacenamiento para información real o sensible.
