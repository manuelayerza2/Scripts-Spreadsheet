# Asado Zona Norte

Comparador de precios por kilo de cortes para asado (asado, vacío, matambre, entraña, chorizo, morcilla, achuras, cerdo y cortes boutique como banderita, ceja, medialuna de vacío, tomahawk o picaña) en supermercados y carnicerías de Zona Norte.

## Cómo funciona

- `scraper/config.mjs`: supermercados (Carrefour, Jumbo, Disco, Vea, Día y ChangoMás, todos VTEX), carnicerías con tienda online y cortes, con sus términos de búsqueda y filtros.
- Las carnicerías online se leen desde su `sitemap.xml` y los datos estructurados (JSON-LD) de cada producto, así que funciona con Tiendanube, WooCommerce y casi cualquier plataforma. Para sumar una, agregala a `CARNICERIAS_ONLINE`.
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

## Cargar carnicerías sin tienda online

Editá `site/data/carnicerias.json`. Cada precio es el $/kg o un objeto con nombre y nota (los ids de corte están en `config.mjs`). Las carnicerías sin `precios` aparecen en un directorio aparte.

```json
[
  {
    "nombre": "Carnicería Ejemplo",
    "localidad": "San Isidro",
    "fecha": "2026-11-20",
    "url": "https://instagram.com/...",
    "precios": {
      "asado": 14500,
      "chorizo_copetin": { "porKg": 22489, "nombre": "Chorizo copetín", "nota": "$8.996 el paquete de ~0,4 kg" }
    }
  }
]
```
