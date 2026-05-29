
const AVATAR_CORES = ["av0","av1","av2","av3","av4","av5","av6","av7"];
const COVER_HEX    = ["#e74c3c","#f39c12","#1abc9c","#3498db","#9b59b6","#2ecc71","#e91e63","#00bcd4"];
const COVER_EMOJI  = ["📗","📘","📙","📕","📓","📔","📒","📚"];

const CAT_NOMES = {
    romance:"Romance", fantasia:"Fantasia", ficcao:"Ficção Científica",
    programacao:"Programação", negocios:"Negócios & Gestão",
    design:"Design & UI", recrutamento:"Recrutamento", fabula:"Fábula",
};
const FMT_NOMES = { impresso:"Impresso", ebook:"E-book" };
const CONDICAO_NOMES = { otimo:"Ótimo estado", regular:"Estado regular", danificado:"Danificado" };
const MULTA_DIA = 2.00; 

let USUARIOS = [];

let LIVROS = [];


let emprestimos = [];

let filtros = { busca:"", status:"", multa:"" };
let modalEmpId = null;


function getUsuario(id) { return USUARIOS.find(u => u.id === id); }
function getLivro(id)   { return LIVROS.find(l => l.id === id); }

function avCor(id)    { return AVATAR_CORES[(id-1) % AVATAR_CORES.length]; }
function coverHex(id) { return COVER_HEX[(id-1)   % COVER_HEX.length]; }
function coverEmoji(id){ return COVER_EMOJI[(id-1) % COVER_EMOJI.length]; }

function iniciais(nome) {
    return nome.split(" ").slice(0,2).map(p => p[0].toUpperCase()).join("");
}

