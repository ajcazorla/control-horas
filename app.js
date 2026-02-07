function calcular() {
    const fecha = document.getElementById("fecha").value;
    const entrada = document.getElementById("entrada").value;
    const salida = document.getElementById("salida").value;
    const pausa = parseInt(document.getElementById("pausa").value);

    const [hE, mE] = entrada.split(":").map(Number);
    const [hS, mS] = salida.split(":").map(Number);

    let e = hE + mE / 60;
    let s = hS + mS / 60;

    if (s < e) s += 24;

    const duracion = s - e - pausa / 60;

    const inicioNoche = 22;
    const finNoche = 30;

    const nocturnas = Math.max(0, Math.min(s, finNoche) - Math.max(e, inicioNoche));

    document.getElementById("resultado").innerHTML = `
        <h2>Resultado</h2>
        <p><strong>Duración total:</strong> ${duracion.toFixed(2)} h</p>
        <p><strong>Nocturnas:</strong> ${nocturnas.toFixed(2)} h</p>
    `;
}
