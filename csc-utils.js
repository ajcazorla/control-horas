// Funciones auxiliares para CSV (ya usadas por app.js)
// Si quieres ampliar: añadir validaciones, mapeo de columnas, etc.
function downloadText(filename, text){
  const blob = new Blob([text], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 500);
}
window.downloadBlob = downloadText;
