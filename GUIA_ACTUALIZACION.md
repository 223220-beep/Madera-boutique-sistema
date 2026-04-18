# Guía de Actualización del Sistema (Cerebro) 🧠

Esta guía te ayudará a bajar todas las mejoras que hicimos hoy (Caja, Productos, Abonos, etc.) a tu computadora principal sin poner en riesgo tus notas actuales.

### ⚠️ Regla de Oro
Tus notas se guardan en el archivo `data/negocio.db`. Este archivo **está protegido** y Git nunca lo tocará ni lo borrará al actualizar el código.

---

### Pasos para Actualizar:

1. **Cerrar el sistema:**
   Si tienes las ventanas negras abiertas, ciérralas primero.

2. **Abrir la terminal:**
   - Ve a la carpeta de `Notas para negocio MDF`.
   - Haz clic derecho en un espacio blanco y selecciona **"Abrir en Terminal"** o **"Open in Terminal"** (o usa PowerShell).

3. **Descargar las mejoras:**
   Escribe el siguiente comando y presiona Enter:
   ```powershell
   git pull origin main
   ```
   *Esto bajará la Caja y todas las funciones nuevas.*

4. **Instalar nuevas librerías (Solo si es necesario):**
   Escribe esto para asegurar que todo funcione bien con los nuevos cambios:
   ```powershell
   npm install
   ```

5. **Iniciar el sistema:**
   Haz doble clic en tu archivo de siempre:
   `iniciar_sistema.bat`

---

### ¿Cómo saber si funcionó?
- Al abrirse el navegador, deberías ver el nuevo botón verde de **"Caja"** con el icono de billetera (💰).
- Verás tus horarios en color negro en la parte superior.
- Tus notas de siempre deberían seguir ahí intactas.

### ¿Qué hacer si algo falla?
Si por alguna razón ves un mensaje de error rojo al hacer el `git pull`, lo más probable es que se haya intentado modificar un archivo localmente en esa compu. Escribe esto para limpiar y forzar la actualización:
```powershell
git reset --hard origin/main
```
*(No te preocupes, este comando tampoco borra la base de datos `negocio.db` porque está en la lista de ignorados).*
