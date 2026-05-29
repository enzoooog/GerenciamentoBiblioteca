
const COVER_CORES = ["c1","c2","c3","c4","c5","c6","c7","c8"];
const COVER_EMOJIS = ["📖","✍️","🔬","💻","🌍","⚔️","🎨","🚀"];

const CATEGORIA_NOMES = {
  romance:"Romance", fantasia:"Fantasia", ficcao:"Ficção Científica",
  programacao:"Programação", negocios:"Negócios & Gestão",
  design:"Design & UI", recrutamento:"Recrutamento", fabula:"Fábula",
};
const CATEGORIA_CORES = {
  romance:"red", fantasia:"purple", ficcao:"blue",
  programacao:"teal", negocios:"orange",
  design:"blue", recrutamento:"teal", fabula:"green",
};
const FORMATO_NOMES = { impresso:"Impresso", ebook:"E-book" };

let livros = [];

let proximoId = 9;
let livroEditandoId = null;
let livroExcluindoId = null;

function getUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("usuarioLogado"));
  } catch (erro) {
    return null;
  }
}

function usuarioEhAdministrador() {
  const usuario = getUsuarioLogado();
  return usuario && usuario.tipoUsuario === "ADMINISTRADOR";
}

function usuarioEhFuncionario() {
  const usuario = getUsuarioLogado();
  return usuario && (usuario.tipoUsuario === "ADMINISTRADOR" || usuario.tipoUsuario === "BIBLIOTECARIO");
}

function aplicarPermissoesLivros() {
  const fab = document.getElementById("btn-fab");
  if (fab && !usuarioEhAdministrador()) {
    fab.hidden = true;
    fab.style.display = "none";
  }
}


let filtros = { busca: "", categoria: "", status: "" };
let modoView = "cards"; 


function getCorIdx(id) { return (id - 1) % COVER_CORES.length; }
function getEmoji(id)  { return COVER_EMOJIS[(id - 1) % COVER_EMOJIS.length]; }

function livrosFiltrados() {
  const q = filtros.busca.toLowerCase().trim();
  return livros.filter(l => {
    const matchBusca = !q ||
      l.titulo.toLowerCase().includes(q) ||
      l.autor.toLowerCase().includes(q) ||
      l.isbn.toLowerCase().includes(q);
    const matchCat    = !filtros.categoria || l.categoria === filtros.categoria;
    const matchStatus = !filtros.status    || l.status    === filtros.status;
    return matchBusca && matchCat && matchStatus;
  });
}


