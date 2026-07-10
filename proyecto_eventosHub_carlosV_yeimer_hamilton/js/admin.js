  /* ============================================================
    TuEventoHub.com — admin.js
    Login, guardia de sesión, router del panel y CRUD completo
    de categorías / eventos, además de listado de ventas.
    ============================================================ */

    const ADMIN_CREDENCIALES = { email: 'admin@mail.com', password: '123456' };

    const adminState = {
      categorias: [],
      eventos: [],
      ventas: [],
    };
    
    function refrescarDatos() {
      adminState.categorias = Storage.get(STORAGE_KEYS.CATEGORIAS, []);
      adminState.eventos = Storage.get(STORAGE_KEYS.EVENTOS, []);
      adminState.ventas = Storage.get(STORAGE_KEYS.VENTAS, []);
    }
    
    function formatearPrecio(valor) {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
    }
    function formatearFechaCorta(fechaISO) {
      const d = new Date(fechaISO);
      return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    function nombreCategoria(categoriaId) {
      const cat = adminState.categorias.find((c) => c.id === Number(categoriaId));
      return cat ? cat.nombre : 'Sin categoría';
    }
    function mostrarToast(mensaje, tipo = 'ok') {
      const toast = document.getElementById('toast');
      toast.textContent = mensaje;
      toast.className = `toast show ${tipo === 'error' ? 'error' : ''}`;
      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => toast.classList.remove('show'), 2400);
    }
    
    /* ============================================================
        LOGIN / SESIÓN
        ============================================================ */
    function haySesionActiva() {
      return Storage.get(STORAGE_KEYS.SESION_ADMIN, null) !== null;
    }
    
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error');
    
      if (email === ADMIN_CREDENCIALES.email && password === ADMIN_CREDENCIALES.password) {
        Storage.set(STORAGE_KEYS.SESION_ADMIN, { email, inicioSesion: new Date().toISOString() });
        errorEl.hidden = true;
        mostrarPanel();
        navegarAdmin('/dashboard');
      } else {
        errorEl.hidden = false;
      }
    });
    
    document.getElementById('btn-logout').addEventListener('click', () => {
      Storage.remove(STORAGE_KEYS.SESION_ADMIN);
      mostrarLogin();
    });
    
    function mostrarLogin() {
      document.getElementById('admin-login').hidden = false;
      document.getElementById('admin-shell').hidden = true;
    }
    function mostrarPanel() {
      document.getElementById('admin-login').hidden = true;
      document.getElementById('admin-shell').hidden = false;
    }
    
    /* ============================================================
        ROUTER DEL PANEL
        ============================================================ */
    const ADMIN_VISTAS = ['dashboard', 'eventos', 'categorias', 'ventas'];
    const TITULOS = { dashboard: 'Dashboard', eventos: 'Eventos', categorias: 'Categorías', ventas: 'Ventas' };
    
    function navegarAdmin(ruta) { window.location.hash = ruta; }
    
    function manejarRutaAdmin() {
      if (!haySesionActiva()) { mostrarLogin(); return; }
      mostrarPanel();
      refrescarDatos();
    
      const hash = window.location.hash.replace('#', '') || '/dashboard';
      const vista = ADMIN_VISTAS.includes(hash.replace('/', '')) ? hash.replace('/', '') : 'dashboard';
    
      ADMIN_VISTAS.forEach((v) => document.getElementById(`admin-view-${v}`).hidden = v !== vista);
      document.querySelectorAll('.nav-link[data-route]').forEach((a) => a.classList.toggle('active', a.dataset.route === `/${vista}`));
      document.getElementById('admin-page-title').textContent = TITULOS[vista];
    
      if (vista === 'dashboard') renderDashboard();
      if (vista === 'eventos') renderTablaEventos();
      if (vista === 'categorias') renderGridCategorias();
      if (vista === 'ventas') renderTablaVentas();
    }
    window.addEventListener('hashchange', manejarRutaAdmin);
    
    /* ============================================================
        DASHBOARD
        ============================================================ */
    function renderDashboard() {
      document.getElementById('stat-eventos').textContent = adminState.eventos.length;
      document.getElementById('stat-categorias').textContent = adminState.categorias.length;
      const totalVentas = adminState.ventas.reduce((acc, v) => acc + v.total, 0);
      document.getElementById('stat-ventas').textContent = formatearPrecio(totalVentas);
      document.getElementById('stat-pedidos').textContent = adminState.ventas.length;
    
      renderVentasChart();
    
      const recientes = [...adminState.eventos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);
      const list = document.getElementById('recent-eventos-list');
      list.innerHTML = recientes.length
        ? recientes.map((ev) => `
          <div class="recent-item">
            <div class="thumb"><img src="${ev.imagen}" alt="${ev.nombre}" /></div>
            <div class="info"><div class="name">${ev.nombre}</div><div class="date">${formatearFechaCorta(ev.fecha)}</div></div>
          </div>`).join('')
        : `<p style="color:var(--color-text-dim);font-size:var(--fs-sm);">Aún no hay eventos creados.</p>`;
    }
    
    function renderVentasChart() {
      const svg = document.getElementById('ventas-chart');
      const ultimas = [...adminState.ventas].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).slice(-7);
    
      if (ultimas.length < 2) {
        svg.innerHTML = `<text x="280" y="90" text-anchor="middle" fill="#a3a39e" font-size="13" font-family="Manrope">Aún no hay suficientes ventas para graficar</text>`;
        return;
      }
      const valores = ultimas.map((v) => v.total);
      const max = Math.max(...valores) || 1;
      const min = Math.min(...valores);
      const w = 560, h = 180, pad = 24;
      const stepX = (w - pad * 2) / (valores.length - 1);
      const puntos = valores.map((val, i) => {
        const x = pad + i * stepX;
        const y = h - pad - ((val - min) / (max - min || 1)) * (h - pad * 2);
        return [x, y];
      });
      const path = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
      const areaPath = `${path} L ${puntos[puntos.length - 1][0]} ${h - pad} L ${puntos[0][0]} ${h - pad} Z`;
    
      svg.innerHTML = `
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#141414" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#141414" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path d="${areaPath}" fill="url(#areaGrad)" />
        <path d="${path}" fill="none" stroke="#141414" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        ${puntos.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#141414" />`).join('')}
      `;
    }
    
    /* ============================================================
        MODALES GENÉRICOS
        ============================================================ */
    function abrirModal(html) {
      const root = document.getElementById('modal-root');
      root.innerHTML = `<div class="modal-overlay" id="modal-overlay"><div class="modal-box">${html}</div></div>`;
      document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') cerrarModal();
      });
    }
    function cerrarModal() { document.getElementById('modal-root').innerHTML = ''; }
    
    /* ============================================================
        CRUD: CATEGORÍAS
        ============================================================ */
    function renderGridCategorias() {
      const grid = document.getElementById('categorias-grid');
      const termino = (document.getElementById('categorias-search').value || '').toLowerCase();
      const filtradas = adminState.categorias.filter((c) => c.nombre.toLowerCase().includes(termino));
    
      grid.innerHTML = '';
      if (filtradas.length === 0) {
        grid.innerHTML = `<div class="empty-state"><h3>No hay categorías</h3><p>Crea la primera categoría para empezar.</p></div>`;
        return;
      }
      filtradas.forEach((cat) => {
        const total = adminState.eventos.filter((e) => e.categoriaId === cat.id).length;
        const el = document.createElement('categoria-card');
        el.setAttribute('data-id', cat.id);
        el.setAttribute('nombre', cat.nombre);
        el.setAttribute('descripcion', cat.descripcion);
        el.setAttribute('total', total);
        grid.appendChild(el);
      });
    }
    document.getElementById('categorias-search').addEventListener('input', renderGridCategorias);
    document.getElementById('btn-nueva-categoria').addEventListener('click', () => abrirFormCategoria());
    
    document.addEventListener('editar-categoria', (e) => {
      const cat = adminState.categorias.find((c) => c.id === Number(e.detail.categoriaId));
      if (cat) abrirFormCategoria(cat);
    });
    document.addEventListener('eliminar-categoria', (e) => {
      const id = Number(e.detail.categoriaId);
      const enUso = adminState.eventos.some((ev) => ev.categoriaId === id);
      if (enUso) { mostrarToast('No puedes eliminar una categoría con eventos asociados', 'error'); return; }
      if (!confirm('¿Eliminar esta categoría?')) return;
      const categorias = adminState.categorias.filter((c) => c.id !== id);
      Storage.set(STORAGE_KEYS.CATEGORIAS, categorias);
      refrescarDatos();
      renderGridCategorias();
      mostrarToast('Categoría eliminada');
    });
    
    function abrirFormCategoria(categoria = null) {
      const esEdicion = !!categoria;
      abrirModal(`
        <div class="modal-close" onclick="cerrarModal()">✕</div>
        <div class="modal-header"><h3>${esEdicion ? 'Editar categoría' : 'Nueva categoría'}</h3></div>
        <form id="form-categoria">
          <div class="form-group">
            <label for="cat-nombre">Nombre</label>
            <input type="text" id="cat-nombre" value="${categoria ? categoria.nombre : ''}" required />
          </div>
          <div class="form-group">
            <label for="cat-descripcion">Descripción</label>
            <textarea id="cat-descripcion" rows="3" required>${categoria ? categoria.descripcion : ''}</textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-block">${esEdicion ? 'Guardar cambios' : 'Crear categoría'}</button>
        </form>
      `);
      document.getElementById('form-categoria').addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('cat-nombre').value.trim();
        const descripcion = document.getElementById('cat-descripcion').value.trim();
        let categorias = adminState.categorias;
        if (esEdicion) {
          categorias = categorias.map((c) => c.id === categoria.id ? { ...c, nombre, descripcion } : c);
        } else {
          categorias.push({ id: Date.now(), nombre, descripcion });
        }
        Storage.set(STORAGE_KEYS.CATEGORIAS, categorias);
        refrescarDatos();
        cerrarModal();
        renderGridCategorias();
        mostrarToast(esEdicion ? 'Categoría actualizada' : 'Categoría creada');
      });
    }
    
    /* ============================================================
        CRUD: EVENTOS
        ============================================================ */
    function renderTablaEventos() {
      const tbody = document.getElementById('eventos-tbody');
      const termino = (document.getElementById('eventos-search').value || '').toLowerCase();
      const filtrados = adminState.eventos.filter((e) =>
        e.nombre.toLowerCase().includes(termino) || e.codigo.toLowerCase().includes(termino));
    
      if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><h3>No hay eventos</h3></div></td></tr>`;
        return;
      }
      tbody.innerHTML = filtrados.map((ev) => `
        <tr>
          <td>${ev.codigo}</td>
          <td><img class="row-thumb" src="${ev.imagen}" alt="${ev.nombre}" /></td>
          <td>${ev.nombre}</td>
          <td>${nombreCategoria(ev.categoriaId)}</td>
          <td>${ev.ciudad}</td>
          <td>${formatearFechaCorta(ev.fecha)}</td>
          <td>${formatearPrecio(ev.precio)}</td>
          <td class="actions">
            <button class="btn-icon" data-editar="${ev.id}" title="Editar">✏️</button>
            <button class="btn-icon" data-eliminar="${ev.id}" title="Eliminar">🗑️</button>
          </td>
        </tr>
      `).join('');
    
      tbody.querySelectorAll('[data-editar]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const ev = adminState.eventos.find((e) => e.id === Number(btn.dataset.editar));
          abrirFormEvento(ev);
        });
      });
      tbody.querySelectorAll('[data-eliminar]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (!confirm('¿Eliminar este evento?')) return;
          const eventos = adminState.eventos.filter((e) => e.id !== Number(btn.dataset.eliminar));
          Storage.set(STORAGE_KEYS.EVENTOS, eventos);
          refrescarDatos();
          renderTablaEventos();
          mostrarToast('Evento eliminado');
        });
      });
    }
    document.getElementById('eventos-search').addEventListener('input', renderTablaEventos);
    document.getElementById('btn-nuevo-evento').addEventListener('click', () => abrirFormEvento());
    
    function abrirFormEvento(evento = null) {
      const esEdicion = !!evento;
      const opcionesCategoria = adminState.categorias.map((c) =>
        `<option value="${c.id}" ${evento && evento.categoriaId === c.id ? 'selected' : ''}>${c.nombre}</option>`).join('');
    
      abrirModal(`
        <div class="modal-close" onclick="cerrarModal()">✕</div>
        <div class="modal-header"><h3>${esEdicion ? 'Editar evento' : 'Nuevo evento'}</h3></div>
        <form id="form-evento">
          <div class="form-row">
            <div class="form-group"><label for="ev-nombre">Nombre</label><input type="text" id="ev-nombre" value="${evento ? evento.nombre : ''}" required /></div>
            <div class="form-group"><label for="ev-categoria">Categoría</label><select id="ev-categoria" required>${opcionesCategoria}</select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label for="ev-fecha">Fecha</label><input type="date" id="ev-fecha" value="${evento ? evento.fecha : ''}" required /></div>
            <div class="form-group"><label for="ev-hora">Hora</label><input type="time" id="ev-hora" value="${evento ? evento.hora : ''}" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label for="ev-ciudad">Ciudad</label><input type="text" id="ev-ciudad" value="${evento ? evento.ciudad : ''}" required /></div>
            <div class="form-group"><label for="ev-precio">Precio (COP)</label><input type="number" id="ev-precio" min="0" step="1000" value="${evento ? evento.precio : ''}" required /></div>
          </div>
          <div class="form-group"><label for="ev-imagen">URL de imagen</label><input type="url" id="ev-imagen" value="${evento ? evento.imagen : ''}" required /></div>
          <div class="form-group"><label for="ev-descripcion">Descripción</label><textarea id="ev-descripcion" rows="3" required>${evento ? evento.descripcion : ''}</textarea></div>
          <button type="submit" class="btn btn-primary btn-block">${esEdicion ? 'Guardar cambios' : 'Crear evento'}</button>
        </form>
      `);
    
      document.getElementById('form-evento').addEventListener('submit', (e) => {
        e.preventDefault();
        const datos = {
          nombre: document.getElementById('ev-nombre').value.trim(),
          categoriaId: Number(document.getElementById('ev-categoria').value),
          fecha: document.getElementById('ev-fecha').value,
          hora: document.getElementById('ev-hora').value,
          ciudad: document.getElementById('ev-ciudad').value.trim(),
          precio: Number(document.getElementById('ev-precio').value),
          imagen: document.getElementById('ev-imagen').value.trim(),
          descripcion: document.getElementById('ev-descripcion').value.trim(),
        };
        let eventos = adminState.eventos;
        if (esEdicion) {
          eventos = eventos.map((ev) => ev.id === evento.id ? { ...ev, ...datos } : ev);
        } else {
          const nuevoId = Date.now();
          const numeroCodigo = String(eventos.length + 1).padStart(4, '0');
          eventos.push({ id: nuevoId, codigo: `EVT-${numeroCodigo}`, ...datos });
        }
        Storage.set(STORAGE_KEYS.EVENTOS, eventos);
        refrescarDatos();
        cerrarModal();
        renderTablaEventos();
        mostrarToast(esEdicion ? 'Evento actualizado' : 'Evento creado');
      });
    }
    
    /* ============================================================
        VENTAS (solo lectura + detalle)
        ============================================================ */
    function renderTablaVentas() {
      const tbody = document.getElementById('ventas-tbody');
      const termino = (document.getElementById('ventas-search').value || '').toLowerCase();
      const filtradas = [...adminState.ventas]
        .filter((v) => v.cliente.nombre.toLowerCase().includes(termino) || v.ciudad.toLowerCase().includes(termino))
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
      if (filtradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><h3>No hay ventas registradas</h3></div></td></tr>`;
        return;
      }
      tbody.innerHTML = filtradas.map((v) => `
        <tr>
          <td>#${v.id}</td>
          <td>${formatearFechaCorta(v.fecha)}</td>
          <td>${v.cliente.nombre}</td>
          <td>${v.ciudad}</td>
          <td>${v.items.reduce((a, i) => a + i.cantidad, 0)}</td>
          <td>${formatearPrecio(v.total)}</td>
          <td><button class="btn-sm btn-outline btn" data-detalle="${v.id}">Ver</button></td>
        </tr>
      `).join('');
    
      tbody.querySelectorAll('[data-detalle]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const venta = adminState.ventas.find((v) => v.id === Number(btn.dataset.detalle));
          abrirDetalleVenta(venta);
        });
      });
    }
    document.getElementById('ventas-search').addEventListener('input', renderTablaVentas);
    
    function abrirDetalleVenta(venta) {
      const itemsHtml = venta.items.map((item) => {
        const evento = adminState.eventos.find((e) => e.id === item.eventoId);
        const nombre = evento ? evento.nombre : 'Evento eliminado';
        const precio = evento ? evento.precio * item.cantidad : 0;
        return `<div class="venta-item-row"><span>${nombre} ${item.cantidad > 1 ? '×' + item.cantidad : ''}</span><span>${formatearPrecio(precio)}</span></div>`;
      }).join('');
    
      abrirModal(`
        <div class="modal-close" onclick="cerrarModal()">✕</div>
        <div class="modal-crumb">Pedido</div>
        <div class="modal-header"><h3>#${venta.id}</h3></div>
        <div class="venta-detail-grid">
          <div class="field"><div class="label">Cliente</div><div class="val">${venta.cliente.nombre}</div></div>
          <div class="field"><div class="label">Identificación</div><div class="val">${venta.cliente.identificacion}</div></div>
          <div class="field"><div class="label">Teléfono</div><div class="val">${venta.cliente.telefono}</div></div>
          <div class="field"><div class="label">Email</div><div class="val">${venta.cliente.email}</div></div>
          <div class="field"><div class="label">Dirección</div><div class="val">${venta.cliente.direccion}</div></div>
          <div class="field"><div class="label">Ciudad</div><div class="val">${venta.ciudad}</div></div>
        </div>
        <div class="venta-items">${itemsHtml}</div>
        <div class="summary-row total"><span>Total</span><span>${formatearPrecio(venta.total)}</span></div>
      `);
    }
    
    /* ============================================================
        Init
        ============================================================ */
    async function iniciarAdmin() {
      await inicializarDatosSemilla(); // fetch de los .json + JSON.stringify() a localStorage (solo primera vez)
      refrescarDatos();                 // JSON.parse() desde localStorage hacia adminState
      manejarRutaAdmin();
    }
    iniciarAdmin();