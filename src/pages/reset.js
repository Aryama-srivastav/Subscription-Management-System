import { resetPassword } from '../auth/session.js';
import { validateEmail } from '../utils/validators.js';
import { toast } from '../ui.js';

export function render() {
  const html = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg)">
      <div class="card" style="width:360px">
        <h1 style="text-align:center">Reset password</h1>
        <div class="form-group"><label>Email</label><input id="email" type="email" /></div>
        <div id="err" class="error-text"></div>
        <button class="btn btn-primary" style="width:100%;margin-top:8px" id="submit">Send reset link</button>
        <div style="margin-top:12px;text-align:center"><a href="#/login">Back to sign in</a></div>
      </div>
    </div>`;
  return { html, mount };
}

function mount() {
  document.getElementById('submit').onclick = async () => {
    const email = document.getElementById('email').value.trim();
    const err = document.getElementById('err');
    const e = validateEmail(email);
    if (e) { err.textContent = e; return; }
    try {
      await resetPassword(email);
      toast('Reset link sent to your email.');
    } catch (ex) { err.textContent = ex.message; }
  };
}
