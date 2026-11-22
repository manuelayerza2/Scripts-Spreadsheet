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

// Carnicerías con tienda online. El scraper lee su sitemap y los datos estructurados (JSON-LD)
// de cada producto, así que sirve para Tiendanube, WooCommerce y la mayoría de las plataformas.
// `porKg: true` = la tienda publica precios por kg aunque el nombre no lo diga.
// `zona` = cobertura de envío confirmada; null = falta confirmar que llegue a Zona Norte.
export const CARNICERIAS_ONLINE = [
  { id: 'cabana_juramento', name: 'Cabaña Juramento', base: 'https://cabanajuramento.com.ar', zona: 'San Isidro (Av. Diego Carman 55)' },
  { id: 'biffe', name: 'Biffe', base: 'https://biffecarnespremium.com', zona: 'Tigre (Remeros Plaza) y Pilar' },
  { id: 'don_vicente', name: 'Don Vicente', base: 'https://www.donvicentegourmet.com', zona: 'Pilar (La Lonja)' },
  { id: 'alimento_americano', name: 'Alimento Americano', base: 'https://alimentoamericano.com', zona: 'Tigre / Nordelta', porKg: true },
  { id: 'pampa_novillo', name: 'Pampa y Novillo', base: 'https://www.pampaynovillo.com.ar', zona: null },
  { id: 'curaco', name: 'Carnes Curaco', base: 'https://carnescuraco.com', zona: null },
  { id: 'focal', name: 'Focal', base: 'https://premiumcarnes.mitiendanube.com', zona: null },
  { id: 'the_butcher', name: 'The Butcher', base: 'https://thebutchercarnes.com', zona: null },
  { id: 'de_pastura', name: 'De Pastura', base: 'https://tienda.depastura.com.ar', zona: null },
  { id: 'el_frigorifico', name: 'El Frigorífico', base: 'https://www.elfrigorifico.com', zona: null },
];

// Palabras que descartan productos que no son carne fresca.
const NO_CARNE =
  'condimento|carb[oó]n|le[nñ]a|salsa|chimichurri|tabla|cuchillo|parrilla de|pinza|caldo|sopa|pure|snack|perro|gato|alimento|empanada|pizza|rebozad|apanad|milanesa|hamburguesa|medallon|congelad|enlatad|pate|picadillo|sabor';

