:root{
  --brand:#27AB49; --brand-ink:#052e16;
  --bg:#f8fafc; --panel:#ffffff; --muted:#f1f5f9;
  --text:#0f172a; --subtext:#475569; --border:#e2e8f0;
  --card:#ffffff; --shadow: 0 6px 18px rgba(2,6,23,.08);
  --menu-ink:#0f172a; --menu-muted:#64748b;
  --menu-active-bg: color-mix(in oklab, var(--brand) 18%, white);
  --menu-active-ink:#0b1725;
  --ring: 0 0 0 3px color-mix(in oklab, var(--brand) 40%, transparent);
  --warn:#f59e0b; --danger:#ef4444;
}
html[data-theme="dark"]{
  --bg:#0f172a; --panel:#111827; --muted:#0b1220;
  --text:#e5e7eb; --subtext:#9ca3af; --border:#253045;
  --card:#0b1220; --shadow: 0 8px 22px rgba(0,0,0,.35);
  --menu-ink:#e5e7eb; --menu-muted:#9ca3af;
  --menu-active-bg: color-mix(in oklab, var(--brand) 22%, black);
  --menu-active-ink:#ecfdf5;
}

*{ box-sizing:border-box }
body{
  margin:0; font-family: system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial;
  color:var(--text); background:var(--bg);
  display:flex; min-height:100dvh;
}

/* Sidebar */
.sidebar{
  width:260px; flex:0 0 260px; background:var(--panel); border-right:1px solid var(--border);
  display:flex; flex-direction:column; height:100dvh; position:sticky; top:0;
}
.brand{ display:flex; align-items:center; gap:10px; padding:16px; border-bottom:1px solid var(--border); }
.logo{
  width:38px; height:38px; border-radius:10px;
  background: linear-gradient(135deg, var(--brand), color-mix(in oklab, var(--brand) 40%, #16a34a));
  display:grid; place-items:center; color:#fff; font-weight:800; letter-spacing:.2px;
  box-shadow: 0 6px 14px color-mix(in oklab, var(--brand) 35%, transparent);
}
.brand-title{ font-weight:700; } .brand-sub{ font-size:12px; color:var(--menu-muted); }
nav.menu{ padding:10px; display:flex; flex-direction:column; gap:6px; overflow:auto; }

a.item, button.item{
  display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px;
  color:var(--menu-ink); text-decoration:none; border:1px solid transparent; transition:.18s ease;
  background:none; width:100%; text-align:left; cursor:pointer;
}
.item:hover{ background:var(--muted); }
.item.active{
  background:var(--menu-active-bg); color:var(--menu-active-ink);
  border-color: color-mix(in oklab, var(--brand) 40%, transparent); font-weight:600;
}
.item svg{ width:18px; height:18px; opacity:.95; }
.item[hidden]{ display:none !important; }

.menu-group{ display:flex; flex-direction:column; gap:6px; }
.item-parent{ cursor:pointer; }
.submenu{ display:none; flex-direction:column; gap:6px; margin-left:24px; margin-top:4px; }
.menu-group[aria-expanded="true"] > .submenu{ display:flex; }
.item.sub{ font-size:14px; }
.caret{ margin-left:auto; transition: transform .18s ease; }
.menu-group[aria-expanded="true"] .caret{ transform: rotate(90deg); }

.sidebar-footer{ margin-top:auto; padding:12px 16px; color:var(--menu-muted); font-size:12px; border-top:1px solid var(--border); }

/* Content */
.content{ flex:1 1 auto; display:flex; flex-direction:column; min-width:0; }
header.topbar{
  padding:10px 14px; display:flex; gap:10px; align-items:center; justify-content:space-between;
  position:sticky; top:0; z-index:5; background:var(--panel); border-bottom:1px solid var(--border);
}
.left-tools,.right-tools{ display:flex; gap:8px; align-items:center; }
.title{ font-weight:800; }

.btn, select, input[type="date"], input[type="text"], input[type="number"]{
  background:var(--panel); color:var(--text); border:1px solid var(--border);
  padding:8px 10px; border-radius:10px; outline:none; height:36px;
}
.btn{ cursor:pointer; transition:.18s ease; display:inline-flex; align-items:center; gap:8px; }
.btn:hover{ filter:brightness(1.05); }
.btn.primary{ background:var(--brand); border-color:transparent; color:var(--brand-ink); font-weight:700; }
.btn.ghost{ background:var(--muted); }
.btn:focus-visible{ box-shadow: var(--ring); }
.burger{ width:36px; height:36px; display:grid; place-items:center; border-radius:10px; }

.toggle{
  display:inline-flex; align-items:center; gap:8px; border-radius:999px; padding:6px 10px;
  background:var(--muted); border:1px solid var(--border); cursor:pointer; height:36px;
}
.toggle .state{ font-size:12px; color:var(--subtext); }
.toggle svg{ width:16px; height:16px; }

main{ padding:16px; max-width:1400px; width:100%; margin:0 auto; display:flex; flex-direction:column; gap:16px; }
.panel{ background:var(--card); border:1px solid var(--border); border-radius:14px; padding:16px; box-shadow:var(--shadow); }
.hint{ color:var(--subtext); font-size:13px; }
.chip{ display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:999px; border:1px solid var(--border); font-size:12px; color:var(--subtext); }

table{ width:100%; border-collapse: collapse; }
th, td{ text-align:left; padding:10px; border-bottom:1px solid var(--border); font-size:14px; color:var(--text); }
th{ color:var(--subtext); font-weight:700; }

.badge{ font-size:11px; padding:3px 8px; border-radius:999px; border:1px solid var(--border); color:var(--subtext); }
.denied{ border:1px dashed var(--border); border-radius:12px; background:var(--muted); color:var(--subtext); }

.alert-red{ background: color-mix(in oklab, var(--danger) 14%, transparent); border:1px solid color-mix(in oklab, var(--danger) 45%, transparent); }
.alert-yellow{ background: color-mix(in oklab, var(--warn) 14%, transparent); border:1px solid color-mix(in oklab, var(--warn) 45%, transparent); }

/* Modals */
dialog{ border:none; border-radius:16px; padding:0; max-width:720px; width:96vw; background:var(--panel); color:var(--text); }
dialog::backdrop{ background: rgba(0,0,0,.45); }
.modal-head{ padding:14px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
.modal-body{ padding:16px; display:grid; gap:12px; grid-template-columns: repeat(2, minmax(0,1fr)); }
.modal-body.full{ grid-template-columns: 1fr; }
.field{ display:grid; gap:6px; }
.field label{ font-size:13px; color:var(--subtext); }
.modal-foot{ padding:12px 16px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:8px; }

/* Responsive: overlay sidebar */
@media (max-width:980px){
  .sidebar{ position:fixed; left:0; top:0; bottom:0; transform: translateX(-102%); transition: transform .22s ease; z-index:20; }
  body.sidebar-open .sidebar{ transform: translateX(0); }
  body.sidebar-open::after{ content:""; position:fixed; inset:0; background:rgba(0,0,0,.4); backdrop-filter: blur(1px); z-index:15; }
  .content{ min-height:100dvh; }
}
