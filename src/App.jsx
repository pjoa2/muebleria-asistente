import { useState, useRef, useEffect } from "react";

// PDF.js — extracción de texto en el navegador
const loadPdfJs = () =>
  new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

const extractTextFromPdf = async (file) => {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
};

const parseCatalogText = (text, providerName) => {
  const lines = text.split("\n").filter((l) => l.trim());
  const products = [];
  lines.forEach((line) => {
    const priceMatch = line.match(/(\d[\d.,]*)\s*€/);
    if (priceMatch && line.length > 10) {
      products.push({
        id: Date.now() + Math.random(),
        provider: providerName,
        description: line.trim(),
        price: parseFloat(priceMatch[1].replace(",", ".")),
        raw: line,
      });
    }
  });
  return products;
};

const colors = {
  bg: "#faf6ee", bgCard: "#ffffff", accent: "#b5664a", accentDark: "#9c5640",
  accentLight: "#f0ddd2", text: "#2b2420", textMuted: "#766b5e",
  textFaint: "#a89a87", border: "#e8ddc9", borderLight: "#f0e8d8",
};
const fontSerif = "'Playfair Display', Georgia, serif";
const fontSans = "'Inter', -apple-system, sans-serif";

const GoogleFonts = () => (
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
);

const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const icons = {
    upload: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>),
    layers: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>),
    message: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>),
    image: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>),
    trash: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>),
    send: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>),
    spark: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /><path d="M5 17l.7 2.1L8 20l-2.3.9L5 23l-.7-2.1L2 20l2.3-.9L5 17z" /></svg>),
    camera: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>),
    logout: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>),
    back: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>),
  };
  return icons[name] || null;
};

