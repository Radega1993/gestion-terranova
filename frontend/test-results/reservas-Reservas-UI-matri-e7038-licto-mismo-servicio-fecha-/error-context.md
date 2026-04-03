# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reservas.spec.ts >> Reservas UI (matriz base) >> TRABAJADOR: crea LISTA_ESPERA (conflicto mismo servicio + fecha)
- Location: playwright/reservas.spec.ts:121:3

# Error details

```
Error: page.goto: Target page, context or browser has been closed
Call log:
  - navigating to "http://localhost:5173/reservas", waiting until "load"

```

```
Error: browserContext.close: Target page, context or browser has been closed
```