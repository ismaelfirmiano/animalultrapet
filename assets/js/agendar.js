/* Fluxo de agendamento (demonstração) — GSAP timelines */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const D = reduce ? 0 : 1; // multiplicador de duração

  // Valores de EXEMPLO (a loja define os reais)
  const PRECOS = {
    banho:      { pequeno: 45, medio: 55, grande: 70, gato: 60 },
    banhotosa:  { pequeno: 65, medio: 80, grande: 100, gato: 90 }
  };
  const NOMES = { banho: "Banho", banhotosa: "Banho e tosa" };
  const PORTES = { pequeno: "Cão pequeno", medio: "Cão médio", grande: "Cão grande", gato: "Gato" };
  const EXTRAS = { hidratacao: ["Hidratação", 20], unhas: ["Corte de unhas", 10], levatraz: ["Leva e traz", 15] };

  const st = { etapa: 1, servico: "banhotosa", porte: "pequeno", extras: [], dia: null, hora: null, modo: "convidado", pag: "pix" };
  const params = new URLSearchParams(location.search);
  if (params.get("servico") && PRECOS[params.get("servico")]) st.servico = params.get("servico");

  const total = () => PRECOS[st.servico][st.porte] + st.extras.reduce((s, k) => s + EXTRAS[k][1], 0);

  /* ---------- Etapa 1: serviço ---------- */
  $$('input[name="servico"]').forEach((i) => { i.checked = i.value === st.servico; i.addEventListener("change", () => { st.servico = i.value; atualizaPrecos(); }); });
  $$('input[name="porte"]').forEach((i) => { i.checked = i.value === st.porte; i.addEventListener("change", () => { st.porte = i.value; atualizaPrecos(); }); });
  $$('input[name="extra"]').forEach((i) => i.addEventListener("change", () => { st.extras = $$('input[name="extra"]:checked').map((x) => x.value); atualizaPrecos(); }));
  function atualizaPrecos() {
    $$("[data-preco-servico]").forEach((el) => { el.textContent = "a partir de " + brl(PRECOS[el.dataset.precoServico][st.porte]); });
    $$("[data-total]").forEach((el) => {
      const novo = total();
      const obj = { v: parseFloat(el.dataset.v || novo) };
      gsap.to(obj, { v: novo, duration: 0.4 * D, ease: "power2.out", onUpdate: () => (el.textContent = brl(Math.round(obj.v))) });
      el.dataset.v = novo;
    });
  }

  /* ---------- Etapa 2: data e hora ---------- */
  const DIAS_SEM = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const HORAS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
  function seed(n) { let x = Math.sin(n) * 10000; return x - Math.floor(x); }
  const diasBox = $("#dias");
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const dias = [];
  for (let i = 1; dias.length < 12 && i < 30; i++) {
    const d = new Date(hoje); d.setDate(hoje.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 1) continue; // fechado dom e seg
    dias.push(d);
  }
  dias.forEach((d, idx) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "dia";
    b.innerHTML = `<span>${DIAS_SEM[d.getDay()]}</span><b>${d.getDate()}</b><span>${MESES[d.getMonth()]}</span>`;
    b.setAttribute("aria-label", d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }));
    b.addEventListener("click", () => selDia(d, b));
    diasBox.appendChild(b);
    if (idx === 0) selDia(d, b, true);
  });
  function selDia(d, b, silent) {
    st.dia = d; st.hora = null;
    $$(".dia").forEach((x) => x.classList.toggle("sel", x === b));
    const box = $("#horas"); box.innerHTML = "";
    HORAS.forEach((h, i) => {
      const hb = document.createElement("button");
      hb.type = "button"; hb.className = "hora"; hb.textContent = h;
      const ocupado = seed(d.getDate() * 31 + i * 7 + d.getMonth()) < 0.33 || (d.getDay() === 6 && i > 6);
      if (ocupado) { hb.disabled = true; hb.title = "Horário ocupado"; }
      hb.addEventListener("click", () => { st.hora = h; $$(".hora").forEach((x) => x.classList.toggle("sel", x === hb)); gsap.fromTo(hb, { scale: 0.9 }, { scale: 1, duration: 0.35 * D, ease: "back.out(3)" }); validar(); });
      box.appendChild(hb);
    });
    if (!silent) gsap.from("#horas .hora", { y: 10, autoAlpha: 0, stagger: 0.03, duration: 0.35 * D });
    validar();
  }

  /* ---------- Etapa 3: identificação ---------- */
  const abas = $$(".abas button");
  abas.forEach((a, i) => a.addEventListener("click", () => {
    st.modo = a.dataset.modo;
    abas.forEach((x) => x.classList.toggle("on", x === a));
    gsap.to(".abas .ind", { xPercent: i * 100, duration: 0.35 * D, ease: "power3.inOut" });
    $$("[data-painel]").forEach((p) => (p.hidden = p.dataset.painel !== st.modo));
    gsap.from(`[data-painel="${st.modo}"]`, { autoAlpha: 0, y: 10, duration: 0.3 * D });
    validar();
  }));
  $$("#form-convidado input, #form-login input").forEach((i) => i.addEventListener("input", validar));
  $("#fone").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    e.target.value = v;
  });
  $("#btn-entrar-demo").addEventListener("click", () => {
    $("#lg-email").value = "cliente@exemplo.com"; $("#lg-senha").value = "••••••••";
    $("#nome").value = "Cliente Exemplo"; $("#pet").value = "Thor";
    toast("Login de demonstração preenchido"); validar();
  });

  /* ---------- Etapa 4: pagamento ---------- */
  $$('input[name="pag"]').forEach((i) => i.addEventListener("change", () => {
    st.pag = i.value;
    $("#pg-pix").hidden = st.pag !== "pix";
    $("#pg-cartao").hidden = st.pag === "pix";
    $(".cartao .tipo").textContent = st.pag === "credito" ? "Crédito" : "Débito";
    const lbl = st.pag === "pix" ? "Gerar Pix de " : "Pagar ";
    $("#btn-pagar .lbl").textContent = lbl;
    gsap.from(st.pag === "pix" ? "#pg-pix" : "#pg-cartao", { autoAlpha: 0, y: 12, duration: 0.35 * D });
    validar();
  }));
  // pré-visualização do cartão
  $("#cc-num").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 16);
    e.target.value = v.replace(/(.{4})/g, "$1 ").trim();
    $(".cartao .num").textContent = (e.target.value + " •••• •••• •••• ••••").slice(0, 19);
    validar();
  });
  $("#cc-nome").addEventListener("input", (e) => { $(".cartao .nm").textContent = e.target.value.toUpperCase() || "NOME NO CARTÃO"; validar(); });
  $("#cc-val").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
    e.target.value = v; $(".cartao .vl").textContent = v || "MM/AA"; validar();
  });
  $("#cc-cvv").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4); validar(); });
  $("#btn-teste").addEventListener("click", () => {
    const set = (id, v) => { const el = $(id); el.value = v; el.dispatchEvent(new Event("input")); };
    set("#cc-num", "4111111111111111"); set("#cc-nome", "Cliente Exemplo"); set("#cc-val", "1230"); set("#cc-cvv", "123");
    gsap.fromTo(".cartao", { rotationY: -14 }, { rotationY: 0, duration: 0.8 * D, ease: "elastic.out(1,0.5)" });
  });

  /* ---------- Navegação entre etapas ---------- */
  const TITULOS = ["Escolha o serviço", "Escolha data e horário", "Seus dados", "Pagamento antecipado", "Agendado!"];
  function validar() {
    const ok = {
      1: !!st.servico && !!st.porte,
      2: !!st.dia && !!st.hora,
      3: st.modo === "convidado"
        ? $("#nome").value.trim().length > 1 && $("#fone").value.replace(/\D/g, "").length >= 10 && $("#pet").value.trim().length > 0
        : $("#lg-email").value.includes("@") && $("#lg-senha").value.length >= 4,
      4: st.pag === "pix" || ($("#cc-num").value.replace(/\D/g, "").length === 16 && $("#cc-nome").value.trim().length > 2 && $("#cc-val").value.length === 5 && $("#cc-cvv").value.length >= 3)
    };
    const btn = $("#btn-prox");
    if (btn) btn.disabled = !ok[st.etapa];
    $("#btn-pagar").disabled = !ok[4];
    return ok[st.etapa];
  }
  function irPara(n, dir = 1) {
    const atual = $(`.etapa[data-n="${st.etapa}"]`);
    const prox = $(`.etapa[data-n="${n}"]`);
    if (n === 4) montaResumo();
    const tl = gsap.timeline({ defaults: { duration: 0.35 * D, ease: "power3.inOut" } });
    tl.to(atual, { x: -40 * dir, autoAlpha: 0 })
      .add(() => { atual.classList.remove("ativa"); prox.classList.add("ativa"); gsap.set(prox, { x: 40 * dir, autoAlpha: 0 }); window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); })
      .to(prox, { x: 0, autoAlpha: 1 })
      .from(prox.querySelectorAll(".card"), { y: 16, autoAlpha: 0, stagger: 0.06 }, "<");
    st.etapa = n;
    gsap.to(".progresso i", { scaleX: n / 5, duration: 0.6 * D, ease: "power3.out" });
    $$(".etapas-txt span").forEach((s, i) => s.classList.toggle("ok", i < n));
    $("#titulo-etapa").textContent = TITULOS[n - 1];
    $("#passo-n").textContent = `Etapa ${Math.min(n, 4)} de 4`;
    $("#rodape-nav").style.display = n >= 4 ? "none" : "flex";
    $("#btn-voltar").hidden = n === 1 || n === 5;
    validar();
  }
  $("#btn-prox").addEventListener("click", () => { if (validar()) irPara(st.etapa + 1); });
  $("#btn-voltar").addEventListener("click", () => { if (st.etapa > 1 && st.etapa < 5) irPara(st.etapa - 1, -1); });

  function dataLonga() { return st.dia.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }); }
  function montaResumo() {
    const linhas = [
      ["Serviço", `${NOMES[st.servico]} · ${PORTES[st.porte]}`, brl(PRECOS[st.servico][st.porte])],
      ...st.extras.map((k) => [EXTRAS[k][0], "", "+ " + brl(EXTRAS[k][1])]),
      ["Quando", `${dataLonga()} às ${st.hora}`, ""],
      ["Pet", st.modo === "convidado" ? $("#pet").value : "Thor", ""]
    ];
    $("#resumo").innerHTML = linhas.map(([a, b, c]) => `<div class="l"><span>${a}${b ? `<br><b>${b}</b>` : ""}</span><b>${c}</b></div>`).join("") +
      `<div class="l tot"><span>Total a pagar agora</span><b data-total data-v="${total()}">${brl(total())}</b></div>`;
    $("#btn-pagar .val").textContent = brl(total());
  }

  /* ---------- Pagamento + animação do botão ---------- */
  function qrSVG(txt) {
    const n = 25; let h = 0; for (const c of txt) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    let rects = "";
    const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#16231B"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#16231B"/>`;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if ((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) continue;
      h = (h * 1103515245 + 12345) >>> 0;
      if ((h >>> 16) % 2) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="#16231B"/>`;
    }
    return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" aria-label="QR Code Pix de demonstração">${rects}${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`;
  }
  let timerInt;
  const btn = $("#btn-pagar");
  function morph(estado) {
    const tl = gsap.timeline({ defaults: { duration: 0.3 * D } });
    if (estado === "carregando") {
      tl.to(btn.querySelector(".txt"), { autoAlpha: 0, y: -10 })
        .to(btn, { width: 56, paddingLeft: 0, paddingRight: 0, duration: 0.4 * D, ease: "power3.inOut" }, "<")
        .to(btn.querySelector(".spin"), { autoAlpha: 1 })
        .to(btn.querySelector(".spin i"), { rotation: 360, repeat: -1, ease: "none", duration: 0.8 }, "<");
    }
    if (estado === "agendado") {
      tl.to(btn.querySelector(".spin"), { autoAlpha: 0, duration: 0.2 * D })
        .to(btn, { backgroundColor: "#12A150", scale: 1.06, duration: 0.25 * D })
        .to(btn, { width: "100%", scale: 1, duration: 0.5 * D, ease: "power3.inOut" })
        .to(btn.querySelector(".check"), { autoAlpha: 1, duration: 0.2 * D }, "<0.1")
        .to(btn.querySelector(".check path"), { strokeDashoffset: 0, duration: 0.45 * D, ease: "power2.out" }, "<")
        .to(btn.querySelector(".check .ok-txt"), { autoAlpha: 1, x: 0, duration: 0.3 * D }, "<0.2");
    }
    return tl;
  }
  btn.addEventListener("click", () => {
    btn.disabled = true;
    gsap.set(btn, { width: btn.offsetWidth });
    morph("carregando");
    if (st.pag === "pix") {
      const codigo = "00020126580014BR.GOV.BCB.PIX0136demo-animalultrapet-" + Math.random().toString(36).slice(2, 10) + "5204000053039865802BR5915AURORA ANIMAL6007NITEROI";
      $("#qr").innerHTML = qrSVG(codigo) + '<span class="scan"></span>';
      $("#pix-copia").value = codigo;
      gsap.delayedCall(0.6 * D, () => {
        $("#pix-area").hidden = false;
        gsap.from("#pix-area", { autoAlpha: 0, y: 16, duration: 0.45 * D });
        gsap.to("#qr .scan", { y: 170, duration: 1.4, ease: "sine.inOut", repeat: -1, yoyo: true });
        gsap.to(".pontos i", { y: -5, stagger: { each: 0.15, repeat: -1, yoyo: true }, duration: 0.35, ease: "sine.inOut" });
        let s = 600; clearInterval(timerInt);
        timerInt = setInterval(() => { s--; $("#timer").textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; if (s <= 0) clearInterval(timerInt); }, 1000);
        $("#pix-area").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      });
      // Demonstração: confirma automaticamente após alguns segundos
      gsap.delayedCall(7, pagamentoAprovado);
    } else {
      $("#processando").hidden = false;
      gsap.from("#processando", { autoAlpha: 0, y: 8, duration: 0.3 * D });
      gsap.delayedCall(2.4, pagamentoAprovado);
    }
  });
  $("#btn-ja-paguei").addEventListener("click", () => { gsap.killTweensOf(pagamentoAprovado); pagamentoAprovado(); });
  $("#btn-copiar").addEventListener("click", () => { const i = $("#pix-copia"); i.select(); try { navigator.clipboard.writeText(i.value); } catch (e) {} toast("Código Pix copiado"); });

  let aprovado = false;
  function pagamentoAprovado() {
    if (aprovado) return; aprovado = true;
    clearInterval(timerInt);
    gsap.killTweensOf("#qr .scan"); gsap.killTweensOf(".pontos i");
    const ag = $("#pix-area:not([hidden]) .aguardando") || $("#processando");
    if (ag) { ag.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#12A150" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg> Pagamento confirmado!'; ag.style.background = "#E3F3EA"; gsap.from(ag, { scale: 0.92, duration: 0.4 * D, ease: "back.out(3)" }); }
    morph("agendado").add(() => { gsap.delayedCall(0.9 * D, mostrarSucesso); });
  }

  function codigoReserva() { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 4; i++) s += c[Math.floor(Math.random() * c.length)]; return "AUR-" + s; }
  function mostrarSucesso() {
    const cod = codigoReserva();
    $("#cod").textContent = cod;
    $("#suc-quando").textContent = `${dataLonga()} às ${st.hora}`;
    $("#suc-serv").textContent = `${NOMES[st.servico]} · ${PORTES[st.porte]}`;
    $("#suc-total").textContent = brl(total()) + (st.pag === "pix" ? " via Pix" : st.pag === "credito" ? " no crédito" : " no débito");
    const msg = encodeURIComponent(`Olá! Acabei de agendar pelo app: ${NOMES[st.servico]} (${PORTES[st.porte]}) em ${dataLonga()} às ${st.hora}. Código ${cod}.`);
    $("#suc-wa").href = `https://wa.me/5521985891616?text=${msg}`;
    $("#suc-ics").onclick = () => baixarICS(cod);
    irPara(5);
    const tl = gsap.timeline({ delay: 0.35 * D });
    tl.from(".selo", { scale: 0, rotation: -90, duration: 0.6 * D, ease: "back.out(2)" })
      .to(".selo svg path", { strokeDashoffset: 0, duration: 0.5 * D, ease: "power2.out" })
      .fromTo(".anel", { scale: 0.8, autoAlpha: 0.9 }, { scale: 1.6, autoAlpha: 0, duration: 0.9 * D, ease: "power2.out" }, "<")
      .from(".sucesso h2, .sucesso > p", { y: 14, autoAlpha: 0, stagger: 0.1 }, "-=0.6")
      .from(".codigo", { scale: 0.7, autoAlpha: 0, ease: "back.out(2.5)" }, "-=0.2")
      .from(".acoes-final > *", { y: 12, autoAlpha: 0, stagger: 0.08 }, "-=0.2");
    if (!reduce) confete();
  }
  function confete() {
    const box = document.createElement("div"); box.className = "confete"; document.body.appendChild(box);
    const cores = ["#12A150", "#E53935", "#FFC83D", "#0B6E3A"];
    const pata = (c) => `<svg viewBox="0 0 24 24" fill="${c}"><ellipse cx="12" cy="16" rx="5" ry="4.2"/><circle cx="6" cy="10" r="2.2"/><circle cx="10" cy="6.5" r="2.2"/><circle cx="14" cy="6.5" r="2.2"/><circle cx="18" cy="10" r="2.2"/></svg>`;
    for (let i = 0; i < 34; i++) { const el = document.createElement("i"); el.innerHTML = pata(cores[i % 4]); el.style.left = Math.random() * 100 + "vw"; box.appendChild(el); }
    gsap.to(box.children, {
      y: () => window.innerHeight + 80, x: () => gsap.utils.random(-80, 80), rotation: () => gsap.utils.random(-360, 360),
      duration: () => gsap.utils.random(1.8, 3.2), ease: "power1.in", stagger: 0.03, onComplete: () => box.remove()
    });
  }
  function baixarICS(cod) {
    const [h, m] = st.hora.split(":").map(Number);
    const ini = new Date(st.dia); ini.setHours(h, m, 0);
    const fim = new Date(ini.getTime() + 90 * 60000);
    const f = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Animal UltraPet//Agendamento//PT", "BEGIN:VEVENT", `UID:${cod}@animalultrapet`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(ini)}`, `DTEND:${f(fim)}`, `SUMMARY:${NOMES[st.servico]} - Aurora Animal UltraPet`, "LOCATION:Tv. Alberto Vítor, 15 - Centro, Niterói - RJ", `DESCRIPTION:Código ${cod}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = `agendamento-${cod}.ics`; a.click();
  }

  atualizaPrecos();
  validar();
  gsap.from(".app-head, .progresso, .etapas-txt, .etapa.ativa .card", { y: 18, autoAlpha: 0, stagger: 0.07, duration: 0.6 * D });
})();
