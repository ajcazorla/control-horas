// Gestión de jornadas en localStorage
const SHIFTS_KEY = 'ch_shifts';

function loadShifts(){ return JSON.parse(localStorage.getItem(SHIFTS_KEY) || '[]'); }
function saveShifts(arr){ localStorage.setItem(SHIFTS_KEY, JSON.stringify(arr)); }

function uid(){ return 'id-'+Math.random().toString(36).slice(2,9); }

function parseTimeToDate(dateStr, timeStr){
  // dateStr: YYYY-MM-DD, timeStr: HH:MM
  return new Date(dateStr + 'T' + timeStr + ':00');
}

function computeNetHours(start, end, pauseMinutes){
  let s = start.getTime(), e = end.getTime();
  let diff = (e - s) / 60000;
  if(diff < 0) diff += 24*60; // turno cruzado -> asignado al día de inicio
  const net = Math.max(0, diff - (pauseMinutes||0));
  return net / 60;
}

function isSaturdayOrSunday(date){
  const d = new Date(date);
  const wd = d.getDay();
  return { saturday: wd===6, sunday: wd===0 };
}

function formatDateDisplay(isoDate){
  const d = new Date(isoDate);
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function calculateImport(shift){
  const cfg = getConfig();
  const dateISO = shift.date; // YYYY-MM-DD
  const start = parseTimeToDate(dateISO, shift.start);
  const end = parseTimeToDate(dateISO, shift.end);
  const hours = computeNetHours(start,end, shift.pause || 0);
  const d = new Date(dateISO);
  const {saturday,sunday} = isSaturdayOrSunday(dateISO);
  let rate = cfg.rates.weekday;
  if(shift.isHoliday) rate = cfg.rates.holiday;
  else if(sunday) rate = cfg.rates.sunday;
  else if(saturday) rate = cfg.rates.saturday;
  const base = hours * rate;
  const noct = hours * cfg.rates.nocturnity;
  const total = base + noct;
  return { hours, base: round(base), nocturnity: round(noct), total: round(total) };
}

function round(n){ return Math.round(n*100)/100; }

/* UI logic */
function app_init(){
  renderShiftsTable();
  document.getElementById('shiftForm').addEventListener('submit', onSaveShift);
  document.getElementById('clearForm').addEventListener('click', clearForm);
  document.getElementById('applyFilters').addEventListener('click', renderShiftsTable);
  document.getElementById('exportCsv').addEventListener('click', ()=> {
    const rows = getFilteredShifts();
    const csv = csvExportShifts(rows);
    downloadBlob(csv, 'shifts_export.csv');
  });
  document.getElementById('importCsv').addEventListener('click', async ()=>{
    const f = document.getElementById('csvFile').files[0];
    if(!f) return alert('Selecciona un fichero CSV');
    const text = await f.text();
    const parsed = csvParseShifts(text);
    // validar duplicados por date
    const existing = loadShifts();
    for(const s of parsed){
      const dup = existing.find(x=>x.date===s.date);
      if(dup){
        if(confirm(`Ya existe jornada en ${s.date}. Sobrescribir?`)) {
          const idx = existing.findIndex(x=>x.date===s.date);
          existing[idx] = s;
        }
      } else existing.push(s);
    }
    saveShifts(existing);
    renderShiftsTable();
    alert('Importado');
  });
}

function onSaveShift(e){
  e.preventDefault();
  const id = document.getElementById('shiftId').value || uid();
  const date = document.getElementById('date').value;
  const start = document.getElementById('start').value;
  const end = document.getElementById('end').value;
  const pause = parseInt(document.getElementById('pause').value || '0',10);
  const isHoliday = document.getElementById('isHoliday').checked;
  const notes = document.getElementById('notes').value || '';
  if(!date || !start || !end) return alert('Rellena fecha, entrada y salida');
  const shifts = loadShifts();
  const existingIdx = shifts.findIndex(s=>s.id===id || s.date===date && s.id!==id);
  if(existingIdx !== -1 && shifts[existingIdx].id !== id){
    if(!confirm('Ya existe una jornada en esa fecha. Sobrescribir?')) return;
    shifts.splice(existingIdx,1);
  }
  const shift = { id, date, start, end, pause, isHoliday, notes, createdAt: new Date().toISOString() };
  const idx = shifts.findIndex(s=>s.id===id);
  if(idx>=0) shifts[idx]=shift; else shifts.push(shift);
  saveShifts(shifts);
  clearForm();
  renderShiftsTable();
}

function clearForm(){
  document.getElementById('shiftId').value='';
  document.getElementById('shiftForm').reset();
}

function renderShiftsTable(){
  const rows = getFilteredShifts();
  const tbody = document.querySelector('#shiftsTable tbody');
  tbody.innerHTML = '';
  let totalImport = 0, totalHours = 0;
  rows.sort((a,b)=>a.date.localeCompare(b.date));
  for(const s of rows){
    const calc = calculateImport(s);
    totalImport += calc.total;
    totalHours += calc.hours;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${formatDateDisplay(s.date)}</td>
      <td>${s.start}</td><td>${s.end}</td>
      <td>${calc.hours.toFixed(2)}</td>
      <td>${calc.total.toFixed(2)} €</td>
      <td>
        <button data-id="${s.id}" class="edit">Editar</button>
        <button data-id="${s.id}" class="del">Eliminar</button>
      </td>`;
    tbody.appendChild(tr);
  }
  document.querySelectorAll('.edit').forEach(b=>b.addEventListener('click', e=>{
    const id = e.target.dataset.id;
    const s = loadShifts().find(x=>x.id===id);
    if(!s) return;
    document.getElementById('shiftId').value = s.id;
    document.getElementById('date').value = s.date;
    document.getElementById('start').value = s.start;
    document.getElementById('end').value = s.end;
    document.getElementById('pause').value = s.pause;
    document.getElementById('isHoliday').checked = s.isHoliday;
    document.getElementById('notes').value = s.notes;
    window.scrollTo({top:0,behavior:'smooth'});
  }));
  document.querySelectorAll('.del').forEach(b=>b.addEventListener('click', e=>{
    const id = e.target.dataset.id;
    if(!confirm('Eliminar jornada?')) return;
    const arr = loadShifts().filter(x=>x.id!==id);
    saveShifts(arr);
    renderShiftsTable();
  }));
  document.getElementById('summary').innerHTML = `<strong>Total horas:</strong> ${totalHours.toFixed(2)} h<br><strong>Total importe:</strong> ${totalImport.toFixed(2)} €`;
}

function getFilteredShifts(){
  const all = loadShifts();
  const month = document.getElementById('filterMonth').value;
  const start = document.getElementById('rangeStart').value;
  const end = document.getElementById('rangeEnd').value;
  let rows = all.slice();
  if(month){
    const [y,m] = month.split('-');
    rows = rows.filter(s=> s.date.startsWith(`${y}-${m}`));
  }
  if(start) rows = rows.filter(s=> s.date >= start);
  if(end) rows = rows.filter(s=> s.date <= end);
  return rows;
}

/* CSV helpers using csv-utils.js */
function csvExportShifts(shifts){
  const hdr = ['id','date','start','end','pause_minutes','isHoliday','notes'];
  const lines = [hdr.join(',')];
  for(const s of shifts){
    const row = [s.id,s.date,s.start,s.end,s.pause || 0,s.isHoliday ? '1':'0', `"${(s.notes||'').replace(/"/g,'""')}"`];
    lines.push(row.join(','));
  }
  return lines.join('\n');
}

function csvParseShifts(text){
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const out = [];
  for(let i=1;i<lines.length;i++){
    const cols = lines[i].split(',');
    const id = cols[0];
    const date = cols[1];
    const start = cols[2];
    const end = cols[3];
    const pause = parseInt(cols[4]||'0',10);
    const isHoliday = (cols[5]||'0') === '1';
    const notes = cols.slice(6).join(',').replace(/^"|"$/g,'').replace(/""/g,'"');
    out.push({ id: id || uid(), date, start, end, pause, isHoliday, notes, createdAt: new Date().toISOString() });
  }
  return out;
}

function downloadBlob(text, filename){
  const blob = new Blob([text], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 500);
}

window.app_init = app_init;
