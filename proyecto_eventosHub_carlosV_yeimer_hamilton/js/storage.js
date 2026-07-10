/* ============================================================
   TuEventoHub.com — storage.js
   Capa de persistencia sobre localStorage (JSON.stringify/parse)
   Claves: categorias, eventos, carrito, ventas, sesionAdmin
   ============================================================ */

const STORAGE_KEYS = {
  CATEGORIAS: 'categorias',
  EVENTOS: 'eventos',
  CARRITO: 'carrito',
  VENTAS: 'ventas',
  SESION_ADMIN: 'sesionAdmin',
};

const Storage = {
  get(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.error(`Error leyendo "${key}" de localStorage:`, error);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error guardando "${key}" en localStorage:`, error);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },
};
