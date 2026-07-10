/* ============================================================
   TuEventoHub.com — filtradociudades.js
   Alimenta el <datalist> de ciudades desde assent/data/ciudades.json
   (todas las ciudades de Colombia, no solo las que tienen eventos)
   y expone normalizarTexto() para comparar sin tildes/mayúsculas.
   Se usa junto con main.js: el input#filter-ciudad llama a estas
   funciones para autocompletar y filtrar.
   ============================================================ */

let ciudadesColombiaCache = null;

/**
 * Carga assent/data/ciudades.json (una sola vez, con caché en memoria)
 * y llena el <datalist id="listaCiudades"> que alimenta el
 * input#filter-ciudad para autocompletar mientras se escribe.
 */
async function cargarCiudadesEnDatalist() {
  const datalist = document.getElementById('listaCiudades');
  if (!datalist) return;

  try {
    if (!ciudadesColombiaCache) {
      const respuesta = await fetch('assent/data/ciudades.json');
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      ciudadesColombiaCache = await respuesta.json(); // JSON.parse() vía fetch
    }
    datalist.innerHTML = ciudadesColombiaCache
      .map((ciudad) => `<option value="${ciudad}"></option>`)
      .join('');
  } catch (error) {
    console.error('Error cargando assent/data/ciudades.json:', error);
  }
}

/**
 * Normaliza texto para comparar sin importar tildes ni mayúsculas.
 * normalizarTexto("Bogotá") === normalizarTexto("bogota")
 */
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // quita acentos
}
