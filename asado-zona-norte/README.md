# Asado Zona Norte

Comparador de precios por kilo de cortes para asado (asado, vacío, matambre, entraña, chorizo, morcilla, achuras, cerdo…) en supermercados con sucursales en Zona Norte, más carnicerías cargadas a mano.

## Cómo funciona

- `scraper/config.mjs`: supermercados (Carrefour, Jumbo, Disco, Vea, Día y ChangoMás, todos VTEX) y cortes, con sus términos de búsqueda y filtros.
- `scraper/scrape.mjs`: consulta la API pública de catálogo de cada súper, filtra lo que no es carne fresca, calcula el $/kg y escribe `site/data/precios.json` y `site/data/historial.json` (180 días). Si un súper falla, conserva sus últimos precios marcados como "precio anterior".
- `site/`: web estática (HTML/CSS/JS, sin build) con tabla comparativa, detalle por corte con evolución de precios y calculadora de asado.
- `.github/workflows/asado-zona-norte.yml`: corre el scraper todos los días, commitea los datos y publica en GitHub Pages.

## Correr localmente

```bash
node scraper/scrape.mjs        # Node 18+, sin dependencias
cd site && python3 -m http.server 8000   # abrir http://localhost:8000
```

Los datos que vienen en el repo son de demostración (la web lo avisa con un cartel) hasta la primera corrida del scraper.

## Publicar

1. En GitHub: Settings → Pages → Source: **GitHub Actions**.
2. Actions → "Asado Zona Norte - precios" → Run workflow.

## Cargar carnicerías

Editá `site/data/carnicerias.json` con los precios por kg (los ids de corte están en `config.mjs`):

```json
[
  {
    "nombre": "Carnicería Ejemplo",
    "localidad": "San Isidro",
    "fecha": "2026-11-20",
    "url": "https://instagram.com/...",
    "precios": { "asado": 14500, "vacio": 15900, "chorizo": 8900 }
  }
]
```