// Cada corte: términos de búsqueda, regex que el nombre debe cumplir y regex de exclusión.
export const CUTS = [
  { id: 'asado', name: 'Asado / tira', group: 'Vacuno', search: ['asado', 'tira de asado'], match: 'asado|tira', exclude: 'tapa de asado|cerdo|pollo|kit|para asado|banderita|americano|short rib' },
  { id: 'vacio', name: 'Vacío', group: 'Vacuno', search: ['vacio'], match: 'vacio', exclude: 'cerdo|al vacio|envasad[oa] al|medialuna|bife de vacio' },
  { id: 'matambre', name: 'Matambre vacuno', group: 'Vacuno', search: ['matambre'], match: 'matambre', exclude: 'cerdo|pollo|arrollad|relleno|cocid' },
  { id: 'entrana', name: 'Entraña', group: 'Vacuno', search: ['entraña', 'entrana'], match: 'entra[nñ]a', exclude: 'cerdo' },
  { id: 'colita', name: 'Colita de cuadril', group: 'Vacuno', search: ['colita de cuadril'], match: 'colita', exclude: 'cerdo' },
  { id: 'tapa_asado', name: 'Tapa de asado', group: 'Vacuno', search: ['tapa de asado'], match: 'tapa de asado', exclude: 'cerdo' },
  { id: 'bife_chorizo', name: 'Bife de chorizo', group: 'Vacuno', search: ['bife de chorizo'], match: 'bife de chorizo', exclude: 'cerdo' },
  { id: 'ojo_bife', name: 'Ojo de bife', group: 'Vacuno', search: ['ojo de bife'], match: 'ojo de bife', exclude: 'cerdo|ceja|con hueso|tomahawk' },
  // Cortes boutique (típicos de carnicerías premium; en súper aparecen poco).
  { id: 'banderita', name: 'Asado banderita', group: 'Boutique', search: ['asado banderita'], match: 'banderita', exclude: 'cerdo' },
  { id: 'ceja', name: 'Ceja de ojo de bife', group: 'Boutique', search: ['ceja de ojo de bife'], match: 'ceja', exclude: 'cerdo' },
  { id: 'medialuna_vacio', name: 'Medialuna de vacío', group: 'Boutique', search: ['medialuna de vacio'], match: 'medialuna.*vacio|vacio.*medialuna', exclude: '' },
  { id: 'bife_vacio', name: 'Bife de vacío', group: 'Boutique', search: ['bife de vacio'], match: 'bife de vacio', exclude: '' },
  { id: 'tomahawk', name: 'Tomahawk', group: 'Boutique', search: ['tomahawk'], match: 'tomahawk', exclude: 'cerdo' },
  { id: 'bife_ancho', name: 'Bife ancho / ojo con hueso', group: 'Boutique', search: ['bife ancho', 'ojo de bife con hueso'], match: 'bife ancho|ojo de bife con hueso|prime rib|cowboy', exclude: 'cerdo' },
  { id: 'picana', name: 'Picaña / tapa de cuadril', group: 'Boutique', search: ['picaña', 'tapa de cuadril'], match: 'pica[nñ]a|picanha|tapa de cuadril', exclude: 'cerdo' },
  { id: 'aranita', name: 'Arañita', group: 'Boutique', search: ['arañita'], match: 'ara[nñ]ita', exclude: '' },
  { id: 'tbone', name: 'T-bone', group: 'Boutique', search: ['t-bone', 'tbone'], match: 't.?bone', exclude: '' },
  { id: 'flat_iron', name: 'Flat iron / marucha', group: 'Boutique', search: ['flat iron', 'marucha'], match: 'flat iron|marucha', exclude: '' },
  { id: 'short_rib', name: 'Short rib / asado americano', group: 'Boutique', search: ['short rib', 'asado americano'], match: 'short rib|asado americano|costillar americano', exclude: 'cerdo' },
  { id: 'molleja_corazon', name: 'Molleja de corazón', group: 'Boutique', search: ['molleja de corazon'], match: 'molleja.*corazon|corazon.*molleja', exclude: 'pollo' },
  { id: 'chorizo_copetin', name: 'Chorizo copetín', group: 'Boutique', search: ['chorizo copetin', 'choricitos'], match: 'chorizo.*copetin|copetin.*chorizo|choricito', exclude: 'seco|colorado|cantimpalo' },
  { id: 'chorizo', name: 'Chorizo parrillero', group: 'Achuras y embutidos', search: ['chorizo parrillero', 'chorizo'], match: 'chorizo', exclude: 'bife|colorado|seco|cantimpalo|espa[nñ]ol|copetin|riojano' },
  { id: 'morcilla', name: 'Morcilla', group: 'Achuras y embutidos', search: ['morcilla'], match: 'morcilla', exclude: 'vegana' },
  { id: 'molleja', name: 'Molleja', group: 'Achuras y embutidos', search: ['molleja'], match: 'molleja', exclude: 'pollo|corazon' },
  { id: 'chinchulin', name: 'Chinchulín', group: 'Achuras y embutidos', search: ['chinchulin'], match: 'chinchul', exclude: '' },
  { id: 'matambre_cerdo', name: 'Matambre de cerdo', group: 'Cerdo', search: ['matambre de cerdo'], match: 'matambre.*cerdo|cerdo.*matambre', exclude: 'arrollad|relleno|cocid' },
  { id: 'bondiola', name: 'Bondiola', group: 'Cerdo', search: ['bondiola'], match: 'bondiola', exclude: 'feteada|cocida|curada|ahumada' },
  { id: 'pechito', name: 'Pechito de cerdo', group: 'Cerdo', search: ['pechito de cerdo'], match: 'pechito', exclude: '' },
].map((c) => ({ ...c, noCarne: NO_CARNE }));
