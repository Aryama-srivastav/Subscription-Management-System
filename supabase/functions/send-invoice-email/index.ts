import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  try {
    const { invoice_id } = await req.json();
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: inv, error } = await supabase
      .from("invoices")
      .select("*, customers:profiles!customer_id(full_name,email), invoice_lines(*, products(name))")
      .eq("id", invoice_id)
      .single();
    if (error || !inv) throw error ?? new Error("invoice not found");

    const customer = inv.customers;
    const lines = inv.invoice_lines ?? [];
    const html = `
      <h2>Invoice ${inv.number}</h2>
      <p>Hi ${customer?.full_name ?? ""},</p>
      <p>Your invoice for ${inv.issue_date} is ready.</p>
      <table border="1" cellpadding="6" cellspacing="0">
        <tr><th>Product</th><th>Qty</th><th>Amount</th></tr>
        ${lines.map((l: any) => `<tr><td>${l.products?.name ?? ""}</td><td>${l.qty}</td><td>${l.line_total}</td></tr>`).join("")}
      </table>
      <p><strong>Total:</strong> ${inv.total}</p>
      <p><strong>Due:</strong> ${inv.due_date}</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "billing@brightloop.app",
        to: [customer?.email],
        subject: `Invoice ${inv.number} from Brightloop`,
        html,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
