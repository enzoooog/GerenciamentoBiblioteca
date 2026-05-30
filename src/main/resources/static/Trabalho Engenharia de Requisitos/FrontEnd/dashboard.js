
let livros = [];

let emprestimos = [];

let termoBuscaDashboard = "";

let alertas = [];

const acoes = [
  { icon: "📚", classe: "acao__icon--purple", label: "Cadastar Livro",      href: "livros.html"      },
  { icon: "🤝", classe: "acao__icon--teal",   label: "Novo Empréstimo",     href: "emprestimos.html" },
  { icon: "↩️", classe: "acao__icon--orange", label: "Registrar Devolução", href: "devolucoes.html"  },
  { icon: "👥", classe: "acao__icon--blue",   label: "Gerenciar Usuários",  href: "usuarios.html"    },
  { icon: "⚠️", classe: "acao__icon--red",    label: "Ver Multas",          href: "multas.html"      },
];

function primeiraMaiuscula(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}


function renderLivros() {
  const termo = termoBuscaDashboard.toLowerCase().trim();
  const lista = termo
    ? livros.filter(l => [l.titulo, l.autor, l.categoria, l.status].join(" ").toLowerCase().includes(termo))
    : livros;

  document.getElementById("tabela-livros").innerHTML = lista.map(l => `
    <tr>
      <td>
        <div class="livro-cell">
          <span class="livro-thumb" aria-hidden="true">${l.thumb}</span>
          <span>${l.titulo}</span>
        </div>
      </td>
      <td>${l.autor}</td>
      <td>${primeiraMaiuscula(l.categoria)}</td>
      <td><span class="badge badge--green">Disponível</span></td>
    </tr>
  `).join("");
}


function renderEmprestimos() {
  const termo = termoBuscaDashboard.toLowerCase().trim();
  const lista = termo
    ? emprestimos.filter(e => [e.usuario, e.livro, e.dataEmp, e.dataDev].join(" ").toLowerCase().includes(termo))
    : emprestimos;

  document.getElementById("tabela-emprestimos").innerHTML = lista.map(e => `
    <tr>
      <td>${e.usuario}</td>
      <td>${e.livro}</td>
      <td>${e.dataEmp}</td>
      <td class="date-warn">${e.dataDev}</td>
    </tr>
  `).join("");
}


function renderAlertas() {
  const lista = document.getElementById("alertas-list");
  if (alertas.length === 0) {
    lista.innerHTML = "";
    return;
  }

  lista.innerHTML = alertas.map(a => `
    <li class="alerta ${a.classe}" role="listitem">
      <div class="alerta__left">
        <span class="alerta__icon" aria-hidden="true">${a.icon}</span>
        <div class="alerta__texto">
          <p class="alerta__title">${a.titulo}</p>
          <p class="alerta__desc">${a.desc}</p>
        </div>
      </div>
      <button type="button" class="btn-alerta" onclick="window.location.href='${a.href}'">${a.btn} ›</button>
    </li>
  `).join("");
}


function renderAcoes() {
  document.getElementById("acoes-rapidas").innerHTML = acoes.map(a => `
    <li role="listitem">
      <button type="button" class="acao" onclick="window.location.href='${a.href}'">
        <span class="acao__icon ${a.classe}" aria-hidden="true">${a.icon}</span>
        <span class="acao__label">${a.label}</span>
      </button>
    </li>
  `).join("");
}


function initNav() {
  document.querySelectorAll(".nav__link:not(.nav__link--sair)").forEach(link => {
    link.addEventListener("click", function (e) {
      document.querySelectorAll(".nav__link").forEach(l => {
        l.classList.remove("nav__link--active");
        l.removeAttribute("aria-current");
      });
      this.classList.add("nav__link--active");
      this.setAttribute("aria-current", "page");
      fecharMenu();
    });
  });
}


const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const btnMenu = document.getElementById("btn-menu");

function abrirMenu() {
  sidebar.classList.add("is-open");
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  btnMenu.setAttribute("aria-expanded", "true");
  btnMenu.setAttribute("aria-label", "Fechar menu lateral");
}

