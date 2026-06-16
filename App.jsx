import { useState, useRef, useEffect } from "react";

// ============================================================
// PDF.js — extracción de texto en el navegador
// ============================================================
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

// ============================================================
// ESTADO GLOBAL DE CATÁLOGO (simulado en memoria)
// ============================================================
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

// ============================================================
// COMPONENTES UI
// ============================================================
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const icons = {
    upload: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
      </svg>
    ),
    chat: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    image: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    trash: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
      </svg>
    ),
    send: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ),
    package: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    spark: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  };
  return icons[name] || null;
};

// ============================================================
// MAIN APP
// ============================================================
export default function MuebleriaApp() {
  const [tab, setTab] = useState("catalogo");
  const [catalog, setCatalog] = useState([]);
  const [providers, setProviders] = useState([]);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "¡Hola! Soy tu asistente de ventas para la tienda de muebles. Cuéntame qué necesita tu cliente: tipo de habitación, estilo, presupuesto aproximado… y buscaré en el catálogo las mejores opciones.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [roomImage, setRoomImage] = useState(null);
  const [renderLoading, setRenderLoading] = useState(false);
  const [renderResult, setRenderResult] = useState(null);
  const [renderBudget, setRenderBudget] = useState(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const roomFileRef = useRef(null);
  const [uploadingProvider, setUploadingProvider] = useState("");
  const [dragging, setDragging] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── CATÁLOGO ──────────────────────────────────────────────
  const handleCatalogFile = async (file) => {
    if (!file) return;
    const provName = uploadingProvider.trim() || file.name.replace(/\.[^.]+$/, "");
    setPdfLoading(true);
    let text = "";
    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        text = await extractTextFromPdf(file);
      } else {
        text = await file.text();
      }
    } catch {
      setPdfLoading(false);
      alert("No se pudo leer el PDF. Asegúrate de que tiene texto seleccionable (no escaneado).");
      return;
    }
    setPdfLoading(false);
    const products = parseCatalogText(text, provName);
    if (products.length === 0) {
      // Si no detecta precios, guarda el texto completo como contexto
      const genericEntry = {
        id: Date.now(),
        provider: provName,
        description: text.slice(0, 2000),
        price: null,
        raw: text,
        isRaw: true,
      };
      setCatalog((prev) => [...prev, genericEntry]);
      setProviders((prev) =>
        prev.includes(provName) ? prev : [...prev, provName]
      );
    } else {
      setCatalog((prev) => [...prev, ...products]);
      setProviders((prev) =>
        prev.includes(provName) ? prev : [...prev, provName]
      );
    }
    setUploadingProvider("");
  };

  const removeProvider = (name) => {
    setCatalog((prev) => prev.filter((p) => p.provider !== name));
    setProviders((prev) => prev.filter((p) => p !== name));
  };

  // ── CHAT ──────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const catalogContext =
      catalog.length > 0
        ? `\n\nCATÁLOGO DISPONIBLE (${catalog.length} productos):\n` +
          catalog
            .slice(0, 60)
            .map((p) =>
              p.price
                ? `- [${p.provider}] ${p.description} — ${p.price}€`
                : `- [${p.provider}] ${p.description.slice(0, 200)}`
            )
            .join("\n")
        : "\n\nNo hay catálogo cargado aún. Puedes igualmente asesorar al cliente con conocimiento general de muebles.";

    const systemPrompt = `Eres el asistente de ventas de una tienda de muebles familiar española. Tu trabajo es ayudar al vendedor (que habla contigo) a encontrar los mejores muebles del catálogo para su cliente.

Cuando el vendedor describa lo que necesita el cliente:
1. Busca en el catálogo los productos más adecuados (tipo, estilo, precio).
2. Propón entre 3 y 5 opciones concretas con nombre, proveedor y precio si los hay.
3. Sugiere combinaciones coherentes (estilo, color, espacio).
4. Indica el total estimado del presupuesto.
5. Si no hay catálogo, da consejos generales de venta y decoración.

Sé conciso, práctico y orientado a cerrar la venta. Usa formato claro con líneas separadas por producto.${catalogContext}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await response.json();
      const reply =
        data.content?.[0]?.text || "No he podido generar una respuesta.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error al conectar con la IA. Comprueba la conexión.",
        },
      ]);
    }
    setLoading(false);
  };

  // ── RENDER ────────────────────────────────────────────────
  const handleRoomImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setRoomImage(e.target.result);
    reader.readAsDataURL(file);
    setRenderResult(null);
    setRenderBudget(null);
  };

  const generateRender = async () => {
    if (!roomImage) return;
    setRenderLoading(true);
    setRenderResult(null);
    setRenderBudget(null);

    // Extraemos base64
    const base64 = roomImage.split(",")[1];
    const mediaType = roomImage.split(";")[0].split(":")[1];

    const catalogContext =
      catalog.length > 0
        ? catalog
            .slice(0, 40)
            .map((p) =>
              p.price
                ? `- [${p.provider}] ${p.description} — ${p.price}€`
                : `- [${p.provider}] ${p.description.slice(0, 150)}`
            )
            .join("\n")
        : "Sin catálogo cargado.";

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "base64", media_type: mediaType, data: base64 },
                },
                {
                  type: "text",
                  text: `Analiza esta foto de una habitación y, usando el catálogo disponible, propón el mobiliario más adecuado para amueblarla o complementarla.

