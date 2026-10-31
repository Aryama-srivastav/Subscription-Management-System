import { supabase } from '../supabaseClient.js';
import { getProfile, signOut } from '../auth/session.js';
import { navigate } from '../router.js';

let profile = null;

export async function initShell(user) {
  profile = await getProfile(user.id);
  if (!profile) {
    // create profile as customer if missing
    await supabase.from('profiles').insert({ id: user.id, full_name: user.user_metadata?.full_name || user.email, role: 'customer' });
    profile = await getProfile(user.id);
  }
}

export function getProfileCached() { return profile; }
export function isAdmin() { return profile?.role === 'admin'; }
export function isStaff() { return profile?.role === 'admin' || profile?.role === 'staff'; }
export function isCustomer() { return profile?.role === 'customer'; }

export function renderShell(contentHtml) {
  const role = profile?.role || 'customer';
  const links = [
    { path: '/dashboard', label: 'Dashboard', show: true },
    { path: '/products', label: 'Products', show: isStaff() },
    { path: '/quotations', label: 'Quotations', show: isStaff() },
    { path: '/plans', label: 'Plans', show: isStaff() },
    { path: '/subscriptions', label: 'Subscriptions', show: true },
    { path: '/invoices', label: 'Invoices', show: true },
    { path: '/payments', label: 'Payments', show: isStaff() },
    { path: '/customers', label: 'Customers', show: isStaff() },
    { path: '/discounts', label: 'Discounts', show: isAdmin() },
    { path: '/settings', label: 'Settings', show: isAdmin() },
  ].filter(l => l.show);

  const active = location.hash.replace('#','') || '/dashboard';
  const sidebar = links.map(l => `<a href="#${l.path}" class="${active===l.path?'active':''}">${l.label}</a>`).join('');
  return `
    <div class="sidebar">
      <h2 style="margin:0 0 16px;color:var(--primary-2)">Brightloop</h2>
      <div class="muted" style="margin-bottom:12px;font-size:12px">${profile?.full_name||''} · ${role}</div>
      ${sidebar}
      <div style="margin-top:20px"><button class="btn btn-ghost btn-sm" id="logoutBtn">Sign out</button></div>
    </div>
    <div class="main">
      <div class="topbar">
        <strong>${titleFor(active)}</strong>
        <span class="muted" style="font-size:12px">${new Date().toLocaleDateString()}</span>
      </div>
      <div id="pageContent">${contentHtml}</div>
    </div>
  `;
}

function titleFor(p) {
  const map = { '/dashboard':'Dashboard','/products':'Products','/plans':'Plans','/subscriptions':'Subscriptions','/invoices':'Invoices','/payments':'Payments','/customers':'Customers','/settings':'Settings' };
  if (p.startsWith('/subscriptions/')) return 'Subscription';
  if (p.startsWith('/invoices/')) return 'Invoice';
  if (p.startsWith('/products/')) return 'Product';
  return map[p] || 'Brightloop';
}

export function mountShell(html) {
  const app = document.getElementById('app');
  app.innerHTML = renderShell(html);
  document.getElementById('logoutBtn').onclick = async () => { await signOut(); navigate('/login'); location.reload(); };
}
