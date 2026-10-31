import { supabase } from './supabaseClient.js';
import { getSession, getProfile, onAuthChange } from './auth/session.js';
import { initShell, mountShell, isStaff, isAdmin } from './layout/shell.js';
import { register, startRouter, navigate } from './router.js';
import { toast } from './ui.js';

// Lazy page loaders
async function pageLogin() {
  const { render } = await import('./pages/login.js');
  return render();
}
async function pageSignup() {
  const { render } = await import('./pages/signup.js');
  return render();
}
async function pageReset() {
  const { render } = await import('./pages/reset.js');
  return render();
}
async function guarded(factory) {
  const session = await getSession();
  if (!session) { navigate('/login'); return { html: '' }; }
  await initShell(session.user);
  const r = await factory();
  mountShell(r.html);
  if (r.mount) r.mount();
  return { cleanup: r.cleanup };
}

// Register routes
register('/login', () => { document.getElementById('app').innerHTML = ''; (async()=>{ const r=await pageLogin(); document.getElementById('app').innerHTML=r.html; if(r.mount) r.mount(); })(); return {}; });
register('/signup', () => { document.getElementById('app').innerHTML=''; (async()=>{ const r=await pageSignup(); document.getElementById('app').innerHTML=r.html; if(r.mount) r.mount(); })(); return {}; });
register('/reset-password', () => { document.getElementById('app').innerHTML=''; (async()=>{ const r=await pageReset(); document.getElementById('app').innerHTML=r.html; if(r.mount) r.mount(); })(); return {}; });

register('/dashboard', () => guarded(async () => {
  const m = await import('./pages/dashboard.js'); return m.render();
}));
register('/products', () => guarded(async () => {
  const m = await import('./pages/products.js'); return m.render();
}));

register('/quotations', () => guarded(async () => {
  const m = await import('./pages/quotations.js'); return m.render();
}));
register('/discounts', () => guarded(async () => {
  const m = await import('./pages/discounts.js'); return m.render();
}));
register('/products/:id', (p) => guarded(async () => {
  const m = await import('./pages/productDetail.js'); return m.render(p);
}));
register('/plans', () => guarded(async () => {
  const m = await import('./pages/plans.js'); return m.render();
}));
register('/subscriptions', () => guarded(async () => {
  const m = await import('./pages/subscriptions.js'); return m.render();
}));
register('/subscriptions/:id', (p) => guarded(async () => {
  const m = await import('./pages/subscriptionDetail.js'); return m.render(p);
}));
register('/invoices', () => guarded(async () => {
  const m = await import('./pages/invoices.js'); return m.render();
}));
register('/invoices/:id', (p) => guarded(async () => {
  const m = await import('./pages/invoiceDetail.js'); return m.render(p);
}));
register('/payments', () => guarded(async () => {
  const m = await import('./pages/payments.js'); return m.render();
}));
register('/customers', () => guarded(async () => {
  const m = await import('./pages/customers.js'); return m.render();
}));
register('/settings', () => guarded(async () => {
  const m = await import('./pages/settings.js'); return m.render();
}));

// boot
(async () => {
  const session = await getSession();
  if (!session) navigate('/login');
  else navigate('/dashboard');
  startRouter();
  onAuthChange((s) => {
    if (!s) navigate('/login');
  });
})();
