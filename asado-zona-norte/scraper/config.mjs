// Supermercados con sucursales en Zona Norte que usan VTEX (API pública de catálogo).
// `sc` = sales channel (opcional). Si un súper tiene precios distintos por canal, se puede fijar acá.
export const STORES = [
  { id: 'carrefour', name: 'Carrefour', base: 'https://www.carrefour.com.ar' },
  { id: 'jumbo', name: 'Jumbo', base: 'https://www.jumbo.com.ar' },
  { id: 'disco', name: 'Disco', base: 'https://www.disco.com.ar' },
  { id: 'vea', name: 'Vea', base: 'https://www.vea.com.ar' },
  { id: 'dia', name: 'Día', base: 'https://diaonline.supermercadosdia.com.ar' },
  { id: 'changomas', name: 'ChangoMás', base: 'https://www.masonline.com.ar' },
];

// Palabras que descartan productos que no son carne fresca.
const NO_CARNE =
  'condimento|carb[oó]n|le[nñ]a|salsa|chimichurri|tabla|cuchillo|parrilla de|pinza|caldo|sopa|pure|snack|perro|gato|alimento|empanada|pizza|rebozad|apanad|milanesa|hamburguesa|medallon|congelad|enlatad|pate|picadillo|sabor';

// Cada corte: términos de búsqueda, regex que el nombre debe cumplir y regex de exclusión.
export const CUTS = [
  { id: 'asado', name: 'Asado / tira', group: 'Vacuno', search: ['asado', 'tira de asado'], match: 'asado|tira', exclude: 'tapa de asado|cerdo|pollo|kit|para asado' },
  { id: 'vacio', name: 'Vacío', group: 'Vacuno', search: ['vacio'], match: 'vacio', exclude: 'cerdo|al vacio|envasad[oa] al' },
  { id: 'matambre', name: 'Matambre vacuno', group: 'Vacuno', search: ['matambre'], match: 'matambre', exclude: 'cerdo|pollo|arrollad|relleno|cocid' },
  { id: 'entrana', name: 'Entraña', group: 'Vacuno', search: ['entraña', 'entrana'], match: 'entra[nñ]a', exclude: 'cerdo' },
  { id: 'colita', name: 'Colita de cuadril', group: 'Vacuno', search: ['colita de cuadril'], match: 'colita', exclude: 'cerdo' },
  { id: 'tapa_asado', name: 'Tapa de asado', group: 'Vacuno', search: ['tapa de asado'], match: 'tapa de asado', exclude: 'cerdo' },
  { id: 'bife_chorizo', name: 'Bife de chorizo', group: 'Vacuno', search: ['bife de chorizo'], match: 'bife de chorizo', exclude: 'cerdo' },
  { id: 'ojo_bife', name: 'Ojo de bife', group: 'Vacuno', search: ['ojo de bife'], match: 'ojo de bife', exclude: 'cerdo' },
  { id: 'chorizo', name: 'Chorizo parrillero', group: 'Achuras y embutidos', search: ['chorizo parrillero', 'chorizo'], match: 'chorizo', exclude: 'bife|colorado|seco|cantimpalo|espa[nñ]ol|copetin|riojano' },
  { id: 'morcilla', name: 'Morcilla', group: 'Achuras y embutidos', search: ['morcilla'], match: 'morcilla', exclude: 'vegana' },
  { id: 'molleja', name: 'Molleja', group: 'Achuras y embutidos', search: ['molleja'], match: 'molleja', exclude: 'pollo' },
  { id: 'chinchulin', name: 'Chinchulín', group: 'Achuras y embutidos', search: ['chinchulin'], match: 'chinchul', exclude: '' },
  { id: 'matambre_cerdo', name: 'Matambre de cerdo', group: 'Cerdo', search: ['matambre de cerdo'], match: 'matambre.*cerdo|cerdo.*matambre', exclude: 'arrollad|relleno|cocid' },
  { id: 'bondiola', name: 'Bondiola', group: 'Cerdo', search: ['bondiola'], match: 'bondiola', exclude: 'feteada|cocida|curada|ahumada' },
  { id: 'pechito', name: 'Pechito de cerdo', group: 'Cerdo', search: ['pechito de cerdo'], match: 'pechito', exclude: '' },
].map((c) => ({ ...c, noCarne: NO_CARNE }));
