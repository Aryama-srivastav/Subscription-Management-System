import { signIn } from '../auth/session.js';
import { validateEmail, validatePassword } from '../utils/validators.js';
import { toast } from '../ui.js';
import { navigate } from '../router.js';

export function render() {
  const html = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg)">
      <div class="card" style="width:360px">
        <h1 style="text-align:center">Sign in</h1>
        <div class="form-group"><label>Email</label><input id="email" type="email" /></div>
        <div class="form-group"><label>Password</label><input id="password" type="password" /></div>
        <div id="err" class="error-text"></div>
        <button class="btn btn-primary" style="width:100%;margin-top:8px" id="submit">Sign in</button>
        <div class="row" style="justify-content:space-between;margin-top:12px">
          <a href="#/signup">Create account</a>
          <a href="#/reset-password">Forgot password?</a>
        </div>
      </div>
    </div>`;
  return { html, mount };
}

function mount() {
  document.getElementById('submit').onclick = async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const err = document.getElementById('err');
    err.textContent = validateEmail(email) || '';
    if (err.textContent) return;
    try {
      await signIn(email, password);
      toast('Welcome back');
      navigate('/dashboard');
    } catch (e) {
      err.textContent = e.message;
    }
  };
}
