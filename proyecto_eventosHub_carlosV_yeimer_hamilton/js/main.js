  const ICONOS_CATEGORIA = {
    Conciertos: '🎵', Deportes: '🏅', Teatro: '🎭', 'Arte y Cultura': '🖼️',
    Gastronomía: '🍽️', Conferencias: '🎤', Fiestas: '🎉',
  };
  
  const state = {
    categorias: [],
    eventos: [],
    filtros: { categorias: [], ciudad: '', busqueda: '', precioMax: 200000 },
    pagina: 1,
    porPagina: 6,
    detalleActualId: null,
  };
  
  /* ---------- Utilidades ---------- */
  function formatearPrecio(valor) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
  }
  function formatearFechaLarga(fechaISO) {
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const [y, m, d] = fechaISO.split('-');
    return `${parseInt(d, 10)} de ${meses[parseInt(m, 10) - 1]} de ${y}`;
  }
  function nombreCategoria(categoriaId) {
    const cat = state.categorias.find((c) => c.id === Number(categoriaId));
    return cat ? cat.nombre : 'Sin categoría';
  }
  function mostrarToast(mensaje, tipo = 'ok') {
    const toast = document.getElementById('toast');
    toast.textContent = mensaje;
    toast.className = `toast show ${tipo === 'error' ? 'error' : ''}`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2400);
  }
  
  /* ---------- Carrito ---------- */
  function getCarrito() { return Storage.get(STORAGE_KEYS.CARRITO, []); }
  function setCarrito(carrito) { Storage.set(STORAGE_KEYS.CARRITO, carrito); actualizarContadorCarrito(); }
  
  function agregarAlCarrito(eventoId) {
    const carrito = getCarrito();
    const existente = carrito.find((it) => it.eventoId === Number(eventoId));
    if (existente) {
      existente.cantidad += 1;
    } else {
      carrito.push({ eventoId: Number(eventoId), cantidad: 1 });
    }
    setCarrito(carrito);
    mostrarToast('Evento agregado al carrito 🎟️');
  }
  
  function quitarDelCarrito(eventoId) {
    const carrito = getCarrito().filter((it) => it.eventoId !== Number(eventoId));
    setCarrito(carrito);
    renderCarrito();
    mostrarToast('Evento eliminado del carrito');
  }
  
  function actualizarContadorCarrito() {
    const carrito = getCarrito();
    const total = carrito.reduce((acc, it) => acc + it.cantidad, 0);
    const badge = document.getElementById('cart-count');
    badge.textContent = total;
    badge.hidden = total === 0;
  }
  
  function calcularTotalCarrito(carrito) {
    return carrito.reduce((acc, item) => {
      const evento = state.eventos.find((e) => e.id === item.eventoId);
      return acc + (evento ? evento.precio * item.cantidad : 0);
    }, 0);
  }
  
  /* ---------- Router ---------- */
  const VISTAS = ['home', 'eventos', 'detalle', 'carrito', 'compra', 'confirmacion'];
  
  function navegar(ruta) {
    window.location.hash = ruta;
  }
  
  function manejarRuta() {
    const hash = window.location.hash.replace('#', '') || '/';
    VISTAS.forEach((v) => document.getElementById(`view-${v}`).hidden = true);
    document.querySelectorAll('.main-nav a').forEach((a) => a.classList.remove('active'));
  
    if (hash === '/' || hash === '') {
      mostrarVista('home');
      document.querySelector('.main-nav a[data-route="/"]').classList.add('active');
      renderHome();
    } else if (hash === '/eventos') {
      mostrarVista('eventos');
      document.querySelector('.main-nav a[data-route="/eventos"]').classList.add('active');
      renderFiltros();
      renderEventos();
    } else if (hash.startsWith('/evento/')) {
      const id = hash.split('/')[2];
      state.detalleActualId = Number(id);
      mostrarVista('detalle');
      renderDetalle(Number(id));
    } else if (hash === '/carrito') {
      mostrarVista('carrito');
      renderCarrito();
    } else if (hash === '/compra') {
      mostrarVista('compra');
      renderCheckoutResumen();
    } else if (hash === '/confirmacion') {
      mostrarVista('confirmacion');
    } else {
      navegar('/');
    }
    window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
  }
  
  function mostrarVista(nombre) {
    document.getElementById(`view-${nombre}`).hidden = false;
  }
  
  window.addEventListener('hashchange', manejarRuta);
  
  /* ---------- Render: HOME ---------- */
  function renderHome() {
    const grid = document.getElementById('home-categorias-grid');
    grid.innerHTML = state.categorias.map((cat) => `
      <button class="categoria-pill" data-cat-id="${cat.id}" type="button">
        <span class="icon">${ICONOS_CATEGORIA[cat.nombre] || '🎫'}</span>
        <span>${cat.nombre}</span>
      </button>
    `).join('');
    grid.querySelectorAll('.categoria-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.filtros.categorias = [Number(btn.dataset.catId)];
        navegar('/eventos');
      });
    });
  
    const destacados = [...state.eventos]
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(0, 4);
    const destGrid = document.getElementById('home-destacados-grid');
    destGrid.innerHTML = '';
    destacados.forEach((ev) => destGrid.appendChild(crearEventoCardEl(ev)));
  }
  
  document.getElementById('home-search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.filtros.busqueda = document.getElementById('home-search-input').value.trim();
    navegar('/eventos');
  });
  
  document.getElementById('newsletter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    e.target.reset();
    mostrarToast('¡Gracias por suscribirte! ✉️');
  });
  
  /* ---------- Render: helper de tarjeta de evento (Web Component) ---------- */
  function crearEventoCardEl(evento) {
    const el = document.createElement('evento-card');
    el.setAttribute('data-id', evento.id);
    el.setAttribute('nombre', evento.nombre);
    el.setAttribute('categoria', nombreCategoria(evento.categoriaId));
    el.setAttribute('ciudad', evento.ciudad);
    el.setAttribute('fecha', evento.fecha);
    el.setAttribute('hora', evento.hora);
    el.setAttribute('precio', evento.precio);
    el.setAttribute('imagen', evento.imagen);
    return el;
  }
  
  document.getElementById('app-root').addEventListener('agregar-carrito', (e) => {
    agregarAlCarrito(e.detail.eventoId);
  });
  document.getElementById('app-root').addEventListener('ver-detalle', (e) => {
    navegar(`/evento/${e.detail.eventoId}`);
  });
  
  /* ---------- Render: EVENTOS (filtros + grid + paginación) ---------- */
  function renderFiltros() {
    const wrap = document.getElementById('filter-categorias');
    wrap.innerHTML = state.categorias.map((cat) => `
      <label class="filter-check">
        <input type="checkbox" value="${cat.id}" ${state.filtros.categorias.includes(cat.id) ? 'checked' : ''} />
        ${cat.nombre}
      </label>
    `).join('');
    wrap.querySelectorAll('input').forEach((input) => {
      input.addEventListener('change', () => {
        const val = Number(input.value);
        state.filtros.categorias = input.checked
          ? [...state.filtros.categorias, val]
          : state.filtros.categorias.filter((c) => c !== val);
        state.pagina = 1;
        renderEventos();
      });
    });
  
    const inputCiudad = document.getElementById('filter-ciudad');
    cargarCiudadesEnDatalist(); // desde filtradociudades.js -> assent/data/ciudades.json
    inputCiudad.value = state.filtros.ciudad;
    inputCiudad.oninput = () => {
      state.filtros.ciudad = inputCiudad.value.trim();
      state.pagina = 1;
      renderEventos();
    };
  
    const inputBusqueda = document.getElementById('filter-busqueda');
    inputBusqueda.value = state.filtros.busqueda;
    inputBusqueda.oninput = () => { state.filtros.busqueda = inputBusqueda.value; state.pagina = 1; renderEventos(); };
  
    const inputPrecio = document.getElementById('filter-precio');
    inputPrecio.value = state.filtros.precioMax;
    document.getElementById('filter-precio-label').textContent = state.filtros.precioMax >= 200000
      ? '$200.000+' : formatearPrecio(state.filtros.precioMax);
    inputPrecio.oninput = () => {
      state.filtros.precioMax = Number(inputPrecio.value);
      document.getElementById('filter-precio-label').textContent = state.filtros.precioMax >= 200000
        ? '$200.000+' : formatearPrecio(state.filtros.precioMax);
      state.pagina = 1;
      renderEventos();
    };
  
    document.getElementById('clear-filters').onclick = () => {
      state.filtros = { categorias: [], ciudad: '', busqueda: '', precioMax: 200000 };
      state.pagina = 1;
      renderFiltros();
      renderEventos();
    };
  }
  
  function obtenerEventosFiltrados() {
    return state.eventos.filter((ev) => {
      const pasaCategoria = state.filtros.categorias.length === 0 || state.filtros.categorias.includes(ev.categoriaId);
      const pasaCiudad = !state.filtros.ciudad
        || normalizarTexto(ev.ciudad).includes(normalizarTexto(state.filtros.ciudad));
      const pasaBusqueda = !state.filtros.busqueda || ev.nombre.toLowerCase().includes(state.filtros.busqueda.toLowerCase());
      const pasaPrecio = ev.precio <= state.filtros.precioMax;
      return pasaCategoria && pasaCiudad && pasaBusqueda && pasaPrecio;
    }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }
  
  function renderEventos() {
    const filtrados = obtenerEventosFiltrados();
    document.getElementById('results-count-num').textContent = filtrados.length;
  
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / state.porPagina));
    if (state.pagina > totalPaginas) state.pagina = totalPaginas;
    const inicio = (state.pagina - 1) * state.porPagina;
    const pagina = filtrados.slice(inicio, inicio + state.porPagina);
  
    const grid = document.getElementById('eventos-grid');
    grid.innerHTML = '';
    if (pagina.length === 0) {
      grid.innerHTML = `<div class="empty-state"><h3>No encontramos eventos</h3><p>Prueba ajustando los filtros de búsqueda.</p></div>`;
    } else {
      pagina.forEach((ev) => grid.appendChild(crearEventoCardEl(ev)));
    }
  
    const pag = document.getElementById('eventos-pagination');
    pag.innerHTML = '';
    for (let i = 1; i <= totalPaginas; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === state.pagina ? 'active' : '';
      btn.addEventListener('click', () => { state.pagina = i; renderEventos(); window.scrollTo({ top: 0 }); });
      pag.appendChild(btn);
    }
  }
  
  /* ---------- Render: DETALLE ---------- */
  function renderDetalle(id) {
    const evento = state.eventos.find((e) => e.id === id);
    const cont = document.getElementById('detalle-content');
    if (!evento) {
      cont.innerHTML = `<div class="empty-state"><h3>Evento no encontrado</h3></div>`;
      return;
    }
    document.getElementById('detalle-breadcrumb').textContent = evento.nombre;
    cont.innerHTML = `
      <div class="detalle-image"><img src="${evento.imagen}" alt="${evento.nombre}" /></div>
      <div class="detalle-info">
        <span class="badge badge-muted categoria-tag">${nombreCategoria(evento.categoriaId)}</span>
        <h1>${evento.nombre}</h1>
        <div class="detalle-meta">
          <div class="row">📍 ${evento.ciudad}, Colombia</div>
          <div class="row">📅 ${formatearFechaLarga(evento.fecha)} · ⏰ ${evento.hora}</div>
          <div class="row">🔖 Código: ${evento.codigo}</div>
        </div>
        <div class="detalle-price">${formatearPrecio(evento.precio)}</div>
        <p class="detalle-desc">${evento.descripcion}</p>
        <div class="detalle-actions">
          <button class="btn btn-outline" id="btn-detalle-volver">← Volver</button>
          <button class="btn btn-primary" id="btn-detalle-agregar">Agregar al carrito</button>
        </div>
      </div>
    `;
    document.getElementById('btn-detalle-volver').addEventListener('click', () => history.back());
    document.getElementById('btn-detalle-agregar').addEventListener('click', () => agregarAlCarrito(evento.id));
  }
  
  /* ---------- Render: CARRITO ---------- */
  function renderCarrito() {
    const carrito = getCarrito();
    const cont = document.getElementById('carrito-items');
    cont.innerHTML = '';
  
    if (carrito.length === 0) {
      cont.innerHTML = `<div class="empty-state"><h3>Tu carrito está vacío</h3><p>Explora eventos y agrégalos aquí.</p><br/><a href="#/eventos" class="btn btn-primary">Explorar eventos</a></div>`;
    } else {
      carrito.forEach((item) => {
        const evento = state.eventos.find((e) => e.id === item.eventoId);
        if (!evento) return;
        const el = document.createElement('carrito-item');
        el.setAttribute('data-id', evento.id);
        el.setAttribute('nombre', `${evento.nombre}${item.cantidad > 1 ? ' × ' + item.cantidad : ''}`);
        el.setAttribute('categoria', nombreCategoria(evento.categoriaId));
        el.setAttribute('precio', evento.precio * item.cantidad);
        el.setAttribute('imagen', evento.imagen);
        cont.appendChild(el);
      });
    }
  
    document.getElementById('carrito-cant').textContent = carrito.reduce((a, i) => a + i.cantidad, 0);
    document.getElementById('carrito-total').textContent = formatearPrecio(calcularTotalCarrito(carrito));
    document.getElementById('btn-ir-compra').disabled = carrito.length === 0;
  }
  
  document.getElementById('app-root').addEventListener('quitar-item', (e) => quitarDelCarrito(e.detail.eventoId));
  
  document.getElementById('btn-ir-compra').addEventListener('click', () => {
    if (getCarrito().length === 0) return;
    navegar('/compra');
  });
  
  /* ---------- Render: CHECKOUT ---------- */
  function renderCheckoutResumen() {
    const carrito = getCarrito();
    if (carrito.length === 0) { navegar('/carrito'); return; }
    const cont = document.getElementById('checkout-resumen-items');
    cont.innerHTML = carrito.map((item) => {
      const evento = state.eventos.find((e) => e.id === item.eventoId);
      if (!evento) return '';
      return `<div class="summary-row"><span>${evento.nombre}${item.cantidad > 1 ? ' ×' + item.cantidad : ''}</span><span>${formatearPrecio(evento.precio * item.cantidad)}</span></div>`;
    }).join('');
    document.getElementById('checkout-total').textContent = formatearPrecio(calcularTotalCarrito(carrito));
  }
  
  document.getElementById('checkout-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const carrito = getCarrito();
    if (carrito.length === 0) return;
  
    const venta = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      cliente: {
        identificacion: document.getElementById('c-identificacion').value.trim(),
        nombre: document.getElementById('c-nombre').value.trim(),
        direccion: document.getElementById('c-direccion').value.trim(),
        telefono: document.getElementById('c-telefono').value.trim(),
        email: document.getElementById('c-email').value.trim(),
      },
      ciudad: document.getElementById('c-ciudad').value.trim(),
      items: carrito,
      total: calcularTotalCarrito(carrito),
    };
  
    const ventas = Storage.get(STORAGE_KEYS.VENTAS, []);
    ventas.push(venta);
    Storage.set(STORAGE_KEYS.VENTAS, ventas);
    setCarrito([]);
  
    document.getElementById('confirmacion-id').textContent = `#${venta.id}`;
    e.target.reset();
    navegar('/confirmacion');
  });
  
  /* ---------- Init ---------- */
  async function iniciarApp() {
    await inicializarDatosSemilla();                    // fetch + JSON.stringify() a localStorage
    state.categorias = Storage.get(STORAGE_KEYS.CATEGORIAS, []); // JSON.parse() desde localStorage
    state.eventos = Storage.get(STORAGE_KEYS.EVENTOS, []);
    actualizarContadorCarrito();
    manejarRuta();
  }
  iniciarApp();