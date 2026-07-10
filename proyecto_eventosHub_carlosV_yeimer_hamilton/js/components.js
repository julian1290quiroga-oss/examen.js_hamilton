  /* ============================================================
    TuEventoHub.com — components.js
    Web Components reutilizables (Shadow DOM)
    ============================================================ */

    const CSS_VARS_LINK = `
    <style>
      :host { all: initial; font-family: 'Manrope', 'Segoe UI', sans-serif; }
      * { box-sizing: border-box; }
      a, button { cursor: pointer; font-family: inherit; }
    </style>
  `;
  
  function formatearPrecio(valor) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
  }
  
  function formatearFechaCorta(fechaISO) {
    const [anio, mes, dia] = fechaISO.split('-');
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return { dia, mes: meses[parseInt(mes, 10) - 1] };
  }
  
  /* ============================================================
      <evento-card>
      Atributos: id, codigo, nombre, categoria, ciudad, fecha, hora, precio, imagen
      Emite: 'agregar-carrito' (detail: { eventoId }) y 'ver-detalle' (detail: { eventoId })
      ============================================================ */
  class EventoCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
  
    static get observedAttributes() {
      return ['nombre', 'categoria', 'ciudad', 'fecha', 'hora', 'precio', 'imagen'];
    }
  
    connectedCallback() {
      this.render();
    }
  
    attributeChangedCallback() {
      if (this.shadowRoot.innerHTML) this.render();
    }
  
    render() {
      const id = this.getAttribute('data-id');
      const nombre = this.getAttribute('nombre') || '';
      const categoria = this.getAttribute('categoria') || '';
      const ciudad = this.getAttribute('ciudad') || '';
      const fecha = this.getAttribute('fecha') || '';
      const hora = this.getAttribute('hora') || '';
      const precio = Number(this.getAttribute('precio') || 0);
      const imagen = this.getAttribute('imagen') || '';
      const { dia, mes } = fecha ? formatearFechaCorta(fecha) : { dia: '', mes: '' };
  
      this.shadowRoot.innerHTML = `
        ${CSS_VARS_LINK}
        <style>
          .card {
            display: block; background: #fff; border: 1px solid #e6e6e3; border-radius: 14px;
            overflow: hidden; transition: transform .2s ease, box-shadow .2s ease;
          }
          .card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(20,20,20,.1); }
          .thumb { position: relative; aspect-ratio: 4/3; overflow: hidden; cursor: pointer; }
          .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .date-badge {
            position: absolute; top: 10px; left: 10px; background: #141414; color: #fff;
            border-radius: 8px; padding: 6px 10px; text-align: center; line-height: 1.1;
          }
          .date-badge .dia { font-size: 15px; font-weight: 800; display: block; }
          .date-badge .mes { font-size: 9px; font-weight: 700; letter-spacing: .04em; }
          .fav {
            position: absolute; top: 10px; right: 10px; width: 30px; height: 30px; border-radius: 50%;
            background: rgba(255,255,255,.92); display: flex; align-items: center; justify-content: center;
            font-size: 14px; border: none;
          }
          .body { padding: 14px 16px 16px; }
          .categoria { font-size: 11px; font-weight: 700; color: #6b6b68; text-transform: uppercase; letter-spacing: .03em; margin-bottom: 4px; }
          .nombre { font-size: 15px; font-weight: 800; color: #171717; margin-bottom: 6px; cursor: pointer; line-height: 1.3; }
          .nombre:hover { text-decoration: underline; }
          .meta { font-size: 12.5px; color: #6b6b68; display: flex; align-items: center; gap: 5px; margin-bottom: 10px; }
          .footer { display: flex; align-items: center; justify-content: space-between; }
          .precio { font-size: 15px; font-weight: 800; color: #171717; }
          .add-btn {
            border: none; background: #141414; color: #fff; width: 34px; height: 34px; border-radius: 50%;
            font-size: 16px; display: flex; align-items: center; justify-content: center; transition: opacity .15s;
          }
          .add-btn:hover { opacity: .85; }
        </style>
        <div class="card">
          <div class="thumb" part="thumb">
            <img src="${imagen}" alt="${nombre}" loading="lazy" />
            <div class="date-badge"><span class="dia">${dia}</span><span class="mes">${mes}</span></div>
            <button class="fav" title="Guardar" type="button">♡</button>
          </div>
          <div class="body">
            <div class="categoria">${categoria}</div>
            <div class="nombre">${nombre}</div>
            <div class="meta">📍 ${ciudad}, Colombia · ⏰ ${hora}</div>
            <div class="footer">
              <span class="precio">${formatearPrecio(precio)}</span>
              <button class="add-btn" title="Agregar al carrito" type="button">＋</button>
            </div>
          </div>
        </div>
      `;
  
      this.shadowRoot.querySelector('.thumb').addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('ver-detalle', { detail: { eventoId: id }, bubbles: true, composed: true }));
      });
      this.shadowRoot.querySelector('.nombre').addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('ver-detalle', { detail: { eventoId: id }, bubbles: true, composed: true }));
      });
      this.shadowRoot.querySelector('.add-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('agregar-carrito', { detail: { eventoId: id }, bubbles: true, composed: true }));
      });
    }
  }
  customElements.define('evento-card', EventoCard);
  
  /* ============================================================
      <carrito-item>
      Atributos: data-id (id del evento), nombre, categoria, precio, imagen
      Emite: 'quitar-item' (detail: { eventoId })
      ============================================================ */
  class CarritoItem extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
  
    connectedCallback() {
      this.render();
    }
  
    render() {
      const id = this.getAttribute('data-id');
      const nombre = this.getAttribute('nombre') || '';
      const categoria = this.getAttribute('categoria') || '';
      const precio = Number(this.getAttribute('precio') || 0);
      const imagen = this.getAttribute('imagen') || '';
  
      this.shadowRoot.innerHTML = `
        ${CSS_VARS_LINK}
        <style>
          .row { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid #e6e6e3; border-radius: 14px; padding: 12px; }
          .thumb { width: 76px; height: 76px; border-radius: 10px; overflow: hidden; flex-shrink: 0; }
          .thumb img { width: 100%; height: 100%; object-fit: cover; }
          .info { flex: 1; min-width: 0; }
          .categoria { font-size: 10.5px; font-weight: 700; color: #6b6b68; text-transform: uppercase; margin-bottom: 2px; }
          .nombre { font-size: 14.5px; font-weight: 800; color: #171717; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .precio { font-size: 14px; font-weight: 700; color: #171717; margin-top: 4px; }
          .remove-btn {
            border: none; background: #fef2f2; color: #dc2626; width: 34px; height: 34px; border-radius: 50%;
            font-size: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          }
          .remove-btn:hover { opacity: .8; }
        </style>
        <div class="row">
          <div class="thumb"><img src="${imagen}" alt="${nombre}" /></div>
          <div class="info">
            <div class="categoria">${categoria}</div>
            <div class="nombre">${nombre}</div>
            <div class="precio">${formatearPrecio(precio)}</div>
          </div>
          <button class="remove-btn" title="Quitar" type="button">✕</button>
        </div>
      `;
  
      this.shadowRoot.querySelector('.remove-btn').addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('quitar-item', { detail: { eventoId: id }, bubbles: true, composed: true }));
      });
    }
  }
  customElements.define('carrito-item', CarritoItem);
  
  /* ============================================================
      <categoria-card>
      Atributos: data-id, nombre, descripcion, total (# eventos en la categoría)
      Emite: 'editar-categoria' y 'eliminar-categoria' (detail: { categoriaId })
      ============================================================ */
  class CategoriaCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
  
    connectedCallback() {
      this.render();
    }
  
    render() {
      const id = this.getAttribute('data-id');
      const nombre = this.getAttribute('nombre') || '';
      const descripcion = this.getAttribute('descripcion') || '';
      const total = this.getAttribute('total') || '0';
  
      this.shadowRoot.innerHTML = `
        ${CSS_VARS_LINK}
        <style>
          .card { background: #fff; border: 1px solid #e6e6e3; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 10px; height: 100%; }
          .top { display: flex; justify-content: space-between; align-items: flex-start; }
          .nombre { font-size: 15px; font-weight: 800; color: #171717; }
          .count { font-size: 10.5px; font-weight: 700; color: #6b6b68; background: #f1f1ef; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
          .desc { font-size: 12.5px; color: #6b6b68; line-height: 1.5; flex: 1; }
          .actions { display: flex; gap: 8px; margin-top: 4px; }
          .actions button {
            flex: 1; border: 1px solid #d4d4d1; background: #fff; color: #171717; font-size: 12px; font-weight: 700;
            padding: 7px 0; border-radius: 8px;
          }
          .actions .del { color: #dc2626; border-color: #fecaca; }
          .actions button:hover { background: #f6f6f4; }
        </style>
        <div class="card">
          <div class="top">
            <div class="nombre">${nombre}</div>
            <div class="count">${total} eventos</div>
          </div>
          <div class="desc">${descripcion}</div>
          <div class="actions">
            <button class="edit" type="button">Editar</button>
            <button class="del" type="button">Eliminar</button>
          </div>
        </div>
      `;
  
      this.shadowRoot.querySelector('.edit').addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('editar-categoria', { detail: { categoriaId: id }, bubbles: true, composed: true }));
      });
      this.shadowRoot.querySelector('.del').addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('eliminar-categoria', { detail: { categoriaId: id }, bubbles: true, composed: true }));
      });
    }
  }
  customElements.define('categoria-card', CategoriaCard);