const Logo = ({ size = 36 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: colors.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <Icon name="spark" size={size * 0.55} color="#fff" />
  </div>
);

function Landing({ onGoAuth }) {
  const st = {
    page: { minHeight: "100vh", background: colors.bg, fontFamily: fontSans, color: colors.text },
    nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", maxWidth: 1100, margin: "0 auto" },
    navLeft: { display: "flex", alignItems: "center", gap: 10 },
    navTitle: { fontFamily: fontSerif, fontSize: 20, fontWeight: 700, margin: 0 },
    navRight: { display: "flex", alignItems: "center", gap: 18 },
    navLink: { color: colors.text, fontSize: 14.5, fontWeight: 500, cursor: "pointer", background: "none", border: "none", fontFamily: fontSans },
    btnPrimary: { background: colors.accent, color: "#fff", border: "none", borderRadius: 9, padding: "11px 20px", fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: fontSans },
    hero: { textAlign: "center", padding: "60px 24px 40px", maxWidth: 880, margin: "0 auto" },
    kicker: { fontSize: 12.5, letterSpacing: "0.14em", color: colors.textMuted, fontWeight: 600, textTransform: "uppercase", marginBottom: 18 },
    h1: { fontFamily: fontSerif, fontSize: 52, lineHeight: 1.15, fontWeight: 700, margin: "0 0 24px" },
    accentText: { color: colors.accent },
    sub: { fontSize: 17, color: colors.textMuted, lineHeight: 1.6, maxWidth: 620, margin: "0 auto 32px" },
    ctaRow: { display: "flex", gap: 12, justifyContent: "center", marginBottom: 56, flexWrap: "wrap" },
    btnSecondary: { background: "#fff", color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 9, padding: "13px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: fontSans },
    btnPrimaryLg: { background: colors.accent, color: "#fff", border: "none", borderRadius: 9, padding: "13px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: fontSans },
    cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px" },
    card: { background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 14, padding: "26px 24px", textAlign: "left" },
    cardIcon: { width: 42, height: 42, borderRadius: 10, background: colors.accentLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 },
    cardTitle: { fontFamily: fontSerif, fontSize: 19, fontWeight: 700, margin: "0 0 8px" },
    cardDesc: { fontSize: 14, color: colors.textMuted, lineHeight: 1.6, margin: 0 },
  };
  return (
    <div style={st.page}>
      <div style={st.nav}>
        <div style={st.navLeft}><Logo size={32} /><p style={st.navTitle}>MueblesIA</p></div>
        <div style={st.navRight}>
          <button style={st.navLink} onClick={() => onGoAuth("login")}>Entrar</button>
          <button style={st.btnPrimary} onClick={() => onGoAuth("signup")}>Crear cuenta</button>
        </div>
      </div>
      <div style={st.hero}>
        <p style={st.kicker}>Tienda de muebles · IA</p>
        <h1 style={st.h1}>Vende muebles con un asistente que <span style={st.accentText}>conoce tu catálogo</span>.</h1>
        <p style={st.sub}>Sube las tarifas de tus proveedores, descríbele al asistente lo que busca tu cliente y obtén conjuntos coherentes, presupuestos al instante y análisis de la habitación.</p>
        <div style={st.ctaRow}>
          <button style={st.btnPrimaryLg} onClick={() => onGoAuth("signup")}>Empezar gratis</button>
          <button style={st.btnSecondary} onClick={() => onGoAuth("login")}>Ya tengo cuenta</button>
        </div>
      </div>
      <div style={st.cards}>
        {[
          { icon: "layers", title: "Catálogo unificado", desc: "Añade productos a mano o sube los PDFs de tarifas y la IA los extrae." },
          { icon: "message", title: "Asistente por proyecto", desc: "Habla con la app: comedor moderno, tonos cálidos. Recibe propuestas con precios." },
          { icon: "image", title: "Análisis de habitación", desc: "Sube la foto o hazla con la cámara e indica dónde colocar cada mueble." },
        ].map((c) => (
          <div key={c.title} style={st.card}>
            <div style={st.cardIcon}><Icon name={c.icon} size={20} color={colors.accent} /></div>
            <p style={st.cardTitle}>{c.title}</p>
            <p style={st.cardDesc}>{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Auth({ mode, setMode, onEnter, onBack }) {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isSignup = mode === "signup";
  const st = {
    page: { minHeight: "100vh", background: colors.bg, fontFamily: fontSans, display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", color: colors.text, position: "relative" },
    backBtn: { position: "absolute", top: 24, left: 24, background: "none", border: "none", color: colors.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 14 },
    brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 36 },
    brandTitle: { fontFamily: fontSerif, fontSize: 24, fontWeight: 700, margin: 0 },
    card: { background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 16, padding: "36px 32px", width: "100%", maxWidth: 420 },
    h2: { fontFamily: fontSerif, fontSize: 28, fontWeight: 700, margin: "0 0 6px" },
    p: { fontSize: 14.5, color: colors.textMuted, margin: "0 0 26px" },
    label: { display: "block", fontSize: 13.5, fontWeight: 600, color: colors.text, marginBottom: 7 },
    fieldWrap: { marginBottom: 18 },
    input: { width: "100%", background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 9, padding: "12px 14px", fontSize: 14.5, fontFamily: fontSans, color: colors.text, boxSizing: "border-box", outline: "none" },
    btn: { width: "100%", background: colors.accent, color: "#fff", border: "none", borderRadius: 9, padding: "13px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: fontSans, marginTop: 4 },
    switchText: { textAlign: "center", fontSize: 14, color: colors.textMuted, marginTop: 20 },
    switchLink: { color: colors.accent, fontWeight: 600, cursor: "pointer" },
    note: { fontSize: 12.5, color: colors.textFaint, textAlign: "center", marginTop: 16, background: colors.accentLight, padding: "8px 12px", borderRadius: 8 },
  };
  return (
    <div style={st.page}>
      <button style={st.backBtn} onClick={onBack}><Icon name="back" size={15} /> Volver</button>
      <div style={st.brand}><Logo size={36} /><p style={st.brandTitle}>MueblesIA</p></div>
      <div style={st.card}>
        <h2 style={st.h2}>{isSignup ? "Crea tu cuenta" : "Entra a tu cuenta"}</h2>
        <p style={st.p}>{isSignup ? "Una cuenta por negocio." : "Accede a tu catálogo y proyectos."}</p>
        {isSignup && (
          <div style={st.fieldWrap}>
            <label style={st.label}>Nombre del negocio</label>
            <input style={st.input} placeholder="Muebles García" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
        )}
        <div style={st.fieldWrap}>
          <label style={st.label}>Email</label>
          <input style={st.input} type="email" placeholder="tu@negocio.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={st.fieldWrap}>
          <label style={st.label}>Contraseña</label>
          <input style={st.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button style={st.btn} onClick={() => onEnter(businessName || "Mi negocio")}>{isSignup ? "Crear cuenta" : "Entrar"}</button>
        <p style={st.switchText}>
          {isSignup ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
          <span style={st.switchLink} onClick={() => setMode(isSignup ? "login" : "signup")}>{isSignup ? "Entra" : "Crea una"}</span>
        </p>
        <p style={st.note}>Versión de prueba: el acceso aún no guarda datos de forma permanente entre sesiones.</p>
      </div>
    </div>
  );
}

function MainApp({ businessName, onLogout }) {
  const [tab, setTab] = useState("catalogo");
  const [catalog, setCatalog] = useState([]);
  const [providers, setProviders] = useState([]);
  const [messages, setMessages] = useState([{ role: "assistant", content: `¡Hola! Soy el asistente de ${businessName}. Cuéntame qué necesita tu cliente: tipo de habitación, estilo, presupuesto aproximado… y buscaré en el catálogo las mejores opciones.` }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [roomImage, setRoomImage] = useState(null);
  const [renderLoading, setRenderLoading] = useState(false);
  const [renderResult, setRenderResult] = useState(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const roomFileRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [uploadingProvider, setUploadingProvider] = useState("");
  const [dragging, setDragging] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const handleCatalogFile = async (file) => {
    if (!file) return;
    const provName = uploadingProvider.trim() || file.name.replace(/\.[^.]+$/, "");
    setPdfLoading(true);
    let text = "";
    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) text = await extractTextFromPdf(file);
      else text = await file.text();
    } catch {
      setPdfLoading(false);
      alert("No se pudo leer el PDF. Asegúrate de que tiene texto seleccionable (no escaneado).");
      return;
    }
    setPdfLoading(false);
    const products = parseCatalogText(text, provName);
    if (products.length === 0) setCatalog((prev) => [...prev, { id: Date.now(), provider: provName, description: text.slice(0, 2000), price: null, raw: text, isRaw: true }]);
    else setCatalog((prev) => [...prev, ...products]);
    setProviders((prev) => (prev.includes(provName) ? prev : [...prev, provName]));
    setUploadingProvider("");
  };

  const removeProvider = (name) => {
    setCatalog((prev) => prev.filter((p) => p.provider !== name));
    setProviders((prev) => prev.filter((p) => p !== name));
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    const catalogContext = catalog.length > 0
      ? `\n\nCATÁLOGO DISPONIBLE (${catalog.length} productos):\n` + catalog.slice(0, 60).map((p) => p.price ? `- [${p.provider}] ${p.description} — ${p.price}€` : `- [${p.provider}] ${p.description.slice(0, 200)}`).join("\n")
      : "\n\nNo hay catálogo cargado aún.";
    const systemPrompt = `Eres el asistente de ventas de "${businessName}", una tienda de muebles. Ayuda al vendedor a encontrar muebles del catálogo para su cliente, propón 3-5 opciones con precio y un total estimado. Sé conciso y práctico.${catalogContext}`;
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: systemPrompt, messages: newMessages.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "No he podido generar una respuesta.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error al conectar con la IA." }]);
    }
    setLoading(false);
  };

  const handleRoomImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setRoomImage(e.target.result);
    reader.readAsDataURL(file);
    setRenderResult(null);
  };

  const generateRender = async () => {
    if (!roomImage) return;
    setRenderLoading(true);
    setRenderResult(null);
    const base64 = roomImage.split(",")[1];
    const mediaType = roomImage.split(";")[0].split(":")[1];
    const catalogContext = catalog.length > 0 ? catalog.slice(0, 40).map((p) => p.price ? `- [${p.provider}] ${p.description} — ${p.price}€` : `- [${p.provider}] ${p.description.slice(0, 150)}`).join("\n") : "Sin catálogo cargado.";
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: `Analiza esta habitación y, usando el catálogo, propón mobiliario.\nCATÁLOGO:\n${catalogContext}\nResponde SOLO JSON: {"analisis":"...","propuesta":"...","productos":[{"nombre":"...","proveedor":"...","precio":0,"motivo":"..."}],"total":0,"consejo_render":"..."}` },
          ] }],
        }),
      });
      const data = await response.json();
      const raw = data.content?.[0]?.text || "{}";
      setRenderResult(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch {
      setRenderResult({ error: "No se pudo analizar la imagen." });
    }
    setRenderLoading(false);
  };

  const totalProducts = catalog.length;
  const providerCount = providers.length;
  const avgPrice = catalog.filter((p) => p.price).length ? Math.round(catalog.filter((p) => p.price).reduce((a, b) => a + b.price, 0) / catalog.filter((p) => p.price).length) : 0;

  const st = {
    app: { fontFamily: fontSans, minHeight: "100vh", background: colors.bg, color: colors.text, display: "flex", flexDirection: "column" },
    header: { padding: "18px 20px 14px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" },
    headerLeft: { display: "flex", alignItems: "center", gap: 10 },
    headerTitle: { margin: 0, fontFamily: fontSerif, fontSize: 17, fontWeight: 700 },
    headerSub: { margin: 0, fontSize: 11.5, color: colors.textMuted },
    logoutBtn: { background: "none", border: `1px solid ${colors.border}`, borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: colors.textMuted, display: "flex", alignItems: "center" },
    tabs: { display: "flex", borderBottom: `1px solid ${colors.border}`, background: colors.bgCard },
    tab: (active) => ({ flex: 1, padding: "13px 8px", border: "none", cursor: "pointer", background: "none", color: active ? colors.accent : colors.textFaint, borderBottom: active ? `2px solid ${colors.accent}` : "2px solid transparent", fontFamily: fontSans, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }),
    body: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
    pane: { padding: 18, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" },
    card: { background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 18 },
    label: { display: "block", fontSize: 12, color: colors.textMuted, fontWeight: 600, marginBottom: 8, textTransform: "uppercase" },
    input: { width: "100%", background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: "11px 13px", color: colors.text, fontFamily: fontSans, fontSize: 14, boxSizing: "border-box", outline: "none" },
    dropzone: (drag) => ({ border: `2px dashed ${drag ? colors.accent : colors.border}`, borderRadius: 10, padding: "28px 16px", textAlign: "center", cursor: "pointer", background: drag ? colors.accentLight : "transparent" }),
    btnGold: { background: colors.accent, color: "#fff", border: "none", borderRadius: 8, padding: "11px 20px", cursor: "pointer", fontFamily: fontSans, fontSize: 14, fontWeight: 600 },
    btnGhost: { background: "none", color: colors.accent, border: `1px solid ${colors.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: fontSans, fontSize: 13, fontWeight: 600 },
    providerTag: { display: "flex", alignItems: "center", justifyContent: "space-between", background: colors.accentLight, border: `1px solid ${colors.border}`, borderRadius: 8, padding: "9px 13px", marginBottom: 7 },
    statsRow: { display: "flex", gap: 12, flexWrap: "wrap" },
    stat: { flex: 1, minWidth: 90, background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "12px 14px", textAlign: "center" },
    statNum: { fontSize: 24, color: colors.accent, display: "block", fontFamily: fontSerif, fontWeight: 700 },
    statLabel: { fontSize: 11, color: colors.textFaint, fontWeight: 600 },
    chatPane: { display: "flex", flexDirection: "column", height: "calc(100vh - 130px)" },
    messages: { flex: 1, overflowY: "auto", padding: "16px 16px 8px" },
    msgBubble: (role) => ({ display: "flex", justifyContent: role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }),
    bubble: (role) => ({ maxWidth: "82%", background: role === "user" ? colors.accent : colors.bgCard, color: role === "user" ? "#fff" : colors.text, border: role === "user" ? "none" : `1px solid ${colors.border}`, borderRadius: role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "11px 15px", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }),
    chatInput: { display: "flex", gap: 8, padding: "10px 14px", borderTop: `1px solid ${colors.border}`, background: colors.bgCard },
    chatField: { flex: 1, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 20, padding: "10px 16px", color: colors.text, fontFamily: fontSans, fontSize: 14, outline: "none", resize: "none" },
    sendBtn: { width: 42, height: 42, borderRadius: "50%", border: "none", cursor: "pointer", background: colors.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    typing: { display: "flex", gap: 4, padding: "10px 14px", background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "14px 14px 14px 4px", width: "fit-content" },
    dot: (i) => ({ width: 7, height: 7, borderRadius: "50%", background: colors.accent }),
    imgBtnsRow: { display: "flex", gap: 10 },
    dropImg: { border: `2px dashed ${colors.border}`, borderRadius: 10, padding: "22px 14px", textAlign: "center", cursor: "pointer", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 },
    previewImg: { width: "100%", borderRadius: 10, border: `1px solid ${colors.border}`, display: "block" },
    resultCard: { background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 12 },
    productRow: { background: colors.bg, borderRadius: 8, padding: "11px 13px", borderLeft: `3px solid ${colors.accent}` },
    totalBox: { background: colors.accentLight, border: `1px solid ${colors.accent}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" },
  };

  return (
    <div style={st.app}>
      <div style={st.header}>
        <div style={st.headerLeft}>
          <Logo size={34} />
          <div><p style={st.headerTitle}>{businessName}</p><p style={st.headerSub}>Asistente de ventas · MueblesIA</p></div>
        </div>
        <button style={st.logoutBtn} onClick={onLogout}><Icon name="logout" size={15} /></button>
      </div>
      <div style={st.tabs}>
        {[{ id: "catalogo", label: "Catálogo", icon: "layers" }, { id: "chat", label: "Asesor", icon: "message" }, { id: "render", label: "Habitación", icon: "image" }].map((t) => (
          <button key={t.id} style={st.tab(tab === t.id)} onClick={() => setTab(t.id)}><Icon name={t.icon} size={14} />{t.label}</button>
        ))}
      </div>
      <div style={st.body}>
        {tab === "catalogo" && (
          <div style={st.pane}>
            <div style={st.statsRow}>
              <div style={st.stat}><span style={st.statNum}>{providerCount}</span><span style={st.statLabel}>Proveedores</span></div>
              <div style={st.stat}><span style={st.statNum}>{totalProducts}</span><span style={st.statLabel}>Productos</span></div>
              <div style={st.stat}><span style={st.statNum}>{avgPrice ? avgPrice + "€" : "—"}</span><span style={st.statLabel}>Precio medio</span></div>
            </div>
            <div style={st.card}>
              <label style={st.label}>Añadir catálogo de proveedor</label>
              <input style={{ ...st.input, marginBottom: 10 }} placeholder="Nombre del proveedor (opcional)" value={uploadingProvider} onChange={(e) => setUploadingProvider(e.target.value)} />
              <div style={st.dropzone(dragging)} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); handleCatalogFile(e.dataTransfer.files[0]); }} onClick={() => !pdfLoading && fileInputRef.current.click()}>
                {pdfLoading ? <p style={{ margin: 0, color: colors.accent, fontSize: 14 }}>Leyendo PDF…</p> : (<><Icon name="upload" size={26} color={colors.accent} /><p style={{ margin: "8px 0 4px", fontSize: 14, fontWeight: 600 }}>Arrastra o toca para subir</p><p style={{ margin: 0, color: colors.textFaint, fontSize: 12 }}>PDF, .txt, .csv</p></>)}
                <input ref={fileInputRef} type="file" accept=".pdf,.txt,.csv" style={{ display: "none" }} onChange={(e) => handleCatalogFile(e.target.files[0])} />
              </div>
            </div>
            {providers.length > 0 && (
              <div style={st.card}>
                <label style={st.label}>Proveedores cargados</label>
                {providers.map((p) => (
                  <div key={p} style={st.providerTag}>
                    <div><span style={{ fontSize: 14, fontWeight: 600 }}>{p}</span><span style={{ color: colors.textMuted, fontSize: 11.5, marginLeft: 8 }}>{catalog.filter((c) => c.provider === p).length} productos</span></div>
                    <button style={st.btnGhost} onClick={() => removeProvider(p)}><Icon name="trash" size={13} /></button>
                  </div>
                ))}
              </div>
            )}
            {catalog.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: colors.textFaint }}><Icon name="layers" size={32} color={colors.border} /><p style={{ marginTop: 10, fontSize: 13.5 }}>Sube tu primer catálogo para empezar.</p></div>}
          </div>
        )}
        {tab === "chat" && (
          <div style={st.chatPane}>
            <div style={st.messages}>
              {messages.map((m, i) => <div key={i} style={st.msgBubble(m.role)}><div style={st.bubble(m.role)}>{m.content}</div></div>)}
              {loading && <div style={st.msgBubble("assistant")}><div style={st.typing}>{[0, 1, 2].map((i) => <div key={i} style={st.dot(i)} />)}</div></div>}
              <div ref={chatEndRef} />
            </div>
            <div style={st.chatInput}>
              <textarea style={st.chatField} rows={2} placeholder="Ej: cliente busca salón moderno, presupuesto 4.000€…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
              <button style={st.sendBtn} onClick={sendMessage} disabled={loading}><Icon name="send" size={16} color="#fff" /></button>
            </div>
          </div>
        )}
        {tab === "render" && (
          <div style={st.pane}>
            <div style={st.card}>
              <label style={st.label}>Foto de la habitación del cliente</label>
              {!roomImage ? (
                <div style={st.imgBtnsRow}>
                  <div style={st.dropImg} onClick={() => roomFileRef.current.click()}><Icon name="upload" size={24} color={colors.accent} /><p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>Subir foto</p><input ref={roomFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleRoomImage(e.target.files[0])} /></div>
                  <div style={st.dropImg} onClick={() => cameraInputRef.current.click()}><Icon name="camera" size={24} color={colors.accent} /><p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>Usar cámara</p><input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => handleRoomImage(e.target.files[0])} /></div>
                </div>
              ) : (
                <div>
                  <img src={roomImage} alt="Habitación" style={st.previewImg} />
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button style={st.btnGold} onClick={generateRender} disabled={renderLoading}>{renderLoading ? "Analizando…" : "✦ Analizar y proponer"}</button>
                    <button style={st.btnGhost} onClick={() => { setRoomImage(null); setRenderResult(null); }}>Cambiar foto</button>
                  </div>
                </div>
              )}
            </div>
            {renderResult && !renderResult.error && (
              <div style={st.resultCard}>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{renderResult.analisis}</p>
                {renderResult.total > 0 && <div style={st.totalBox}><p style={{ margin: 0, fontSize: 28, color: colors.accentDark, fontFamily: fontSerif, fontWeight: 700 }}>{renderResult.total.toLocaleString("es-ES")} €</p></div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Root() {
  const [screen, setScreen] = useState("landing");
  const [authMode, setAuthMode] = useState("signup");
  const [businessName, setBusinessName] = useState("");
  const goAuth = (mode) => { setAuthMode(mode); setScreen("auth"); };
  const enterApp = (name) => { setBusinessName(name); setScreen("app"); };
  return (
    <>
      <GoogleFonts />
      {screen === "landing" && <Landing onGoAuth={goAuth} />}
      {screen === "auth" && <Auth mode={authMode} setMode={setAuthMode} onEnter={enterApp} onBack={() => setScreen("landing")} />}
      {screen === "app" && <MainApp businessName={businessName} onLogout={() => setScreen("landing")} />}
    </>
  );
}
