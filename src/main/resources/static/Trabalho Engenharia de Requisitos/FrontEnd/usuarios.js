
const AVATAR_CORES = ["av0","av1","av2","av3","av4","av5","av6","av7"];

const TIPO_NOMES   = { aluno:"Aluno", professor:"Professor", funcionario:"Funcionário" };
const STATUS_NOMES = { ativo:"Ativo", bloqueado:"Bloqueado" };

let usuarios = [];

const HISTORICO = {};

let proximoId    = 9;
let editandoId   = null;
let bloqueandoId = null;
let filtros      = { busca:"", status:"", tipo:"" };
let modoView     = "cards";


function iniciais(nome) {
  return nome.split(" ").slice(0,2).map(p => p[0].toUpperCase()).join("");
}
function avCor(id) { return AVATAR_CORES[(id - 1) % AVATAR_CORES.length]; }

function dataLocal(iso) {
  if (!iso) return null;
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function isoHoje() {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${hoje.getFullYear()}-${mes}-${dia}`;
}

function diasAte(iso) {
  const hoje = dataLocal(isoHoje());
  const data = dataLocal(iso);
  if (!data) return null;
  return Math.ceil((data - hoje) / 86400000);
}

function fmtData(iso) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function cumprimentoAtual() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function emprestimosProximosUsuario(usuarioId) {
  return (HISTORICO[usuarioId] || []).filter(h => {
    const dias = diasAte(h.dataDevIso);
    return h.status === "ativo" && dias !== null && dias >= 0 && dias <= 3;
  });
}

function telefoneWhatsapp(telefone) {
  const digitos = String(telefone || "").replace(/\D/g, "");
  const nacional = digitos.startsWith("55") ? digitos.slice(2) : digitos;
  if (!/^\d{10,11}$/.test(nacional)) return "";
  if (nacional.length === 11 && nacional[2] !== "9") return "";
  return digitos.startsWith("55") ? digitos : `55${nacional}`;
}

function montarLinkWhatsapp(usuario, emprestimo) {
  const numero = telefoneWhatsapp(usuario.telefone);
  const dias = diasAte(emprestimo.dataDevIso);
  const prazo = dias === 0 ? "vence hoje" : `vence em ${dias} dia${dias > 1 ? "s" : ""}`;
  const mensagem = `${cumprimentoAtual()}, ${usuario.nome}. O livro "${emprestimo.livro}" esta proximo do prazo de devolucao: ${prazo}, em ${emprestimo.devolucao}.`;
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}` : "";
}

function enviarAvisoWhatsapp(usuarioId) {
  const usuario = usuarios.find(u => u.id === usuarioId);
  if (!usuario) return;

  const emprestimo = emprestimosProximosUsuario(usuarioId)[0];
  if (!emprestimo) {
    mostrarToast("Nenhum empréstimo próximo do prazo para este usuário.", "warn");
    return;
  }

  const link = montarLinkWhatsapp(usuario, emprestimo);
  if (!link) {
    mostrarToast("Usuário sem telefone cadastrado.", "error");
    return;
  }

  window.open(link, "_blank");
}

const avisosWhatsappMostrados = new Set();

function removerPopoutWhatsapp(el, chave) {
  if (!el) return;
  el.style.opacity = "0";
  el.style.transform = "translateX(18px)";
  setTimeout(() => {
    el.remove();
    avisosWhatsappMostrados.delete(chave);
  }, 220);
}

function mostrarPopoutWhatsapp(usuario, emprestimo) {
  const chave = `${usuario.id}-${emprestimo.id || emprestimo.dataDevIso}`;
  if (avisosWhatsappMostrados.has(chave)) return;
  avisosWhatsappMostrados.add(chave);

  const dias = diasAte(emprestimo.dataDevIso);
  const prazo = dias === 0 ? "vence hoje" : `vence em ${dias} dia${dias > 1 ? "s" : ""}`;

  const aviso = document.createElement("aside");
  aviso.setAttribute("role", "status");
  aviso.setAttribute("aria-live", "polite");
  aviso.style.position = "fixed";
  aviso.style.right = "22px";
  aviso.style.bottom = `${22 + document.querySelectorAll(".whatsapp-popout").length * 132}px`;
  aviso.style.width = "min(360px, calc(100vw - 44px))";
  aviso.style.zIndex = "9999";
  aviso.style.padding = "16px";
  aviso.style.borderRadius = "14px";
  aviso.style.border = "1px solid var(--border, #342a52)";
  aviso.style.background = "var(--surface-2, #1b1728)";
  aviso.style.color = "var(--text-1, #fff)";
  aviso.style.boxShadow = "0 18px 45px rgba(0,0,0,.35)";
  aviso.style.transition = "opacity .22s ease, transform .22s ease";
  aviso.className = "whatsapp-popout";

  aviso.innerHTML = `
    <button type="button" aria-label="Fechar aviso" style="position:absolute;top:8px;right:10px;border:0;background:transparent;color:inherit;font-size:20px;cursor:pointer">x</button>
    <strong style="display:block;margin-bottom:6px;color:var(--orange,#f59e0b)">Devolucao proxima</strong>
    <span style="display:block;font-size:13px;line-height:1.45;color:var(--text-2,#c7bff0)">
      ${usuario.nome} precisa devolver <strong style="color:var(--text-1,#fff)">${emprestimo.livro}</strong>: ${prazo}, em ${emprestimo.devolucao}.
    </span>
    <button type="button" style="margin-top:12px;border:0;border-radius:10px;padding:10px 12px;background:#22c55e;color:#fff;font-weight:700;cursor:pointer">
      Enviar WhatsApp
    </button>
  `;

  const [btnFechar, btnWhatsapp] = aviso.querySelectorAll("button");
  btnFechar.addEventListener("click", () => removerPopoutWhatsapp(aviso, chave));
  btnWhatsapp.addEventListener("click", () => {
    const link = montarLinkWhatsapp(usuario, emprestimo);
    if (!link) {
      mostrarToast("Usuario sem telefone valido para WhatsApp.", "error");
      return;
    }
    window.open(link, "_blank");
  });

  document.body.appendChild(aviso);
}

function mostrarPopoutsDevolucaoProxima() {
  usuarios.forEach(usuario => {
    emprestimosProximosUsuario(usuario.id).forEach(emprestimo => {
      mostrarPopoutWhatsapp(usuario, emprestimo);
    });
  });
}

function statusEfetivo(u) {
  if (u.status === "bloqueado") return "bloqueado";
  if (u.emprestimos > 0 && HISTORICO[u.id]?.some(h => h.status === "ativo")) return "emprestado";
  return "ativo";
}

function usuariosFiltrados() {
  const q = filtros.busca.toLowerCase().trim();
  return usuarios.filter(u => {
    const matchBusca  = !q || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.matricula.includes(q);
    const se          = statusEfetivo(u);
    const matchStatus = !filtros.status || se === filtros.status;
    const matchTipo   = !filtros.tipo   || u.tipo === filtros.tipo;
    return matchBusca && matchStatus && matchTipo;
  });
}


function atualizarMetricas() {
  const total      = usuarios.length;
  const bloqueados = usuarios.filter(u => u.status === "bloqueado").length;
  const emprest    = usuarios.filter(u => statusEfetivo(u) === "emprestado").length;
  const ativos     = total - bloqueados - emprest;

  animarContador("m-total",      total);
  animarContador("m-ativos",     ativos);
  animarContador("m-emprestados",emprest);
  animarContador("m-bloqueados", bloqueados);
}

function animarContador(id, alvo, dur = 800) {
  const el = document.getElementById(id);
  if (!el) return;
  let v = 0;
  const passo = Math.ceil(alvo / (dur / 16));
  const t = setInterval(() => {
    v += passo;
    if (v >= alvo) { el.textContent = alvo; clearInterval(t); }
    else el.textContent = v;
  }, 16);
}


function renderCards() {
  const grid    = document.getElementById("user-grid");
  const emptyEl = document.getElementById("empty-cards");
  const lista   = usuariosFiltrados();

  atualizarContagem(lista.length);
  if (lista.length === 0) { grid.innerHTML = ""; emptyEl.hidden = false; return; }
  emptyEl.hidden = true;

  grid.innerHTML = lista.map(u => {
    const se      = statusEfetivo(u);
    const hist    = HISTORICO[u.id] || [];
    const ativos  = hist.filter(h => h.status === "ativo").length;
    const total   = hist.length;
    const atras   = hist.filter(h => h.status === "atrasado").length;
    const proximos = emprestimosProximosUsuario(u.id);
    const avisoPrazo = proximos.length
      ? `<p class="user-card-item__meta">⚠ Devolução próxima: <strong style="color:var(--orange);margin-left:4px">${proximos[0].livro} · ${proximos[0].devolucao}</strong></p>`
      : "";
    const btnWhatsapp = proximos.length
      ? `<button type="button" class="btn-action" onclick="enviarAvisoWhatsapp(${u.id})">💬 WhatsApp</button>`
      : "";

    const btnBloq = u.status === "bloqueado"
      ? `<button type="button" class="btn-action btn-action--unblock" onclick="abrirBloquear(${u.id})">🔓 Liberar</button>`
      : `<button type="button" class="btn-action btn-action--block"   onclick="abrirBloquear(${u.id})">🚫 Bloquear</button>`;

    return `
      <li class="user-card-item user-card-item--${se}" data-id="${u.id}">
        <div class="user-card-item__banner" aria-hidden="true"></div>
        <div class="user-card-item__body">
          <div class="user-card-item__top">
            <div class="avatar ${avCor(u.id)}" aria-hidden="true">${iniciais(u.nome)}</div>
            <div class="user-card-item__info">
              <p class="user-card-item__name">${u.nome}</p>
              <p class="user-card-item__email">${u.email}</p>
            </div>
          </div>

          <div class="user-card-item__badges">
            <span class="badge badge--${se}">${STATUS_NOMES[se] || se}</span>
            <span class="badge badge--${u.tipo}">${TIPO_NOMES[u.tipo]}</span>
          </div>

          <div class="user-card-item__stats">
            <div class="stat-item">
              <strong>${total}</strong>
              <span>Empréstimos</span>
            </div>
            <div class="stat-item">
              <strong>${ativos}</strong>
              <span>Em aberto</span>
            </div>
            <div class="stat-item" style="${atras > 0 ? "color:var(--red)" : ""}">
              <strong style="${atras > 0 ? "color:var(--red)" : ""}">${atras}</strong>
              <span>Atrasos</span>
            </div>
            <div class="stat-item">
              <strong>${u.multas}</strong>
              <span>Multas</span>
            </div>
          </div>

          <p class="user-card-item__meta">
            🎓 Matrícula: <strong style="color:var(--text-2);margin-left:4px">${u.matricula}</strong>
          </p>
          ${avisoPrazo}
        </div>

        <div class="user-card-item__actions">
          <button type="button" class="btn-action" onclick="abrirEdicao(${u.id})">✏️ Editar</button>
          <button type="button" class="btn-action" onclick="abrirHistorico(${u.id})">📋 Histórico</button>
          ${btnWhatsapp}
          ${btnBloq}
        </div>
      </li>`;
  }).join("");
}


function renderTabela() {
  const tbody   = document.getElementById("table-body");
  const emptyEl = document.getElementById("empty-table");
  const lista   = usuariosFiltrados();

  atualizarContagem(lista.length);
  if (lista.length === 0) { tbody.innerHTML = ""; emptyEl.hidden = false; return; }
  emptyEl.hidden = true;

  tbody.innerHTML = lista.map(u => {
    const se   = statusEfetivo(u);
    const hist = HISTORICO[u.id] || [];
    const ativos = hist.filter(h => h.status === "ativo").length;

    const btnBloq = u.status === "bloqueado"
      ? `<button type="button" class="btn-row btn-row--unblock" onclick="abrirBloquear(${u.id})">🔓 Liberar</button>`
      : `<button type="button" class="btn-row btn-row--block"   onclick="abrirBloquear(${u.id})">🚫 Bloquear</button>`;

    return `
      <tr data-id="${u.id}">
        <td>
          <div class="user-row__cell">
            <div class="avatar avatar--sm ${avCor(u.id)}" aria-hidden="true">${iniciais(u.nome)}</div>
            <div>
              <p class="user-row__name">${u.nome}</p>
              <p class="user-row__email">${u.email}</p>
            </div>
          </div>
        </td>
        <td>${u.matricula}</td>
        <td><span class="badge badge--${u.tipo}">${TIPO_NOMES[u.tipo]}</span></td>
        <td>
          <span style="font-size:13px;font-weight:600;color:var(--text-1)">${hist.length}</span>
          <span style="font-size:11px;color:var(--text-3);margin-left:4px">(${ativos} aberto${ativos !== 1 ? "s" : ""})</span>
        </td>
        <td><span class="badge badge--${se}">${STATUS_NOMES[se] || se}</span></td>
        <td>
          <div class="row-actions">
            <button type="button" class="btn-row btn-row--edit"  onclick="abrirEdicao(${u.id})">✏️ Editar</button>
            <button type="button" class="btn-row btn-row--hist"  onclick="abrirHistorico(${u.id})">📋 Histórico</button>
            ${btnBloq}
          </div>
        </td>
      </tr>`;
  }).join("");
}


function render() {
  if (modoView === "cards") renderCards();
  else renderTabela();
  atualizarMetricas();
}

function atualizarContagem(n) {
  const el = document.getElementById("results-count");
  if (el) el.textContent = n === 0
    ? "Nenhum usuário encontrado."
    : `${n} usuário${n !== 1 ? "s" : ""} encontrado${n !== 1 ? "s" : ""}`;
}


function initToggleView() {
  const btnCards = document.getElementById("btn-cards");
  const btnTable = document.getElementById("btn-table");
  const secCards = document.getElementById("view-cards");
  const secTable = document.getElementById("view-table");

  btnCards.addEventListener("click", () => {
    modoView = "cards";
    btnCards.classList.add("view-btn--active");    btnCards.setAttribute("aria-pressed","true");
    btnTable.classList.remove("view-btn--active"); btnTable.setAttribute("aria-pressed","false");
    secCards.hidden = false; secTable.hidden = true;
    renderCards();
  });
  btnTable.addEventListener("click", () => {
    modoView = "table";
    btnTable.classList.add("view-btn--active");    btnTable.setAttribute("aria-pressed","true");
    btnCards.classList.remove("view-btn--active"); btnCards.setAttribute("aria-pressed","false");
    secTable.hidden = false; secCards.hidden = true;
    renderTabela();
  });
}


function initFiltros() {
  document.getElementById("busca").addEventListener("input", e => {
    filtros.busca = e.target.value; render();
  });
  document.getElementById("filtro-status").addEventListener("change", e => {
    filtros.status = e.target.value; render();
  });
  document.getElementById("filtro-tipo").addEventListener("change", e => {
    filtros.tipo = e.target.value; render();
  });
}


const modal      = document.getElementById("modal");
const formUsuario = document.getElementById("form-usuario");

function abrirModal() {
  modal.showModal();
  document.getElementById("f-nome").focus();
}
function fecharModal() {
  modal.close(); resetForm(); editandoId = null;
}

function abrirAdicao() {
  editandoId = null;
  document.getElementById("modal-title").textContent = "Adicionar Usuário";
  document.getElementById("btn-salvar").textContent  = "Salvar";
  resetForm(); abrirModal();
}

function abrirEdicao(id) {
  const u = usuarios.find(x => x.id === id);
  if (!u) return;
  editandoId = id;
  document.getElementById("modal-title").textContent = "Editar Usuário";
  document.getElementById("btn-salvar").textContent  = "Salvar Alterações";

  formUsuario.nome.value      = u.nome;
  formUsuario.email.value     = u.email;
  formUsuario.matricula.value = u.matricula;
  formUsuario.telefone.value  = u.telefone;
  formUsuario.tipo.value      = u.tipo;
  formUsuario.status.value    = u.status === "emprestado" ? "ativo" : u.status;

  abrirModal();
}

function resetForm() {
  formUsuario.reset();
  formUsuario.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
  formUsuario.querySelectorAll(".field__error").forEach(el => el.textContent = "");
}

function validarCampo(el) {
  const field = el.closest(".field");
  const erro  = field?.querySelector(".field__error");
  const vazio = el.tagName === "SELECT" ? !el.value : !el.validity.valid;
  if (vazio) {
    el.classList.add("is-invalid");
    if (erro) erro.textContent = "Campo obrigatório.";
    return false;
  }
  el.classList.remove("is-invalid");
  if (erro) erro.textContent = "";
  return true;
}

function initForm() {
  formUsuario.querySelectorAll("input[required], select[required]").forEach(el => {
    el.addEventListener("blur",   () => validarCampo(el));
    el.addEventListener("input",  () => { if (el.classList.contains("is-invalid")) validarCampo(el); });
    el.addEventListener("change", () => { if (el.classList.contains("is-invalid")) validarCampo(el); });
  });

  formUsuario.addEventListener("submit", e => {
    e.preventDefault();
    const obrig   = [...formUsuario.querySelectorAll("input[required], select[required]")];
    const validos = obrig.map(validarCampo).every(Boolean);
    if (!validos) { obrig.find(el => el.classList.contains("is-invalid"))?.focus(); return; }

    const dados = {
      nome:      formUsuario.nome.value.trim(),
      email:     formUsuario.email.value.trim(),
      matricula: formUsuario.matricula.value.trim(),
      telefone:  formUsuario.telefone.value.trim(),
      tipo:      formUsuario.tipo.value,
      status:    formUsuario.status.value,
    };

    if (editandoId) {
      const idx = usuarios.findIndex(u => u.id === editandoId);
      if (idx !== -1) usuarios[idx] = { ...usuarios[idx], ...dados };
      fecharModal(); render();
      mostrarToast("Usuário atualizado com sucesso!");
    } else {
      usuarios.unshift({ id: proximoId, emprestimos: 0, multas: 0, ...dados });
      HISTORICO[proximoId] = [];
      proximoId++;
      fecharModal(); render();
      mostrarToast("Usuário adicionado com sucesso!");
    }
  });

  document.getElementById("modal-close").addEventListener("click", fecharModal);
  document.getElementById("btn-cancelar").addEventListener("click", fecharModal);
  modal.addEventListener("click", e => { if (e.target === modal) fecharModal(); });
}


const modalHist = document.getElementById("modal-historico");

function abrirHistorico(id) {
  const u    = usuarios.find(x => x.id === id);
  if (!u) return;
  const hist = HISTORICO[id] || [];

  document.getElementById("hist-title").textContent    = `Histórico — ${u.nome}`;
  document.getElementById("hist-subtitle").textContent = `${u.matricula} · ${TIPO_NOMES[u.tipo]}`;

  const av = document.getElementById("hist-avatar");
  av.className = `avatar avatar--lg ${avCor(u.id)}`;
  av.textContent = iniciais(u.nome);

  const devolvidos = hist.filter(h => h.status === "devolvido").length;
  const abertos    = hist.filter(h => h.status === "ativo").length;
  const atrasados  = hist.filter(h => h.status === "atrasado").length;

  const STATUS_LABEL = { devolvido:"Devolvido", ativo:"Em aberto", atrasado:"Atrasado" };
  const proximos = emprestimosProximosUsuario(id);
  const avisoWhatsapp = `<p class="hist-empty" style="text-align:left">
        ${proximos.length
          ? `⚠ O livro <strong>${proximos[0].livro}</strong> está próximo do prazo de devolução: <strong>${proximos[0].devolucao}</strong>.`
          : "Nenhum empréstimo próximo do prazo no momento."}
        <br><br>
        <button type="button" class="btn-action" onclick="enviarAvisoWhatsapp(${u.id})">💬 Enviar WhatsApp</button>
      </p>`;

  document.getElementById("hist-body").innerHTML = `
    <div class="hist-stats">
      <div class="hist-stat">
        <strong>${hist.length}</strong><span>Total</span>
      </div>
      <div class="hist-stat">
        <strong style="color:var(--green)">${devolvidos}</strong><span>Devolvidos</span>
      </div>
      <div class="hist-stat">
        <strong style="color:var(--orange)">${abertos}</strong><span>Em aberto</span>
      </div>
      <div class="hist-stat">
        <strong style="color:var(--red)">${atrasados}</strong><span>Atrasados</span>
      </div>
    </div>

    ${avisoWhatsapp}

    ${hist.length === 0
      ? `<p class="hist-empty">Nenhum empréstimo registrado.</p>`
      : `<div class="hist-table-wrap">
          <table class="hist-table">
            <caption class="sr-only">Histórico de empréstimos de ${u.nome}</caption>
            <thead>
              <tr>
                <th scope="col">Livro</th>
                <th scope="col">Empréstimo</th>
                <th scope="col">Devolução</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              ${hist.map(h => `
                <tr>
                  <td>${h.livro}</td>
                  <td>${h.data}</td>
                  <td>${h.devolucao}</td>
                  <td><span class="hist-status hist-status--${h.status}">${STATUS_LABEL[h.status]}</span></td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>`
    }`;

  modalHist.showModal();
}

function initModalHistorico() {
  document.getElementById("hist-close").addEventListener("click", () => modalHist.close());
  modalHist.addEventListener("click", e => { if (e.target === modalHist) modalHist.close(); });
}


const modalBloq = document.getElementById("modal-bloquear");

function abrirBloquear(id) {
  const u = usuarios.find(x => x.id === id);
  if (!u) return;
  bloqueandoId = id;
  const desbloquear = u.status === "bloqueado";

  document.getElementById("bloquear-title").textContent = desbloquear ? "Desbloquear usuário" : "Bloquear usuário";
  document.getElementById("bloquear-acao").textContent  = desbloquear ? "desbloquear" : "bloquear";
  document.getElementById("bloquear-nome").textContent  = u.nome;

  const btnConf = document.getElementById("bloquear-confirmar");
  btnConf.textContent = desbloquear ? "Desbloquear" : "Bloquear";
  btnConf.classList.toggle("desbloquear", desbloquear);

  modalBloq.showModal();
}

function initModalBloquear() {
  document.getElementById("bloquear-close").addEventListener("click", () => { modalBloq.close(); bloqueandoId = null; });
  document.getElementById("bloquear-cancelar").addEventListener("click", () => { modalBloq.close(); bloqueandoId = null; });

  document.getElementById("bloquear-confirmar").addEventListener("click", () => {
    if (!bloqueandoId) return;
    const u = usuarios.find(x => x.id === bloqueandoId);
    if (!u) return;
    const era = u.status;
    u.status = era === "bloqueado" ? "ativo" : "bloqueado";
    modalBloq.close(); bloqueandoId = null;
    render();
    mostrarToast(
      era === "bloqueado" ? `${u.nome} foi desbloqueado.` : `${u.nome} foi bloqueado.`,
      era === "bloqueado" ? "success" : "warn"
    );
  });

  modalBloq.addEventListener("click", e => { if (e.target === modalBloq) { modalBloq.close(); bloqueandoId = null; } });
}


let toastTimer = null;

function mostrarToast(msg, tipo = "success") {
  const toast  = document.getElementById("toast");
  const msgEl  = document.getElementById("toast-msg");
  const iconEl = document.getElementById("toast-icon");

  toast.classList.remove("toast--error","toast--warn");
  iconEl.style.background = "";

  if (tipo === "error") { toast.classList.add("toast--error"); iconEl.textContent = "✕"; }
  else if (tipo === "warn") { toast.classList.add("toast--warn"); iconEl.textContent = "⚠"; }
  else { iconEl.textContent = "✓"; }

  msgEl.textContent = msg;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => { toast.hidden = true; }, 320);
  }, 3200);
}


function initMenu() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const btnMenu = document.getElementById("btn-menu");
  const abrir  = () => { sidebar.classList.add("is-open");    overlay.classList.add("is-open");    btnMenu.setAttribute("aria-expanded","true"); };
  const fechar = () => { sidebar.classList.remove("is-open"); overlay.classList.remove("is-open"); btnMenu.setAttribute("aria-expanded","false"); };
  btnMenu.addEventListener("click", () => sidebar.classList.contains("is-open") ? fechar() : abrir());
  overlay.addEventListener("click", fechar);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.open && !modalHist.open && !modalBloq.open) fechar(); });
}

function initNav() {
  document.querySelectorAll(".nav__link:not(.nav__link--sair)").forEach(link => {
    link.addEventListener("click", e => {
      document.querySelectorAll(".nav__link").forEach(l => { l.classList.remove("nav__link--active"); l.removeAttribute("aria-current"); });
      link.classList.add("nav__link--active");
      link.setAttribute("aria-current","page");
      document.getElementById("sidebar").classList.remove("is-open");
      document.getElementById("overlay").classList.remove("is-open");
    });
  });
}


document.addEventListener("DOMContentLoaded", () => {
  initToggleView();
  initFiltros();
  initForm();
  initModalHistorico();
  initModalBloquear();
  initMenu();
  initNav();
  document.getElementById("btn-fab").addEventListener("click", abrirAdicao);
  render();
});


const API_ORIGIN = location.port === "63342" ? "http://localhost:8081" : "";
const USUARIOS_API = API_ORIGIN + "/usuarios";
const EMPRESTIMOS_API = API_ORIGIN + "/emprestimos";
function tipoUsuarioParaTela(tipoUsuario) { return tipoUsuario === "ADMINISTRADOR" ? "funcionario" : tipoUsuario === "BIBLIOTECARIO" ? "professor" : "aluno"; }
function tipoUsuarioParaApi(tipo) { return tipo === "professor" ? "BIBLIOTECARIO" : tipo === "funcionario" ? "ADMINISTRADOR" : "CLIENTE"; }
function normalizarUsuarioApi(u) { return { id:u.id, nome:u.nome || "", email:u.email || "", matricula:u.cpf || "", telefone:u.telefone || "", tipo:tipoUsuarioParaTela(u.tipoUsuario), status:u.status || "ativo", emprestimos:u.emprestimos || 0, multas:u.multas || 0 }; }
function payloadUsuarioApi(dados) { return { nome:dados.nome, cpf:dados.matricula, email:dados.email, telefone:dados.telefone, senha:dados.senha || "123456", tipoUsuario:tipoUsuarioParaApi(dados.tipo) }; }
async function carregarUsuariosApi() {
  try {
    const resp = await Promise.all([fetch(USUARIOS_API), fetch(EMPRESTIMOS_API)]);
    if (!resp[0].ok || !resp[1].ok) throw new Error("Erro");

    usuarios = (await resp[0].json()).filter(u => u.tipoUsuario === "CLIENTE").map(normalizarUsuarioApi);
    Object.keys(HISTORICO).forEach(id => delete HISTORICO[id]);
    usuarios.forEach(u => HISTORICO[u.id] = []);

    (await resp[1].json()).forEach(e => {
      const usuarioId = e.usuario && e.usuario.id;
      if (!HISTORICO[usuarioId]) return;

      const statusApi = String(e.status || "ATIVO").toUpperCase();
      const status = statusApi === "DEVOLVIDO" ? "devolvido" : statusApi === "ATRASADO" ? "atrasado" : "ativo";

      HISTORICO[usuarioId].push({
        id: e.id,
        livro: e.livro && e.livro.titulo ? e.livro.titulo : "Livro",
        data: fmtData(e.dataEmprestimo),
        devolucao: fmtData(e.dataPrevistaDevolucao),
        dataEmpIso: e.dataEmprestimo,
        dataDevIso: e.dataPrevistaDevolucao,
        status
      });
    });

    usuarios = usuarios.map(u => ({ ...u, emprestimos: (HISTORICO[u.id] || []).length }));
    proximoId = usuarios.length ? Math.max(...usuarios.map(u => u.id || 0)) + 1 : 1;
    render();
    mostrarPopoutsDevolucaoProxima();
  }
  catch (erro) { usuarios = []; render(); mostrarToast("Erro ao carregar dados do banco de dados.", "error"); }
}
document.addEventListener("DOMContentLoaded", () => {
  carregarUsuariosApi();
  formUsuario.addEventListener("submit", async e => {
    e.preventDefault(); e.stopImmediatePropagation();
    const obrig = [...formUsuario.querySelectorAll("input[required], select[required]")];
    const validos = obrig.map(validarCampo).every(Boolean);
    if (!validos) { obrig.find(el => el.classList.contains("is-invalid"))?.focus(); return; }
    const dados = { nome:formUsuario.nome.value.trim(), email:formUsuario.email.value.trim(), matricula:formUsuario.matricula.value.trim(), telefone:formUsuario.telefone.value.trim(), tipo:formUsuario.tipo.value, status:formUsuario.status.value };
    try { const url = editandoId ? USUARIOS_API + "/" + editandoId : USUARIOS_API; const method = editandoId ? "PUT" : "POST"; const resp = await fetch(url, { method:method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(payloadUsuarioApi(dados)) }); if (!resp.ok) throw new Error(await resp.text()); fecharModal(); await carregarUsuariosApi(); mostrarToast(editandoId ? "Usuário atualizado com sucesso!" : "Usuário adicionado com sucesso!"); editandoId = null; }
    catch (erro) { mostrarToast("Erro ao salvar usuário no banco de dados.", "error"); }
  }, true);
});


function usuarioLogadoValido() {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    return usuario && (usuario.tipoUsuario === "ADMINISTRADOR" || usuario.tipoUsuario === "BIBLIOTECARIO");
  } catch (erro) {
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!usuarioLogadoValido()) {
    window.location.href = "login.html";
    return;
  }

  document.querySelectorAll(".nav__link--sair").forEach(link => {
    link.addEventListener("click", () => localStorage.removeItem("usuarioLogado"));
  });
});


function atualizarCardUsuarioLogado() {
  let usuario = null;
  try {
    usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  } catch (erro) {
    usuario = null;
  }
  if (!usuario) return;

  document.querySelectorAll(".user-card").forEach(card => {
    const nomeEl = card.querySelector(".user-card__name") || card.querySelector(".user-card__info strong") || card.querySelector("strong");
    const emailEl = card.querySelector(".user-card__info span:not(.user-card__avatar)");

    if (nomeEl) nomeEl.textContent = usuario.nome || "Usu?rio";
    if (emailEl && usuario.email) emailEl.textContent = usuario.email;
    card.setAttribute("aria-label", "Usu?rio logado: " + (usuario.nome || "Usu?rio"));
  });
}

document.addEventListener("DOMContentLoaded", atualizarCardUsuarioLogado);
