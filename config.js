const CONFIG_KEY = 'ch_config';
const DEFAULT_CONFIG = {
  rates:{ weekday:10.36, saturday:12.46, sunday:15.55, holiday:18.66, nocturnity:1.74 },
  pluses:{},
  holidays:[],
  pauseUnit:'minutes'
};

function getConfig(){
  const raw = localStorage.getItem(CONFIG_KEY);
  if(!raw){ localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG)); return JSON.parse(JSON.stringify(DEFAULT_CONFIG)); }
  return JSON.parse(raw);
}
function saveConfig(cfg){ localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); }

function config_init(){
  const cfg = getConfig();
  document.getElementById('rateWeekday').value = cfg.rates.weekday;
  document.getElementById('rateSaturday').value = cfg.rates.saturday;
  document.getElementById('rateSunday').value = cfg.rates.sunday;
  document.getElementById('rateHoliday').value = cfg.rates.holiday;
  document.getElementById('rateNocturnity').value = cfg.rates.nocturnity;
  document.getElementById('holidaysList').value = (cfg.holidays||[]).join('\n');

  document.getElementById('ratesForm').addEventListener('submit', e=>{
    e.preventDefault();
    const c = getConfig();
    c.rates.weekday = parseFloat(document.getElementById('rateWeekday').value);
    c.rates.saturday = parseFloat(document.getElementById('rateSaturday').value);
    c.rates.sunday = parseFloat(document.getElementById('rateSunday').value);
    c.rates.holiday = parseFloat(document.getElementById('rateHoliday').value);
    c.rates.nocturnity = parseFloat(document.getElementById('rateNocturnity').value);
    saveConfig(c);
    alert('Tarifas guardadas');
  });

  document.getElementById('saveHolidays').addEventListener('click', ()=>{
    const c = getConfig();
    const lines = document.getElementById('holidaysList').value.split('\n').map(s=>s.trim()).filter(Boolean);
    c.holidays = lines;
    saveConfig(c);
    alert('Festivos guardados');
  });

  document.getElementById('credForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const newUser = document.getElementById('newUser').value.trim();
    const currentPass = document.getElementById('currentPass').value;
    const newPass = document.getElementById('newPass').value || null;
    try{
      await window.auth_change_credentials(currentPass, newUser || undefined, newPass || undefined);
      alert('Credenciales actualizadas. Vuelve a iniciar sesión.');
      sessionStorage.removeItem('ch_session');
      location.href='index.html';
    }catch(err){ alert(err.message); }
  });

  document.getElementById('resetData').addEventListener('click', ()=>{
    if(confirm('Borrar jornadas y configuración local?')) {
      localStorage.removeItem('ch_shifts');
      localStorage.removeItem(CONFIG_KEY);
      alert('Datos borrados');
      location.reload();
    }
  });
}

window.config_init = config_init;
window.getConfig = getConfig;
window.saveConfig = saveConfig;
