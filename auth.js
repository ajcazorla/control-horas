// Autenticación local con PBKDF2 y localStorage
const USER_KEY = 'ch_user';
const ITER = 150000;
const SALT_KEY = 'ch_user_salt';

function bufToB64(buf){ return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function b64ToBuf(b64){ return Uint8Array.from(atob(b64), c=>c.charCodeAt(0)); }

async function derive(password, saltB64){
  const pwKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const salt = b64ToBuf(saltB64);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:ITER,hash:'SHA-256'}, pwKey, 256);
  return bufToB64(bits);
}

async function auth_init_default(){
  if(localStorage.getItem(USER_KEY)) return;
  const defaultUser = 'ajcazorla';
  const defaultPass = '80151551';
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltB64 = bufToB64(salt);
  const hash = await derive(defaultPass, saltB64);
  localStorage.setItem(SALT_KEY, saltB64);
  localStorage.setItem(USER_KEY, JSON.stringify({username:defaultUser,passwordHash:hash}));
}

async function auth_login(username,password){
  const raw = localStorage.getItem(USER_KEY);
  if(!raw) return false;
  const {username:storedUser,passwordHash} = JSON.parse(raw);
  if(username !== storedUser) return false;
  const salt = localStorage.getItem(SALT_KEY);
  const hash = await derive(password, salt);
  return hash === passwordHash;
}

function auth_logout(){ /* no-op: session is ephemeral */ }

async function auth_protect(){
  // simple protection: check a session flag
  const session = sessionStorage.getItem('ch_session');
  if(session === 'ok') return true;
  // try to keep user logged if previously authenticated in this tab
  return false;
}

// helper to set session after login
async function auth_set_session(){
  sessionStorage.setItem('ch_session','ok');
}

// expose functions
window.auth_init_default = auth_init_default;
window.auth_login = async (u,p)=>{ const ok = await auth_login(u,p); if(ok) await auth_set_session(); return ok; };
window.auth_protect = auth_protect;
window.auth_logout = auth_logout;

// change credentials (requires current password)
window.auth_change_credentials = async function(currentPass,newUser,newPass){
  const raw = localStorage.getItem(USER_KEY);
  if(!raw) throw new Error('No user');
  const {username:storedUser,passwordHash} = JSON.parse(raw);
  const salt = localStorage.getItem(SALT_KEY);
  const curHash = await derive(currentPass, salt);
  if(curHash !== passwordHash) throw new Error('Contraseña actual incorrecta');
  const newSalt = crypto.getRandomValues(new Uint8Array(16));
  const newSaltB64 = bufToB64(newSalt);
  const newHash = await derive(newPass || currentPass, newSaltB64);
  localStorage.setItem(SALT_KEY, newSaltB64);
  localStorage.setItem(USER_KEY, JSON.stringify({username:newUser || storedUser,passwordHash:newHash}));
};