function renderCards() {
  const grid    = document.getElementById("book-grid");
  const emptyEl = document.getElementById("empty-cards");
  const lista   = livrosFiltrados();

  atualizarContagem(lista.length);

  if (lista.length === 0) {
    grid.innerHTML = "";
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  grid.innerHTML = lista.map(l => {
    const corIdx = getCorIdx(l.id);
    const emoji  = getEmoji(l.id);
    const catNome = CATEGORIA_NOMES[l.categoria] || l.categoria;
    const acoesAdmin = usuarioEhAdministrador() ? `
        <div class="book-card__actions">
          <button type="button" class="btn-edit"
                  onclick="abrirModalEdicao(${l.id})"
                  aria-label="Editar ${l.titulo}">✏️ Editar</button>
          <button type="button" class="btn-delete"
                  onclick="abrirModalExcluir(${l.id})"
                  aria-label="Excluir ${l.titulo}">🗑 Excluir</button>
        </div>` : "";
    return `
      <li class="book-card" data-id="${l.id}">
        <div class="book-card__cover ${COVER_CORES[corIdx]}">
          <span class="cover-status cover-status--${l.status}">
            ${l.status === "disponivel" ? "Disponível" : "Emprestado"}
          </span>
          <div class="book-card__cover-inner">
            <span class="book-card__cover-deco" aria-hidden="true">${emoji}</span>
            <p class="book-card__cover-title">${l.titulo}</p>
          </div>
        </div>
        <div class="book-card__body">
          <p class="book-card__title">${l.titulo}</p>
          <p class="book-card__author">${l.autor}</p>
          <div class="book-card__meta">
            <span class="cat-chip">${catNome}</span>
            <span class="rating-sm">★ ${l.avaliacao}</span>
          </div>
        </div>
        ${acoesAdmin}
      </li>`;
  }).join("");
}


function renderTabela() {
  const tbody   = document.getElementById("table-body");
  const emptyEl = document.getElementById("empty-table");
  const lista   = livrosFiltrados();

  atualizarContagem(lista.length);

  if (lista.length === 0) {
    tbody.innerHTML = "";
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  const COVER_HEX = ["#e74c3c","#f39c12","#1abc9c","#3498db","#9b59b6","#2ecc71","#e91e63","#00bcd4"];

  tbody.innerHTML = lista.map(l => {
    const cor     = COVER_HEX[getCorIdx(l.id)];
    const catNome = CATEGORIA_NOMES[l.categoria] || l.categoria;
    const catCor  = CATEGORIA_CORES[l.categoria] || "blue";
    const emoji   = getEmoji(l.id);
    const fmtNome = FORMATO_NOMES[l.formato] || l.formato;
    const acoesAdmin = usuarioEhAdministrador() ? `
          <div class="row-actions">
            <button type="button" class="btn-row-edit"
                    onclick="abrirModalEdicao(${l.id})"
                    aria-label="Editar ${l.titulo}">✏️ Editar</button>
            <button type="button" class="btn-row-delete"
                    onclick="abrirModalExcluir(${l.id})"
                    aria-label="Excluir ${l.titulo}">🗑 Excluir</button>
          </div>` : "";
    return `
      <tr data-id="${l.id}">
        <td>
          <div class="book-row__cell">
            <div class="book-row__cover" style="background:${cor}22;color:${cor}">${emoji}</div>
            <div>
              <p class="book-row__name">${l.titulo}</p>
              <p class="book-row__detail">${l.ano} · ${l.edicao}</p>
            </div>
          </div>
        </td>
        <td>${l.autor}</td>
        <td>
          <span class="cat-badge">
            <span class="cat-dot cat-dot--${catCor}"></span>${catNome}
          </span>
        </td>
        <td>${fmtNome}</td>
        <td><span style="color:var(--yellow);font-weight:600">★ ${l.avaliacao}</span></td>
        <td>
          <span class="status-badge status-badge--${l.status}">
            ${l.status === "disponivel" ? "Disponível" : "Emprestado"}
          </span>
        </td>
        <td>
          ${acoesAdmin}
        </td>
      </tr>`;
  }).join("");
}


function render() {
  if (modoView === "cards") renderCards();
  else                      renderTabela();
}

function atualizarContagem(n) {
  const el = document.getElementById("results-count");
  if (!el) return;
  el.textContent = n === 0
    ? "Nenhum livro encontrado."
    : `${n} livro${n > 1 ? "s" : ""} encontrado${n > 1 ? "s" : ""}`;
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
    secCards.hidden = false;
    secTable.hidden = true;
    renderCards();
  });

  btnTable.addEventListener("click", () => {
    modoView = "table";
    btnTable.classList.add("view-btn--active");    btnTable.setAttribute("aria-pressed","true");
    btnCards.classList.remove("view-btn--active"); btnCards.setAttribute("aria-pressed","false");
    secTable.hidden = false;
    secCards.hidden = true;
    renderTabela();
  });
}


function initFiltros() {
  const inputBusca  = document.getElementById("busca");
  const selCat      = document.getElementById("filtro-cat");
  const selStatus   = document.getElementById("filtro-status");

  inputBusca.addEventListener("input", () => {
    filtros.busca = inputBusca.value;
    render();
  });
  selCat.addEventListener("change", () => {
    filtros.categoria = selCat.value;
    render();
  });
  selStatus.addEventListener("change", () => {
    filtros.status = selStatus.value;
    render();
  });
}


const modal      = document.getElementById("modal");
const formLivro  = document.getElementById("form-livro");
const modalTitle = document.getElementById("modal-title");

function abrirModal() {
  modal.showModal();
  document.getElementById("f-titulo").focus();
}

function fecharModal() {
  modal.close();
  resetForm();
  livroEditandoId = null;
}

function abrirModalAdicao() {
  if (!usuarioEhAdministrador()) return;
  livroEditandoId = null;
  modalTitle.textContent = "Adicionar Livro";
  document.getElementById("btn-salvar").textContent = "Salvar Livro";
  resetForm();
  abrirModal();
}