CATÁLOGO:
${catalogContext}

Responde con este formato exacto en JSON (solo JSON, sin markdown):
{
  "analisis": "descripción breve de la habitación: estilo, tamaño, luz",
  "propuesta": "descripción del ambiente que se crearía con los muebles propuestos",
  "productos": [
    {"nombre": "...", "proveedor": "...", "precio": 000, "motivo": "por qué encaja"}
  ],
  "total": 000,
  "consejo_render": "cómo quedaría visualmente la habitación con estos muebles (descripción cinematográfica para el cliente)"
}`,
                },
              ],
            },
          ],
        }),
      });
      const data = await response.json();
      const raw = data.content?.[0]?.text || "{}";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setRenderResult(parsed);
      setRenderBudget(parsed.total || null);
    } catch {
      setRenderResult({ error: "No se pudo analizar la imagen. Inténtalo de nuevo." });
    }
    setRenderLoading(false);
  };

  // ── ESTILOS ───────────────────────────────────────────────
  const st = {
    app: {
      fontFamily: "'Georgia', 'Times New Roman', serif",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a1209 0%, #2d1f0a 50%, #1a1209 100%)",
      color: "#f0e6d0",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      padding: "20px 24px 16px",
      borderBottom: "1px solid rgba(205,160,80,0.25)",
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    logo: {
      width: 40, height: 40,
      background: "linear-gradient(135deg, #c8972a, #e8c060)",
      borderRadius: 4,
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    headerTitle: { margin: 0, fontSize: 20, fontWeight: "normal", letterSpacing: "0.05em", color: "#e8c878" },
    headerSub: { margin: 0, fontSize: 11, color: "#9a8060", letterSpacing: "0.12em", textTransform: "uppercase" },
    tabs: {
      display: "flex", borderBottom: "1px solid rgba(205,160,80,0.2)",
      background: "rgba(0,0,0,0.2)",
    },
    tab: (active) => ({
      flex: 1, padding: "14px 8px", border: "none", cursor: "pointer",
      background: active ? "rgba(200,150,40,0.15)" : "transparent",
      color: active ? "#e8c060" : "#7a6a50",
      borderBottom: active ? "2px solid #c8972a" : "2px solid transparent",
      fontFamily: "inherit", fontSize: 12, letterSpacing: "0.1em",
      textTransform: "uppercase", transition: "all 0.2s",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    }),
    body: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },

    // Catálogo
    catalogPane: { padding: 20, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" },
    card: {
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(205,160,80,0.2)",
      borderRadius: 8, padding: 16,
    },
    label: { display: "block", fontSize: 11, color: "#c8a050", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 },
    input: {
      width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(205,160,80,0.3)",
      borderRadius: 6, padding: "10px 12px", color: "#f0e6d0", fontFamily: "inherit",
      fontSize: 14, boxSizing: "border-box", outline: "none",
    },
    dropzone: (drag) => ({
      border: `2px dashed ${drag ? "#c8972a" : "rgba(205,160,80,0.3)"}`,
      borderRadius: 8, padding: "28px 16px", textAlign: "center", cursor: "pointer",
      background: drag ? "rgba(200,150,40,0.08)" : "transparent",
      transition: "all 0.2s",
    }),
    btnGold: {
      background: "linear-gradient(135deg, #c8972a, #e8c060)", color: "#1a1209",
      border: "none", borderRadius: 6, padding: "10px 20px", cursor: "pointer",
      fontFamily: "inherit", fontSize: 13, fontWeight: "bold", letterSpacing: "0.05em",
    },
    btnGhost: {
      background: "transparent", color: "#c8a050", border: "1px solid rgba(205,160,80,0.4)",
      borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", fontSize: 12,
    },
    providerTag: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "rgba(200,150,40,0.1)", border: "1px solid rgba(205,160,80,0.3)",
      borderRadius: 6, padding: "8px 12px", marginBottom: 6,
    },
    statsRow: { display: "flex", gap: 12, flexWrap: "wrap" },
    stat: {
      flex: 1, minWidth: 80, background: "rgba(0,0,0,0.3)", borderRadius: 6,
      padding: "10px 12px", textAlign: "center",
    },
    statNum: { fontSize: 22, color: "#e8c060", display: "block" },
    statLabel: { fontSize: 10, color: "#7a6a50", textTransform: "uppercase", letterSpacing: "0.1em" },

    // Chat
    chatPane: { display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" },
    messages: { flex: 1, overflowY: "auto", padding: "16px 16px 8px" },
    msgBubble: (role) => ({
      display: "flex", justifyContent: role === "user" ? "flex-end" : "flex-start",
      marginBottom: 12,
    }),
    bubble: (role) => ({
      maxWidth: "82%",
      background: role === "user"
        ? "linear-gradient(135deg, #c8972a, #e8c060)"
        : "rgba(255,255,255,0.06)",
      color: role === "user" ? "#1a1209" : "#f0e6d0",
      border: role === "user" ? "none" : "1px solid rgba(205,160,80,0.2)",
      borderRadius: role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
      padding: "10px 14px", fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap",
    }),
    chatInput: {
      display: "flex", gap: 8, padding: "10px 14px",
      borderTop: "1px solid rgba(205,160,80,0.2)", background: "rgba(0,0,0,0.2)",
    },
    chatField: {
      flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(205,160,80,0.25)",
      borderRadius: 20, padding: "10px 16px", color: "#f0e6d0", fontFamily: "inherit",
      fontSize: 14, outline: "none", resize: "none",
    },
    sendBtn: {
      width: 42, height: 42, borderRadius: "50%", border: "none", cursor: "pointer",
      background: "linear-gradient(135deg, #c8972a, #e8c060)",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    typing: {
      display: "flex", gap: 4, padding: "10px 14px",
      background: "rgba(255,255,255,0.06)", borderRadius: "16px 16px 16px 4px",
      width: "fit-content",
    },
    dot: (i) => ({
      width: 7, height: 7, borderRadius: "50%", background: "#c8972a",
      animation: `bounce 1.2s ${i * 0.2}s infinite`,
    }),

    // Render
    renderPane: { padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 },
    dropImg: (drag) => ({
      border: `2px dashed ${drag ? "#c8972a" : "rgba(205,160,80,0.3)"}`,
      borderRadius: 10, padding: "24px 16px", textAlign: "center", cursor: "pointer",
      background: drag ? "rgba(200,150,40,0.08)" : "rgba(255,255,255,0.02)",
      transition: "all 0.2s",
    }),
    previewImg: { width: "100%", borderRadius: 8, border: "1px solid rgba(205,160,80,0.3)", display: "block" },
    resultCard: {
      background: "rgba(200,150,40,0.07)", border: "1px solid rgba(205,160,80,0.3)",
      borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 10,
    },
    productRow: {
      background: "rgba(0,0,0,0.25)", borderRadius: 6, padding: "10px 12px",
      borderLeft: "3px solid #c8972a",
    },
    totalBox: {
      background: "linear-gradient(135deg, rgba(200,150,40,0.2), rgba(232,192,96,0.1))",
      border: "1px solid #c8972a", borderRadius: 8, padding: "12px 16px",
      textAlign: "center",
    },
  };

  const totalProducts = catalog.length;
  const providerCount = providers.length;
  const avgPrice = catalog.filter((p) => p.price).length
    ? Math.round(catalog.filter((p) => p.price).reduce((a, b) => a + b.price, 0) / catalog.filter((p) => p.price).length)
    : 0;

  return (
    <div style={st.app}>
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        textarea:focus { border-color: rgba(205,160,80,0.6) !important; }
        input:focus { border-color: rgba(205,160,80,0.6) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(205,160,80,0.3); border-radius: 2px; }
      `}</style>

      {/* HEADER */}
      <div style={st.header}>
        <div style={st.logo}><Icon name="package" size={20} color="#1a1209" /></div>
        <div>
          <p style={st.headerTitle}>Asistente de Ventas</p>
          <p style={st.headerSub}>Muebles · Catálogo · Presupuesto</p>
        </div>
      </div>

      {/* TABS */}
      <div style={st.tabs}>
        {[
          { id: "catalogo", label: "Catálogo", icon: "package" },
          { id: "chat", label: "Asesor", icon: "spark" },
          { id: "render", label: "Visualizar", icon: "image" },
        ].map((t) => (
          <button key={t.id} style={st.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* BODY */}
      <div style={st.body}>

        {/* ── TAB: CATÁLOGO ── */}
        {tab === "catalogo" && (
          <div style={st.catalogPane}>
            {/* Stats */}
            <div style={st.statsRow}>
              {[
                { num: providerCount, label: "Proveedores" },
                { num: totalProducts, label: "Productos" },
                { num: avgPrice ? avgPrice + "€" : "—", label: "Precio medio" },
              ].map((s) => (
                <div key={s.label} style={st.stat}>
                  <span style={st.statNum}>{s.num}</span>
                  <span style={st.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Upload */}
            <div style={st.card}>
              <label style={st.label}>Añadir catálogo de proveedor</label>
              <input
                style={{ ...st.input, marginBottom: 10 }}
                placeholder="Nombre del proveedor (opcional)"
                value={uploadingProvider}
                onChange={(e) => setUploadingProvider(e.target.value)}
              />
              <div
                style={st.dropzone(dragging)}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragging(false);
                  handleCatalogFile(e.dataTransfer.files[0]);
                }}
                onClick={() => !pdfLoading && fileInputRef.current.click()}
              >
                {pdfLoading ? (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>◌</div>
                    <p style={{ margin: 0, color: "#c8a050", fontSize: 14 }}>Leyendo PDF…</p>
                    <p style={{ margin: "4px 0 0", color: "#5a4a30", fontSize: 12 }}>Extrayendo productos y precios</p>
                  </>
                ) : (
                  <>
                    <Icon name="upload" size={28} color="#c8a050" />
                    <p style={{ margin: "8px 0 4px", color: "#c8a050", fontSize: 14 }}>
                      Arrastra o toca para subir
                    </p>
                    <p style={{ margin: 0, color: "#5a4a30", fontSize: 12 }}>
                      PDF, .txt, .csv
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef} type="file" accept=".pdf,.txt,.csv"
                  style={{ display: "none" }}
                  onChange={(e) => handleCatalogFile(e.target.files[0])}
                />
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 11, color: "#5a4a30" }}>
                💡 El PDF debe tener texto seleccionable (no escaneado). También acepta .txt y .csv con formato "Producto 150€"
              </p>
            </div>

            {/* Provider list */}
            {providers.length > 0 && (
              <div style={st.card}>
                <label style={st.label}>Proveedores cargados</label>
                {providers.map((p) => (
                  <div key={p} style={st.providerTag}>
                    <div>
                      <span style={{ color: "#e8c060", fontSize: 14 }}>{p}</span>
                      <span style={{ color: "#7a6a50", fontSize: 11, marginLeft: 8 }}>
                        {catalog.filter((c) => c.provider === p).length} productos
                      </span>
                    </div>
                    <button style={st.btnGhost} onClick={() => removeProvider(p)}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Sample products */}
            {catalog.length > 0 && (
              <div style={st.card}>
                <label style={st.label}>Últimos productos detectados</label>
                {catalog.slice(-5).reverse().map((p, i) => (
                  <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid rgba(205,160,80,0.1)", fontSize: 13 }}>
                    <span style={{ color: "#c8a050", fontSize: 11 }}>[{p.provider}] </span>
                    <span style={{ color: "#d0c0a0" }}>{p.description.slice(0, 80)}</span>
                    {p.price && <span style={{ color: "#e8c060", float: "right" }}>{p.price}€</span>}
                  </div>
                ))}
              </div>
            )}

            {catalog.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#5a4a30" }}>
                <Icon name="package" size={36} color="#3a2a10" />
                <p style={{ marginTop: 10, fontSize: 13 }}>
                  Sube tu primer catálogo para empezar.<br />
                  El asesor funcionará incluso sin catálogo.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: CHAT ── */}
        {tab === "chat" && (
          <div style={st.chatPane}>
            <div style={st.messages}>
              {messages.map((m, i) => (
                <div key={i} style={st.msgBubble(m.role)}>
                  <div style={st.bubble(m.role)}>{m.content}</div>
                </div>
              ))}
              {loading && (
                <div style={st.msgBubble("assistant")}>
                  <div style={st.typing}>
                    {[0, 1, 2].map((i) => <div key={i} style={st.dot(i)} />)}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={st.chatInput}>
              <textarea
                style={st.chatField}
                rows={2}
                placeholder="Ej: cliente busca salón moderno para 20m², presupuesto 4.000€…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
              />
              <button style={st.sendBtn} onClick={sendMessage} disabled={loading}>
                <Icon name="send" size={16} color="#1a1209" />
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: RENDER ── */}
        {tab === "render" && (
          <div style={st.renderPane}>
            <div style={st.card}>
              <label style={st.label}>Foto de la habitación del cliente</label>
              {!roomImage ? (
                <div
                  style={st.dropImg(false)}
                  onClick={() => roomFileRef.current.click()}
                >
                  <Icon name="image" size={32} color="#c8a050" />
                  <p style={{ margin: "8px 0 4px", color: "#c8a050", fontSize: 14 }}>
                    Toca para subir la foto
                  </p>
                  <p style={{ margin: 0, color: "#5a4a30", fontSize: 12 }}>JPG, PNG, WEBP</p>
                  <input
                    ref={roomFileRef} type="file" accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleRoomImage(e.target.files[0])}
                  />
                </div>
              ) : (
                <div>
                  <img src={roomImage} alt="Habitación" style={st.previewImg} />
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button style={st.btnGold} onClick={generateRender} disabled={renderLoading}>
                      {renderLoading ? "Analizando…" : "✦ Analizar y proponer"}
                    </button>
                    <button style={st.btnGhost} onClick={() => { setRoomImage(null); setRenderResult(null); }}>
                      Cambiar foto
                    </button>
                  </div>
                </div>
              )}
            </div>

            {renderLoading && (
              <div style={{ textAlign: "center", padding: 20, color: "#c8a050" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>◌</div>
                <p style={{ margin: 0, fontSize: 13 }}>Analizando la habitación y cruzando con el catálogo…</p>
              </div>
            )}

            {renderResult && !renderResult.error && (
              <div style={st.resultCard}>
                {/* Análisis */}
                <div>
                  <p style={{ margin: "0 0 4px", color: "#c8a050", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Análisis de la habitación</p>
                  <p style={{ margin: 0, fontSize: 13.5, color: "#d0c0a0", lineHeight: 1.6 }}>{renderResult.analisis}</p>
                </div>

                {/* Propuesta */}
                <div>
                  <p style={{ margin: "0 0 4px", color: "#c8a050", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Propuesta de ambiente</p>
                  <p style={{ margin: 0, fontSize: 13.5, color: "#d0c0a0", lineHeight: 1.6 }}>{renderResult.propuesta}</p>
                </div>

                {/* Productos */}
                {renderResult.productos?.length > 0 && (
                  <div>
                    <p style={{ margin: "0 0 8px", color: "#c8a050", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Mobiliario sugerido</p>
                    {renderResult.productos.map((p, i) => (
                      <div key={i} style={{ ...st.productRow, marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ color: "#e8c060", fontSize: 14 }}>{p.nombre}</span>
                          {p.precio > 0 && <span style={{ color: "#c8a050", fontSize: 14 }}>{p.precio}€</span>}
                        </div>
                        <div style={{ color: "#7a6a50", fontSize: 11 }}>{p.proveedor} · {p.motivo}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                {renderResult.total > 0 && (
                  <div style={st.totalBox}>
                    <p style={{ margin: "0 0 2px", fontSize: 11, color: "#9a8060", textTransform: "uppercase", letterSpacing: "0.1em" }}>Presupuesto total estimado</p>
                    <p style={{ margin: 0, fontSize: 28, color: "#e8c060" }}>{renderResult.total.toLocaleString("es-ES")} €</p>
                  </div>
                )}

                {/* Descripción render */}
                {renderResult.consejo_render && (
                  <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: 12 }}>
                    <p style={{ margin: "0 0 4px", color: "#c8a050", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Cómo quedará la habitación</p>
                    <p style={{ margin: 0, fontSize: 13, color: "#b0a080", lineHeight: 1.7, fontStyle: "italic" }}>"{renderResult.consejo_render}"</p>
                  </div>
                )}

                <button style={{ ...st.btnGhost, alignSelf: "flex-start" }} onClick={() => { setRoomImage(null); setRenderResult(null); }}>
                  Nueva habitación
                </button>
              </div>
            )}

            {renderResult?.error && (
              <div style={{ ...st.card, color: "#c85050" }}>{renderResult.error}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