function fecharMenu() {
  sidebar.classList.remove("is-open");
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
  btnMenu.setAttribute("aria-expanded", "false");
  btnMenu.setAttribute("aria-label", "Abrir menu lateral");
}

function initMenu() {
  btnMenu.addEventListener("click", () => {
    sidebar.classList.contains("is-open") ? fecharMenu() : abrirMenu();
  });
  overlay.addEventListener("click", fecharMenu);
  document.addEventListener("keydown", e => { if (e.key === "Escape") fecharMenu(); });
}

function initBuscaDashboard() {
  const busca = document.getElementById("busca");
  if (!busca) return;

  busca.addEventListener("input", () => {
    termoBuscaDashboard = busca.value || "";
    renderLivros();
    renderEmprestimos();
  });
}


function animarContador(id, alvo, duracao = 1200) {
  const el = document.getElementById(id);
  if (!el) return;
  let valor = 0;
  const passo = Math.ceil(alvo / (duracao / 16));
  const timer = setInterval(() => {
    valor += passo;
    if (valor >= alvo) { el.textContent = alvo; clearInterval(timer); }
    else               { el.textContent = valor; }
  }, 16);
}


document.addEventListener("DOMContentLoaded", () => {
  renderLivros();
  renderEmprestimos();
  renderAlertas();
  renderAcoes();
  initNav();
  initMenu();
  initBuscaDashboard();
});


