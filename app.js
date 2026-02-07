// =========================
// CÁLCULO Y GUARDADO
// =========================

function calcular() {
    const fecha = document.getElementById("fecha").value;
    const entrada = document.getElementById("entrada").value;
    const salida = document.getElementById("salida").value;
    const pausa = parseInt(document.getElementById("pausa").value) || 0;
    const precio = parseFloat(document.getElementById("precio").value) || 0;

    if (!fecha || !entrada || !salida) {
        alert("Faltan datos");
        return;
    }

    const inicio = new Date(`${fecha}T${entrada}`);
    const fin = new Date(`${fecha}T${salida}`);

    let horas = (fin - inicio) / 1000 / 60 / 60;
    horas -= pausa / 60;

    const horasRedondeadas = Math.round(horas * 100) / 100;
    const importe = Math.round(horasRedondeadas * precio * 100) / 100;

    const registro = {
        fecha,
        entrada,
        salida,
        pausa,
        horas: horasRedondeadas,
        precio,
        importe
    };

    guardarRegistro(registro);
    mostrarRegistros();
}


// =========================
// LOCALSTORAGE
// =========================

function guardarRegistro(registro) {
    let datos = JSON.parse(localStorage.getItem("registros")) || [];
    datos.push(registro);
    localStorage.setItem("registros", JSON.stringify(datos));
}

function borrarRegistro(index) {
    let datos = JSON.parse(localStorage.getItem("registros")) || [];
    datos.splice(index, 1);
    localStorage.setItem("registros", JSON.stringify(datos));
    mostrarRegistros();
}

function borrarTodo() {
    if (confirm("¿Seguro que quieres borrar todo?")) {
        localStorage.removeItem("registros");
        mostrarRegistros();
    }
}


// =========================
// MOSTRAR DATOS
// =========================

function mostrarRegistros() {
    let datos = JSON.parse(localStorage.getItem("registros")) || [];
    let html = "<h2>Historial</h2>";

    let totalHoras = 0;
    let totalImporte = 0;

    datos.forEach((r, i) => {
        totalHoras += r.horas;
        totalImporte += r.importe;

        html += `
            <div class="item">
                <strong>${r.fecha}</strong><br>
                ${r.entrada} - ${r.salida} (Pausa: ${r.pausa} min)<br>
                Horas: ${r.horas} h<br>
                Importe: ${r.importe} €<br>
                <button onclick="borrarRegistro(${i})">Borrar</button>
            </div>
            <hr>
        `;
    });

    html += `
        <h2>Totales</h2>
        <p><strong>Horas totales:</strong> ${Math.round(totalHoras * 100) / 100} h</p>
        <p><strong>Importe total:</strong> ${Math.round(totalImporte * 100) / 100} €</p>
        <button onclick="borrarTodo()">Borrar todo</button>
    `;

    document.getElementById("resultado").innerHTML = html;
}

window.onload = mostrarRegistros;
