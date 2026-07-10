function generarReporte() {

    const anio = Number(document.getElementById("anio").value);
    const mes = Number(document.getElementById("mes").value);

    const ventas = JSON.parse(localStorage.getItem("ventas")) || [];

    const reporte = {};

    let totalMes = 0;

    ventas.forEach(venta => {

        const fecha = new Date(venta.fecha);

        if (
            fecha.getFullYear() === anio &&
            fecha.getMonth() === mes
        ) {

            venta.items.forEach(item => {

                if (!reporte[item.codigoEvento]) {

                    reporte[item.codigoEvento] = {
                        codigo: item.codigoEvento,
                        nombre: item.nombreEvento,
                        cantidad: 0,
                        valor: 0
                    };

                }

                reporte[item.codigoEvento].cantidad += item.cantidad;
                reporte[item.codigoEvento].valor += item.cantidad * item.precio;

                totalMes += item.cantidad * item.precio;

            });

        }

    });

    const cuerpo = document.getElementById("tablaReporte");
    const total = document.getElementById("totalGeneral");
    const mensaje = document.getElementById("mensaje");

    cuerpo.innerHTML = "";
    total.innerHTML = "";
    mensaje.innerHTML = "";

    if (Object.keys(reporte).length === 0) {

        mensaje.innerHTML = "No existen ventas para el período seleccionado.";
        return;

    }

    for (let codigo in reporte) {

        const evento = reporte[codigo];

        cuerpo.innerHTML += `
            <tr>
                <td>${evento.codigo}</td>
                <td>${evento.nombre}</td>
                <td>${evento.cantidad}</td>
                <td>$${evento.valor.toLocaleString()}</td>
            </tr>
        `;

    }

    total.innerHTML = `
        <tr>
            <th colspan="3">TOTAL GENERAL</th>
            <th>$${totalMes.toLocaleString()}</th>
        </tr>
    `;

}