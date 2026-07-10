  async function cargarJSON(ruta) {
    const respuesta = await fetch(ruta);
    if (!respuesta.ok) throw new Error(`No se pudo cargar ${ruta}`);
    return respuesta.json(); // fetch ya hace el JSON.parse() del texto recibido
  }
  
  async function inicializarDatosSemilla() {
    try {
      if (localStorage.getItem(STORAGE_KEYS.CATEGORIAS) === null) {
        const categorias = await cargarJSON('assent/data/categorias.json');
        Storage.set(STORAGE_KEYS.CATEGORIAS, categorias); // aquí se hace JSON.stringify()
      }
      if (localStorage.getItem(STORAGE_KEYS.EVENTOS) === null) {
        const eventos = await cargarJSON('assent/data/eventos.json');
        Storage.set(STORAGE_KEYS.EVENTOS, eventos);
      }
      if (localStorage.getItem(STORAGE_KEYS.VENTAS) === null) {
        const ventas = await cargarJSON('assent/data/ventas.json'); // migración simulada (1-6 jul 2026)
        Storage.set(STORAGE_KEYS.VENTAS, ventas);
      }
    } catch (error) {
      // Si falla el fetch (por ejemplo al abrir el archivo directo con file://
      // sin servidor local), dejamos arrays vacíos para que la app no se rompa.
      console.error('Error cargando datos semilla desde JSON:', error);
      if (localStorage.getItem(STORAGE_KEYS.CATEGORIAS) === null) Storage.set(STORAGE_KEYS.CATEGORIAS, []);
      if (localStorage.getItem(STORAGE_KEYS.EVENTOS) === null) Storage.set(STORAGE_KEYS.EVENTOS, []);
      if (localStorage.getItem(STORAGE_KEYS.VENTAS) === null) Storage.set(STORAGE_KEYS.VENTAS, []);
    }
  
    if (localStorage.getItem(STORAGE_KEYS.CARRITO) === null) Storage.set(STORAGE_KEYS.CARRITO, []);
  }