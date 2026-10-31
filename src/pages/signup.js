import { signUp } from '../auth/session.js';
import { validateEmail, validatePassword } from '../utils/validators.js';
import { toast } from '../ui.js';
import { navigate } from '../router.js';

export function render() {
  const html = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg)">
      <div class="card" style="width:380px">
        <h1 style="text-align:center">Create account</h1>
        <div class="form-group"><label>Full name</label><input id="name" /></div>
        <div class="form-group"><label>Email</label><input id="email" type="email" /></div>
        <div class="form-group"><label>Password</label><input id="password" type="password" /></div>
        <div class="muted" style="font-size:12px;margin-bottom:8px">More than 8 chars, with upper, lower and special char.</div>
        <div id="err" class="error-text"></div>
        <button class="btn btn-primary" style="width:100%;margin-top:8px" id="submit">Sign up</button>
        <div style="margin-top:12px;text-align:center"><a href="#/login">Already have an account?</a></div>
      </div>
    </div>`;
  return { html, mount };
}

function mount() {
  document.getElementById('submit').onclick = async () => {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const err = document.getElementById('err');
    const e = validateEmail(email) || validatePassword(password) || (name ? null : 'Name is required.');
    if (e) { err.textContent = e; return; }
    try {
      await signUp(email, password, name);
      toast('Account created. Check your email to confirm.');
      navigate('/login');
    } catch (ex) { err.textContent = ex.message; }
  };
}
