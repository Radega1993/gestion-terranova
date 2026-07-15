# Migraciones de base de datos

Este archivo documenta los scripts de migración que pueden ser necesarios tras actualizar Gestión Terranova.

El script `update-app.ps1` **no ejecuta migraciones por defecto**. Si una versión lo requiere, revíselo aquí y ejecútelo manualmente o con:

```powershell
powershell -ExecutionPolicy Bypass -File update-app.ps1 -RunMigrations
```

Cada entrada debe seguir este formato:

```markdown
## vX.Y.Z
- Comando: npm run nombre-script
- Cuándo: descripción de cuándo aplicar la migración
```

---

## v1.0.0

No hay migraciones obligatorias para instalaciones nuevas.

---

## Scripts históricos (solo si vienes de versiones antiguas)

### Normalización de importes en ventas

- Comando: npm run migrate:ventas-money
- Cuándo: solo si la base de datos tiene ventas con importes inconsistentes (centavos vs euros) de versiones anteriores a 2026.

Para simular sin cambios:

```bash
cd backend
npm run migrate:ventas-money:dry
```

### Campo `active` en socios

- Comando: npx ts-node -r tsconfig-paths/register src/scripts/migrate-active-field.ts
- Cuándo: solo si existen socios con campos `activo` / `isActive` sin el campo unificado `active`.

### Campo `active` en múltiples colecciones

- Comando: npx ts-node -r tsconfig-paths/register src/scripts/migrate-active-fields.ts
- Cuándo: solo si varias colecciones aún no tienen el campo `active` normalizado.

---

## Plantilla para nuevas versiones

Copie y complete al publicar una actualización que requiera cambios en MongoDB:

```markdown
## v1.1.0
- Comando: npm run migrate:ejemplo
- Cuándo: describir instalaciones afectadas y cómo comprobar si aplica
```