const API_ORIGIN = location.port === "63342" ? "http://localhost:8081" : "";
let atualizandoDashboard = false;
function dataBR(iso) { if (!iso) return ""; const p = iso.split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : iso; }
function hojeIso() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function dataLocal(iso) { const [ano, mes, dia] = iso.split("-").map(Number); return new Date(ano, mes - 1, dia); }
function diasEntre(a, b) { return Math.round((dataLocal(b) - dataLocal(a)) / 86400000); }
function dataCadastroUsuario(u) { return u.dataCadastro || u.criadoEm || u.createdAt || u.createdDate || ""; }
function emprestimoEmAberto(e) {
  const status = String(e.status || "").toUpperCase();
  return status !== "DEVOLVIDO" && status !== "FINALIZADO";
}
function ordenarEmprestimosRecentes(a, b) {
  const dataA = a.dataEmprestimo || "";
  const dataB = b.dataEmprestimo || "";
  if (dataA !== dataB) return dataB.localeCompare(dataA);
  return Number(b.id || 0) - Number(a.id || 0);
}
function atualizarAlertasDashboard(usuariosApi, emprestimosApi) {
  const hoje = hojeIso();
  const clientes = usuariosApi.filter(u => u.tipoUsuario === "CLIENTE");
  const emprestimosClientes = emprestimosApi.filter(e => e.usuario?.tipoUsuario === "CLIENTE");
  const multasPendentes = emprestimosClientes.filter(e => {
    const status = String(e.status || "").toUpperCase();
    const diasAtraso = e.dataPrevistaDevolucao ? diasEntre(e.dataPrevistaDevolucao, hoje) : 0;
    return status !== "DEVOLVIDO" && (diasAtraso > 0 || Number(e.multa || 0) > 0);
  }).length;
  const devolucoesProximas = emprestimosClientes.filter(e => {
    const status = String(e.status || "").toUpperCase();
    const dias = e.dataPrevistaDevolucao ? diasEntre(hoje, e.dataPrevistaDevolucao) : null;
    return status !== "DEVOLVIDO" && dias !== null && dias >= 0 && dias <= 3;
  }).length;
  const usuariosComData = clientes.filter(u => dataCadastroUsuario(u));
  const usuariosHoje = usuariosComData.filter(u => String(dataCadastroUsuario(u)).slice(0, 10) === hoje).length;
  const tituloUsuarios = usuariosComData.length > 0
    ? `${usuariosHoje} novo${usuariosHoje !== 1 ? "s" : ""} usuário${usuariosHoje !== 1 ? "s" : ""} cadastrado${usuariosHoje !== 1 ? "s" : ""} hoje`
    : `${clientes.length} usuário${clientes.length !== 1 ? "s" : ""} cadastrado${clientes.length !== 1 ? "s" : ""}`;
  const descUsuarios = usuariosComData.length > 0
    ? "Confira os novos cadastros."
    : "Total real de usuários cadastrados no banco.";

  alertas = [
    { classe: "alerta--red", icon: "⚠️", titulo: `${multasPendentes} multa${multasPendentes !== 1 ? "s" : ""} pendente${multasPendentes !== 1 ? "s" : ""}`, desc: "Existem multas atrasadas que precisam ser verificadas.", btn: "Ver multas", href: "multas.html" },
    { classe: "alerta--orange", icon: "⏰", titulo: `${devolucoesProximas} devolu${devolucoesProximas === 1 ? "ção próxima" : "ções próximas"} ao prazo`, desc: "Livros com prazo de devolução próximo.", btn: "Ver empréstimos", href: "emprestimos.html" },
    { classe: "alerta--blue", icon: "ℹ️", titulo: tituloUsuarios, desc: descUsuarios, btn: "Ver usuários", href: "usuarios.html" },
  ];
}
async function carregarDashboardApi() {
  if (atualizandoDashboard) return;
  atualizandoDashboard = true;

  try {
    const resp = await Promise.all([
      fetch(API_ORIGIN + "/livros"),
      fetch(API_ORIGIN + "/usuarios"),
      fetch(API_ORIGIN + "/emprestimos")
    ]);
    if (!resp[0].ok || !resp[1].ok || !resp[2].ok) throw new Error("Erro");

    const livrosApi = await resp[0].json();
    const usuariosApi = await resp[1].json();
    const emprestimosApi = await resp[2].json();
    const clientesApi = usuariosApi.filter(u => u.tipoUsuario === "CLIENTE");

    const emprestimosAbertos = emprestimosApi.filter(emprestimoEmAberto);
    const livrosEmprestadosIds = new Set(
      emprestimosAbertos
        .map(e => e.livro && e.livro.id)
        .filter(Boolean)
    );

    livros = livrosApi
      .map(l => {
        const quantidadeDisponivel = Number(l.quantidadeDisponivel ?? l.quantidade_disponivel ?? l.quantidadeTotal ?? 0);
        const emprestado = livrosEmprestadosIds.has(l.id) || quantidadeDisponivel <= 0;
        return {
          titulo: l.titulo || "",
          autor: l.autor || "",
          categoria: l.categoria || "",
          thumb: "📚",
          status: emprestado ? "Emprestado" : "Disponível"
        };
      })
      .filter(l => l.status === "Disponível");

    emprestimos = emprestimosApi
      .filter(e => e.usuario?.tipoUsuario === "CLIENTE")
      .sort(ordenarEmprestimosRecentes)
      .slice(0, 5)
      .map(e => ({ usuario:e.usuario?.nome || "-", livro:e.livro?.titulo || "-", dataEmp:dataBR(e.dataEmprestimo), dataDev:dataBR(e.dataPrevistaDevolucao) }));
    atualizarAlertasDashboard(usuariosApi, emprestimosApi);

    renderLivros();
    renderEmprestimos();
    renderAlertas();

    animarContador("stat-livros", livrosApi.length);
    animarContador("stat-usuarios", clientesApi.length);
    animarContador("stat-emprestimos", emprestimosAbertos.length);
    animarContador("stat-multas", emprestimosApi.filter(e => Number(e.multa || 0) > 0 || String(e.status || "").toUpperCase() === "ATRASADO").length, 600);
  } catch (erro) {
    livros = [];
    emprestimos = [];
    renderLivros();
    renderEmprestimos();
    alertas = [];
    renderAlertas();
    animarContador("stat-livros", 0);
    animarContador("stat-usuarios", 0);
    animarContador("stat-emprestimos", 0);
    animarContador("stat-multas", 0, 600);
  } finally {
    atualizandoDashboard = false;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  carregarDashboardApi();
  setInterval(carregarDashboardApi, 5000);
  window.addEventListener("focus", carregarDashboardApi);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) carregarDashboardApi();
  });
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