function abrirModalEdicao(id) {
  if (!usuarioEhAdministrador()) return;
  const l = livros.find(x => x.id === id);
  if (!l) return;
  livroEditandoId = id;
  modalTitle.textContent = "Editar Livro";
  document.getElementById("btn-salvar").textContent = "Salvar Alterações";

  
  formLivro.titulo.value     = l.titulo;
  formLivro.autor.value      = l.autor;
  formLivro.isbn.value       = l.isbn;
  formLivro.categoria.value  = l.categoria;
  formLivro.ano.value        = l.ano;
  formLivro.edicao.value     = l.edicao;
  if (formLivro.formato) formLivro.formato.value = l.formato;
  formLivro.paginas.value    = l.paginas;
  if (formLivro.dimensao) formLivro.dimensao.value = l.dimensao;
  formLivro.avaliacao.value  = l.avaliacao;
  formLivro.status.value     = l.status;
  formLivro.atribuido.value  = l.atribuido;

  abrirModal();
}


const modalExcluir = document.getElementById("modal-excluir");

function abrirModalExcluir(id) {
  if (!usuarioEhAdministrador()) return;
  const l = livros.find(x => x.id === id);
  if (!l) return;
  livroExcluindoId = id;
  document.getElementById("excluir-nome").textContent = `"${l.titulo}"`;
  modalExcluir.showModal();
}

function fecharModalExcluir() {
  modalExcluir.close();
  livroExcluindoId = null;
}

function initModalExcluir() {
  document.getElementById("excluir-close").addEventListener("click", fecharModalExcluir);
  document.getElementById("excluir-cancelar").addEventListener("click", fecharModalExcluir);

  document.getElementById("excluir-confirmar").addEventListener("click", async () => {
    if (!usuarioEhAdministrador()) return;
    if (!livroExcluindoId) return;
    try {
      const resp = await fetch(LIVROS_API + "/" + livroExcluindoId, { method: "DELETE" });
      if (!resp.ok) throw new Error(await resp.text());
      fecharModalExcluir();
      await carregarLivrosApi();
      mostrarToast("Livro excluido com sucesso!", "error");
    } catch (erro) {
      mostrarToast("Erro ao excluir livro do banco de dados.", "error");
    }
  });

  
  modalExcluir.addEventListener("click", e => {
    if (e.target === modalExcluir) fecharModalExcluir();
  });
}


function validarCampo(el) {
  const field = el.closest(".field");
  const erro  = field ? field.querySelector(".field__error") : null;

  if (el.tagName === "SELECT" && el.closest(".select__wrapper--field")) {
    if (!el.value) {
      el.classList.add("is-invalid");
      if (erro) erro.textContent = "Campo obrigatório.";
      return false;
    }
    el.classList.remove("is-invalid");
    if (erro) erro.textContent = "";
    return true;
  }

  if (!el.validity.valid) {
    el.classList.add("is-invalid");
    if (erro) erro.textContent = "Campo obrigatório.";
    return false;
  }
  el.classList.remove("is-invalid");
  if (erro) erro.textContent = "";
  return true;
}

function resetForm() {
  formLivro.reset();
  formLivro.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
  formLivro.querySelectorAll(".field__error").forEach(el => el.textContent = "");
}

function initForm() {
  
  formLivro.querySelectorAll("input[required], select[required]").forEach(el => {
    el.addEventListener("blur",   () => validarCampo(el));
    el.addEventListener("input",  () => { if (el.classList.contains("is-invalid")) validarCampo(el); });
    el.addEventListener("change", () => { if (el.classList.contains("is-invalid")) validarCampo(el); });
  });

  formLivro.addEventListener("submit", async e => {
    e.preventDefault();
    if (!usuarioEhAdministrador()) return;

    const obrig    = [...formLivro.querySelectorAll("input[required], select[required]")];
    const validos  = obrig.map(validarCampo).every(Boolean);
    if (!validos) {
      obrig.find(el => el.classList.contains("is-invalid"))?.focus();
      return;
    }

    const dados = {
      titulo:    formLivro.titulo.value.trim(),
      autor:     formLivro.autor.value.trim(),
      isbn:      formLivro.isbn.value.trim(),
      categoria: formLivro.categoria.value,
      ano:       formLivro.ano.value,
      edicao:    formLivro.edicao.value.trim(),
      formato:   formLivro.formato ? formLivro.formato.value : "impresso",
      paginas:   formLivro.paginas.value,
      dimensao:  formLivro.dimensao ? formLivro.dimensao.value.trim() : "",
      avaliacao: parseFloat(formLivro.avaliacao.value).toFixed(1),
      status:    formLivro.status.value,
      atribuido: formLivro.atribuido.value.trim(),
    };

    try {
      const editando = !!livroEditandoId;
      const url = editando ? LIVROS_API + "/" + livroEditandoId : LIVROS_API;
      const method = editando ? "PUT" : "POST";
      const resp = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadLivroApi(dados))
      });

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      fecharModal();
      await carregarLivrosApi();
      mostrarToast(editando ? "Livro atualizado com sucesso!" : "Livro adicionado com sucesso!");
    } catch (erro) {
      mostrarToast("Erro ao salvar livro no banco de dados.", "error");
    }
  });
}