function fmtData(iso) {
    if (!iso) return "—";
    const [y,m,d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

function isoHoje() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${hoje.getFullYear()}-${mes}-${dia}`;
}

function dataLocal(iso) {
    const [ano, mes, dia] = iso.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
}

function diasEntre(a, b) {
    
    return Math.round((dataLocal(b) - dataLocal(a)) / 86400000);
}

function calcularMulta(dataDev, dataDevReal) {
    const hoje = dataDevReal || isoHoje();
    const dias  = diasEntre(dataDev, hoje);
    return dias > 0 ? dias * MULTA_DIA : 0;
}

function fmtMoeda(v) {
    return `R$ ${v.toFixed(2).replace(".", ",")}`;
}


function atualizarMetricas() {
    const hoje      = isoHoje();
    const abertos   = emprestimos.filter(e => e.status === "ativo").length;
    const atrasados = emprestimos.filter(e => e.status === "atrasado").length;

    
    const totalMultas = emprestimos
        .filter(e => e.status !== "devolvido")
        .reduce((acc, e) => acc + calcularMulta(e.dataDev, null), 0);

    const devHoje = emprestimos.filter(e =>
        e.status === "devolvido" && e.dataDevReal === hoje
    ).length;

    animarContador("m-abertos",   abertos);
    animarContador("m-atrasados", atrasados);
    animarContador("m-hoje",      devHoje);

    
    const el = document.getElementById("m-multas");
    if (el) el.textContent = fmtMoeda(totalMultas);
}

function animarContador(id, alvo, dur = 600) {
    const el = document.getElementById(id);
    if (!el) return;
    let v = 0;
    const passo = Math.max(1, Math.ceil(alvo / (dur/16)));
    const t = setInterval(() => {
        v += passo;
        if (v >= alvo) { el.textContent = alvo; clearInterval(t); }
        else el.textContent = v;
    }, 16);
}


function renderAlertas() {
    const sec   = document.getElementById("alertas-section");
    const lista = document.getElementById("alertas-list");
    const count = document.getElementById("alertas-count");
    const atras = emprestimos.filter(e => e.status === "atrasado");

    if (atras.length === 0) { sec.hidden = true; return; }

    sec.hidden = false;
    count.textContent = `${atras.length} livro${atras.length > 1 ? "s" : ""} com prazo vencido`;

    lista.innerHTML = atras.map(e => {
        const u    = getUsuario(e.usuarioId);
        const l    = getLivro(e.livroId);
        const dias = diasEntre(e.dataDev, isoHoje());
        const cor  = coverHex(e.livroId);
        const emo  = coverEmoji(e.livroId);

        return `
      <li class="alerta-item">
        <span class="alerta-item__cover"
              style="background:${cor}33;color:${cor}">${emo}</span>
        <span class="alerta-item__info">
          <p class="alerta-item__livro">${l ? l.titulo : "?"}</p>
          <p class="alerta-item__usuario">${u ? u.nome : "?"} · ${u ? u.matricula : ""}</p>
        </span>
        <span class="alerta-badge">
          ${dias} dia${dias > 1 ? "s" : ""} de atraso · ${fmtMoeda(dias * MULTA_DIA)}
        </span>
        <button type="button" class="btn-devolver-rapido"
                onclick="abrirModal(${e.id})"
                aria-label="Devolver ${l ? l.titulo : "livro"}">
          ↩️ Devolver
        </button>
      </li>`;
    }).join("");
}


function empFiltrados() {
    const q = filtros.busca.toLowerCase().trim();
    return emprestimos.filter(e => {
        const u = getUsuario(e.usuarioId);
        const l = getLivro(e.livroId);

        const matchBusca = !q ||
            (u && u.nome.toLowerCase().includes(q)) ||
            (u && u.matricula.includes(q)) ||
            (l && l.titulo.toLowerCase().includes(q));

        const matchStatus = !filtros.status || e.status === filtros.status;

        const multa = calcularMulta(e.dataDev, e.dataDevReal);
        const matchMulta =
            !filtros.multa ||
            (filtros.multa === "com" && multa > 0) ||
            (filtros.multa === "sem" && multa === 0);

        return matchBusca && matchStatus && matchMulta;
    });
}


const STATUS_LABEL = { ativo:"Em aberto", atrasado:"Atrasado", devolvido:"Devolvido" };

function renderLista() {
    const lista   = document.getElementById("dev-list");
    const emptyEl = document.getElementById("empty-list");
    const countEl = document.getElementById("results-count");
    const arr     = empFiltrados();

    if (countEl) countEl.textContent =
        arr.length === 0
            ? "Nenhum registro encontrado."
            : `${arr.length} registro${arr.length !== 1 ? "s" : ""} encontrado${arr.length !== 1 ? "s" : ""}`;

    if (arr.length === 0) {
        lista.innerHTML = "";
        emptyEl.hidden = false;
        return;
    }
    emptyEl.hidden = true;

    lista.innerHTML = arr.map(e => {
        const u    = getUsuario(e.usuarioId);
        const l    = getLivro(e.livroId);
        const cor  = coverHex(e.livroId);
        const emo  = coverEmoji(e.livroId);
        const st   = e.status;
        const multa = calcularMulta(e.dataDev, e.dataDevReal);
        const hoje  = isoHoje();
        const diasAtraso  = st !== "devolvido" ? diasEntre(e.dataDev, hoje) : 0;
        const diasRestant = st !== "devolvido" ? diasEntre(hoje, e.dataDev) : 0;

        
        let prazoPill = "";
        if (st === "devolvido") {
            prazoPill = `<span class="prazo-pill prazo-pill--done">✓ Devolvido em ${fmtData(e.dataDevReal)}</span>`;
        } else if (diasAtraso > 0) {
            prazoPill = `<span class="prazo-pill prazo-pill--danger">⚠ ${diasAtraso} dia${diasAtraso>1?"s":""} de atraso</span>`;
        } else if (diasRestant <= 3) {
            prazoPill = `<span class="prazo-pill prazo-pill--warn">⏰ Vence em ${diasRestant} dia${diasRestant>1?"s":""}</span>`;
        } else {
            prazoPill = `<span class="prazo-pill prazo-pill--ok">✓ ${diasRestant} dias restantes</span>`;
        }

        
        const multaPill = multa > 0
            ? `<span class="multa-pill">💰 Multa: ${fmtMoeda(multa)}</span>`
            : "";

        
        let acaoBtns = "";
        if (st !== "devolvido") {
            acaoBtns = `
        <button type="button" class="btn-devolver"
                onclick="abrirModal(${e.id})"
                aria-label="Registrar devolução de ${l ? l.titulo : "livro"}">
          ↩️ Devolver
        </button>`;
        } else {
            acaoBtns = `<span class="badge-devolvido">✓ Devolvido</span>`;
        }

        return `
      <li class="dev-item dev-item--${st}" data-id="${e.id}">
        <span class="dev-item__stripe" aria-hidden="true"></span>

        <span class="dev-item__main">
          <span class="dev-item__cover"
                style="background:${cor}33;color:${cor}">
            ${emo}
          </span>
          <span class="dev-item__info">
            <p class="dev-item__titulo">${l ? l.titulo : "Livro não encontrado"}</p>
            <p class="dev-item__autor">${l ? l.autor : ""}</p>
            <span class="dev-item__tags">
              ${u ? `
                <span class="dev-tag-user">
                  <span class="dev-tag-user__av ${avCor(u.id)}"
                        aria-hidden="true">${iniciais(u.nome)}</span>
                  ${u.nome}
                </span>` : ""}
              ${l ? `<span class="chip chip--cat">${CAT_NOMES[l.categoria] || l.categoria}</span>` : ""}
              ${l ? `<span class="chip chip--formato">${FMT_NOMES[l.formato] || l.formato}</span>` : ""}
            </span>
          </span>
        </span>

        <span class="dev-item__datas">
          <span class="dev-item__data-row">
            <span class="dev-item__data-label">Empréstimo</span>
            <span class="dev-item__data-val">${fmtData(e.dataEmp)}</span>
          </span>
          <span class="dev-item__data-row">
            <span class="dev-item__data-label">Devolução</span>
            <span class="dev-item__data-val ${st === "atrasado" ? "dev-item__data-val--atrasado" : ""}">
              ${fmtData(e.dataDev)}
            </span>
          </span>
          ${prazoPill}
          ${multaPill}
        </span>

        <span class="dev-item__actions">
          ${acaoBtns}
          <button type="button" class="btn-detalhe"
                  onclick="abrirDetalhe(${e.id})"
                  aria-label="Ver detalhes do empréstimo">
            Ver detalhes
          </button>
        </span>
      </li>`;
    }).join("");
}


const modal = document.getElementById("modal");

function abrirModal(id) {
    const e = emprestimos.find(x => x.id === id);
    if (!e || e.status === "devolvido") return;
    modalEmpId = id;

    const u    = getUsuario(e.usuarioId);
    const l    = getLivro(e.livroId);
    const cor  = coverHex(e.livroId);
    const emo  = coverEmoji(e.livroId);
    const st   = e.status;

    
    const cov = document.getElementById("resumo-cover");
    cov.style.background = `${cor}33`;
    cov.style.color      = cor;
    cov.textContent      = emo;

    document.getElementById("resumo-titulo").textContent  = l ? l.titulo : "?";
    document.getElementById("resumo-autor").textContent   = l ? l.autor  : "";
    document.getElementById("resumo-usuario").textContent = u ? `👤 ${u.nome} · ${u.matricula}` : "";

    const statusEl = document.getElementById("resumo-status");
    statusEl.textContent = st === "atrasado" ? "⚠ Atrasado" : "Em aberto";
    statusEl.className   = `resumo__status resumo__status--${st}`;

    
    document.getElementById("f-data-emp-ro").value = e.dataEmp;
    document.getElementById("f-data-dev").value    = isoHoje();
    document.getElementById("f-data-dev").min      = e.dataEmp;

    
    atualizarMultaModal(e.dataDev, isoHoje());

    
    document.getElementById("f-obs").value = e.obs || "";

    
    const radOtimo = document.querySelector('input[name="condicao"][value="otimo"]');
    if (radOtimo) radOtimo.checked = true;

    modal.showModal();
    document.getElementById("f-data-dev").focus();
}

function atualizarMultaModal(dataDev, dataDevReal) {
    const multaBox = document.getElementById("multa-box");
    const okBox    = document.getElementById("ok-box");
    const dias     = diasEntre(dataDev, dataDevReal);

    if (dias > 0) {
        document.getElementById("multa-dias").textContent  = `${dias} dia${dias>1?"s":""}`;
        document.getElementById("multa-total").textContent = fmtMoeda(dias * MULTA_DIA);
        multaBox.hidden = false;
        okBox.hidden    = true;
    } else {
        multaBox.hidden = true;
        okBox.hidden    = false;
    }
}

function initModal() {
    const dataDev = document.getElementById("f-data-dev");

    dataDev.addEventListener("change", () => {
        const e = emprestimos.find(x => x.id === modalEmpId);
        if (e) atualizarMultaModal(e.dataDev, dataDev.value);
    });

    document.getElementById("modal-close").addEventListener("click", fecharModal);
    document.getElementById("btn-cancelar").addEventListener("click", fecharModal);
    modal.addEventListener("click", e => { if (e.target === modal) fecharModal(); });

    document.getElementById("form-devolucao").addEventListener("submit", ev => {
        ev.preventDefault();
        if (!modalEmpId) return;

        const dataDevVal = document.getElementById("f-data-dev").value;
        const erroEl     = document.querySelector("#f-data-dev ~ .field__error");

        if (!dataDevVal) {
            if (erroEl) erroEl.textContent = "Informe a data de devolução.";
            return;
        }
        if (erroEl) erroEl.textContent = "";

        const e        = emprestimos.find(x => x.id === modalEmpId);
        const condicao = document.querySelector('input[name="condicao"]:checked').value;
        const obs      = document.getElementById("f-obs").value.trim();
        const multa    = calcularMulta(e.dataDev, dataDevVal);

        
        e.status      = "devolvido";
        e.dataDevReal = dataDevVal;
        e.multa       = multa;
        e.condicao    = condicao;
        e.obs         = obs;

        fecharModal();
        renderLista();
        renderAlertas();
        atualizarMetricas();

        const msg = multa > 0
            ? `Devolução registrada! Multa: ${fmtMoeda(multa)}`
            : "Devolução registrada com sucesso!";
        mostrarToast(msg, multa > 0 ? "warn" : "success");
    });
}

function fecharModal() {
    modal.close();
    modalEmpId = null;
    document.getElementById("multa-box").hidden = true;
    document.getElementById("ok-box").hidden    = true;
}


const modalDetalhe = document.getElementById("modal-detalhe");

function abrirDetalhe(id) {
    const e = emprestimos.find(x => x.id === id);
    if (!e) return;

    const u    = getUsuario(e.usuarioId);
    const l    = getLivro(e.livroId);
    const multa = calcularMulta(e.dataDev, e.dataDevReal);
    const STATUS_LABEL = { ativo:"Em aberto", atrasado:"Atrasado", devolvido:"Devolvido" };

    document.getElementById("detalhe-body").innerHTML = `
    <dl class="detalhe-grid">
      <dt>Livro</dt>
      <dd>${l ? l.titulo : "—"}</dd>
      <dt>Autor</dt>
      <dd>${l ? l.autor : "—"}</dd>
      <dt>Categoria</dt>
      <dd>${l ? (CAT_NOMES[l.categoria] || l.categoria) : "—"}</dd>
      <dt>Formato</dt>
      <dd>${l ? (FMT_NOMES[l.formato] || l.formato) : "—"}</dd>
      <dt>Usuário</dt>
      <dd>${u ? u.nome : "—"}</dd>
      <dt>Matrícula</dt>
      <dd>${u ? u.matricula : "—"}</dd>
      <dt>Data empréstimo</dt>
      <dd>${fmtData(e.dataEmp)}</dd>
      <dt>Prev. devolução</dt>
      <dd>${fmtData(e.dataDev)}</dd>
      <dt>Dev. real</dt>
      <dd>${e.dataDevReal ? fmtData(e.dataDevReal) : "—"}</dd>
      <dt>Status</dt>
      <dd>${STATUS_LABEL[e.status] || e.status}</dd>
      ${e.condicao ? `<dt>Condição</dt><dd>${CONDICAO_NOMES[e.condicao] || e.condicao}</dd>` : ""}
      <dt>Multa</dt>
      <dd style="color:${multa>0?"var(--red)":"var(--green)"};font-weight:700">
        ${multa > 0 ? fmtMoeda(multa) : "Sem multa"}
      </dd>
      ${e.obs ? `<dt>Observação</dt><dd>${e.obs}</dd>` : ""}
    </dl>`;

    modalDetalhe.showModal();
}

function initModalDetalhe() {
    document.getElementById("detalhe-close").addEventListener("click", () => modalDetalhe.close());
    modalDetalhe.addEventListener("click", e => { if (e.target === modalDetalhe) modalDetalhe.close(); });
}


function initFiltros() {
    document.getElementById("busca").addEventListener("input", e => {
        filtros.busca = e.target.value; renderLista();
    });
    document.getElementById("filtro-status").addEventListener("change", e => {
        filtros.status = e.target.value; renderLista();
    });
    document.getElementById("filtro-multa").addEventListener("change", e => {
        filtros.multa = e.target.value; renderLista();
    });
}


let toastTimer = null;
function mostrarToast(msg, tipo = "success") {
    const toast  = document.getElementById("toast");
    const msgEl  = document.getElementById("toast-msg");
    const iconEl = document.getElementById("toast-icon");

    toast.classList.remove("toast--warn");
    if (tipo === "warn") { toast.classList.add("toast--warn"); iconEl.textContent = "⚠"; }
    else { iconEl.textContent = "✓"; }

    msgEl.textContent = msg;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("is-visible");
        setTimeout(() => { toast.hidden = true; }, 320);
    }, 3500);
}


function initMenu() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const btnMenu = document.getElementById("btn-menu");
    const abrir  = () => { sidebar.classList.add("is-open");    overlay.classList.add("is-open");    btnMenu.setAttribute("aria-expanded","true"); };
    const fechar = () => { sidebar.classList.remove("is-open"); overlay.classList.remove("is-open"); btnMenu.setAttribute("aria-expanded","false"); };
    btnMenu.addEventListener("click", () => sidebar.classList.contains("is-open") ? fechar() : abrir());
    overlay.addEventListener("click", fechar);
    document.addEventListener("keydown", ev => {
        if (ev.key === "Escape" && !modal.open && !modalDetalhe.open) fechar();
    });
}

function initNav() {
    document.querySelectorAll(".nav__link:not(.nav__link--sair)").forEach(link => {
        link.addEventListener("click", ev => {
            document.querySelectorAll(".nav__link").forEach(l => { l.classList.remove("nav__link--active"); l.removeAttribute("aria-current"); });
            link.classList.add("nav__link--active");
            link.setAttribute("aria-current","page");
            document.getElementById("sidebar").classList.remove("is-open");
            document.getElementById("overlay").classList.remove("is-open");
        });
    });
}


document.addEventListener("DOMContentLoaded", () => {
    initFiltros();
    initModal();
    initModalDetalhe();
    initMenu();
    initNav();
    renderAlertas();
    renderLista();
    atualizarMetricas();
});


const API_ORIGIN = location.port === "63342" ? "http://localhost:8081" : "";
const USUARIOS_API = API_ORIGIN + "/usuarios";
const LIVROS_API = API_ORIGIN + "/livros";
const EMPRESTIMOS_API = API_ORIGIN + "/emprestimos";
function normalizarUsuarioApi(u) { return { id:u.id, nome:u.nome || "", matricula:u.cpf || "", tipo:u.tipoUsuario || "Cliente" }; }
function normalizarLivroApi(l) { return { id:l.id, titulo:l.titulo || "", autor:l.autor || "", categoria:l.categoria || "", formato:"impresso" }; }
function normalizarEmprestimoApi(e) {
  const statusApi = String(e.status || "ATIVO").toUpperCase();
  const status = statusApi === "DEVOLVIDO"
    ? "devolvido"
    : e.dataPrevistaDevolucao && diasEntre(e.dataPrevistaDevolucao, isoHoje()) > 0
      ? "atrasado"
      : "ativo";

  return { id:e.id, usuarioId:e.usuario && e.usuario.id, livroId:e.livro && e.livro.id, dataEmp:e.dataEmprestimo, dataDev:e.dataPrevistaDevolucao, dataDevReal:e.dataDevolucao, status, multa:Number(e.multa || 0), obs:"" };
}
async function carregarDevolucoesApi() {
  try {
    const resp = await Promise.all([fetch(USUARIOS_API), fetch(LIVROS_API), fetch(EMPRESTIMOS_API)]);
    if (!resp[0].ok || !resp[1].ok || !resp[2].ok) throw new Error("Erro");
    USUARIOS = (await resp[0].json()).filter(u => u.tipoUsuario === "CLIENTE").map(normalizarUsuarioApi);
    LIVROS = (await resp[1].json()).map(normalizarLivroApi);
    emprestimos = (await resp[2].json()).map(normalizarEmprestimoApi);
    renderAlertas(); renderLista(); atualizarMetricas();
  } catch (erro) {
    USUARIOS = []; LIVROS = []; emprestimos = [];
    renderAlertas(); renderLista(); atualizarMetricas();
    mostrarToast("Erro ao carregar dados do banco de dados.", "error");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  carregarDevolucoesApi();
  document.getElementById("form-devolucao")?.addEventListener("submit", async ev => {
    ev.preventDefault(); ev.stopImmediatePropagation();
    if (!modalEmpId) return;
    try {
      const resp = await fetch(EMPRESTIMOS_API + "/" + modalEmpId + "/devolucao", { method:"PUT" });
      if (!resp.ok) throw new Error(await resp.text());
      fecharModal();
      await carregarDevolucoesApi();
      mostrarToast("Devolução registrada com sucesso!");
    } catch (erro) {
      mostrarToast("Erro ao registrar devolução no banco de dados.", "error");
    }
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