let toastTimer = null;

function mostrarToast(msg = "Livro adicionado!", tipo = "success") {
  const toast   = document.getElementById("toast");
  const msgEl   = document.getElementById("toast-msg");
  const iconEl  = document.getElementById("toast-icon");

  msgEl.textContent = msg;
  toast.classList.toggle("toast--error", tipo === "error");
  iconEl.textContent = tipo === "error" ? "✕" : "✓";
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
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.open && !modalExcluir.open) fechar(); });
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


function initModais() {
  
  document.getElementById("btn-fab").addEventListener("click", abrirModalAdicao);
  aplicarPermissoesLivros();

  
  document.getElementById("modal-close").addEventListener("click", fecharModal);
  document.getElementById("btn-cancelar").addEventListener("click", fecharModal);

  
  modal.addEventListener("click", e => { if (e.target === modal) fecharModal(); });
}


document.addEventListener("DOMContentLoaded", () => {
  initToggleView();
  initFiltros();
  initForm();
  initModais();
  initModalExcluir();
  initMenu();
  initNav();
  render(); 
});


const API_ORIGIN = location.port === "63342" ? "http://localhost:8081" : "";
const LIVROS_API = API_ORIGIN + "/livros";
const EMPRESTIMOS_API = API_ORIGIN + "/emprestimos";
function normalizarLivroApi(l) {
  const qtdTotal = Number(l.quantidadeTotal == null ? 1 : l.quantidadeTotal);
  const qtdDisp = Number(l.quantidadeDisponivel == null ? qtdTotal : l.quantidadeDisponivel);
  return { id:l.id, titulo:l.titulo || "", autor:l.autor || "", isbn:l.isbn || "", categoria:l.categoria || "", ano:l.ano || "", edicao:l.edicao || "", formato:l.formato || "impresso", paginas:l.paginas || "", dimensao:l.dimensao || "", avaliacao:l.avaliacao || "0.0", status:qtdDisp > 0 ? "disponivel" : "emprestado", atribuido:l.atribuido || "", quantidadeTotal:qtdTotal, quantidadeDisponivel:qtdDisp };
}
function payloadLivroApi(dados) {
  return {
    titulo: dados.titulo,
    autor: dados.autor,
    isbn: dados.isbn,
    categoria: dados.categoria,
    ano: dados.ano ? Number(dados.ano) : null,
    edicao: dados.edicao,
    formato: dados.formato,
    paginas: dados.paginas ? Number(dados.paginas) : null,
    dimensao: dados.dimensao,
    avaliacao: dados.avaliacao ? Number(dados.avaliacao) : null,
    status: dados.status,
    atribuido: dados.atribuido,
    quantidadeTotal: 1,
    quantidadeDisponivel: dados.status !== "emprestado" ? 1 : 0
  };
}
async function carregarLivrosApi() {
  try {
    const resp = await Promise.all([fetch(LIVROS_API), fetch(EMPRESTIMOS_API)]);
    if (!resp[0].ok || !resp[1].ok) throw new Error("Erro");

    const idsEmprestados = new Set(
      (await resp[1].json())
        .filter(e => ["ATIVO", "ATRASADO"].includes(String(e.status || "").toUpperCase()))
        .map(e => e.livro && e.livro.id)
        .filter(Boolean)
    );

    livros = (await resp[0].json()).map(l => {
      const livro = normalizarLivroApi(l);
      if (idsEmprestados.has(livro.id)) livro.status = "emprestado";
      return livro;
    });

    proximoId = livros.length ? Math.max(...livros.map(l => l.id || 0)) + 1 : 1;
    render();
  }
  catch (erro) { livros = []; render(); mostrarToast("Erro ao carregar dados do banco de dados.", "error"); }
}
document.addEventListener("DOMContentLoaded", () => {
  carregarLivrosApi();

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
