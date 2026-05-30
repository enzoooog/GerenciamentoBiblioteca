
const AVATAR_CORES = ["av0","av1","av2","av3","av4","av5","av6","av7"];
const COVER_CORES  = ["c1","c2","c3","c4","c5","c6","c7","c8"];
const COVER_HEX    = ["#e74c3c","#f39c12","#1abc9c","#3498db","#9b59b6","#2ecc71","#e91e63","#00bcd4"];
const COVER_EMOJI  = ["📗","📘","📙","📕","📓","📔","📒","📚"];

const CAT_NOMES = {
  romance:"Romance", fantasia:"Fantasia", ficcao:"Ficção Científica",
  programacao:"Programação", negocios:"Negócios & Gestão",
  design:"Design & UI", recrutamento:"Recrutamento", fabula:"Fábula",
};
const CAT_CORES = {
  romance:"red", fantasia:"purple", ficcao:"blue",
  programacao:"teal", negocios:"orange", design:"blue",
  recrutamento:"teal", fabula:"green",
};
const FMT_NOMES = { impresso:"Impresso", ebook:"E-book" };

let USUARIOS = [];

let LIVROS = [];

let emprestimos = [];

let proximoId   = 7;
let editandoId  = null;
let excluindoId = null;
let filtros     = { busca:"", status:"" };


let selUsuarioId = null;
let selLivroId   = null;


function iniciais(nome) {
  return nome.split(" ").slice(0,2).map(p => p[0].toUpperCase()).join("");
}
function avCor(id)    { return AVATAR_CORES[(id-1) % AVATAR_CORES.length]; }
function coverCor(id) { return COVER_CORES[(id-1)  % COVER_CORES.length]; }
function coverHex(id) { return COVER_HEX[(id-1)    % COVER_HEX.length]; }
function coverEmoji(id){ return COVER_EMOJI[(id-1) % COVER_EMOJI.length]; }

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
function diasEntre(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function getUsuario(id) { return USUARIOS.find(u => u.id === id); }
function getLivro(id)   { return LIVROS.find(l => l.id === id); }


function atualizarMetricas() {
  animarContador("m-total",     emprestimos.length);
  animarContador("m-abertos",   emprestimos.filter(e => e.status === "ativo" || e.status === "emprestado").length);
  animarContador("m-atrasados", emprestimos.filter(e => e.status === "atrasado").length);
  animarContador("m-devolvidos",emprestimos.filter(e => e.status === "devolvido").length);
}
function animarContador(id, alvo, dur = 700) {
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


let calAno = new Date().getFullYear();
let calMes = new Date().getMonth();

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function renderCalendario() {
  document.getElementById("cal-title").textContent = `${MESES[calMes]} ${calAno}`;

  const grid    = document.getElementById("cal-days");
  const hoje    = new Date();
  const primDia = new Date(calAno, calMes, 1).getDay();
  const ultDia  = new Date(calAno, calMes+1, 0).getDate();

  
  const mapaEmp = {}; 
  const mapaDev = {}; 

  emprestimos.forEach(e => {
    const u  = getUsuario(e.usuarioId);
    const l  = getLivro(e.livroId);
    const st = e.status === "emprestado" ? "ativo" : e.status;
    const info = {
      status:  st,
      usuario: u ? u.nome : "?",
      livro:   l ? l.titulo : "?",
    };
    if (e.dataEmp) {
      if (!mapaEmp[e.dataEmp]) mapaEmp[e.dataEmp] = [];
      mapaEmp[e.dataEmp].push(info);
    }
    if (e.dataDev) {
      if (!mapaDev[e.dataDev]) mapaDev[e.dataDev] = [];
      mapaDev[e.dataDev].push(info);
    }
  });

  
  function corDominante(lista) {
    if (!lista || lista.length === 0) return null;
    if (lista.some(x => x.status === "atrasado"))  return "atrasado";
    if (lista.some(x => x.status === "ativo"))      return "ativo";
    if (lista.some(x => x.status === "devolvido"))  return "devolvido";
    return "ativo";
  }

  
  function tooltipTxt(lista, tipo) {
    if (!lista) return "";
    return lista.map(x =>
        `${tipo}: ${x.livro} (${x.usuario})`
    ).join("\n");
  }

  let html = "";
  for (let i = 0; i < primDia; i++) {
    html += `<li class="cal-day--other" aria-hidden="true"></li>`;
  }

  for (let d = 1; d <= ultDia; d++) {
    const iso     = `${calAno}-${String(calMes+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const isHoje  = (d === hoje.getDate() && calMes === hoje.getMonth() && calAno === hoje.getFullYear());
    const listEmp = mapaEmp[iso] || null;
    const listDev = mapaDev[iso] || null;
    const hasEmp  = !!listEmp;
    const hasDev  = !!listDev;

    
    let cls = "";
    if (isHoje) {
      cls = "cal-day--today";
    } else if (hasEmp || hasDev) {
      const dominante = corDominante([...(listEmp||[]),...(listDev||[])]);
      cls = `cal-day--status cal-day--${dominante}`;
    }

    
    let tipLines = [];
    if (hasEmp) tipLines.push(...(listEmp.map(x => `📅 Emp: ${x.livro}\n👤 ${x.usuario}`)));
    if (hasDev) tipLines.push(...(listDev.map(x => `📆 Dev: ${x.livro}\n👤 ${x.usuario}`)));
    const tip = tipLines.join("\n─────\n");

    
    let dots = "";
    if (!isHoje && (hasEmp || hasDev)) {
      const todos = [...(listEmp||[]),...(listDev||[])];
      const statuses = [...new Set(todos.map(x => x.status))].slice(0,3);
      dots = `<span class="cal-dots" aria-hidden="true">${statuses.map(s =>
          `<span class="cal-dot cal-dot--${s}"></span>`
      ).join("")}</span>`;
    }

    const ariaLabel = `${d} de ${MESES[calMes]}${isHoje?", hoje":""}${hasEmp?`, ${listEmp.length} empréstimo(s)`:""}${hasDev?`, ${listDev.length} devolução(ões)`:""}`;

    html += `<li class="cal-day ${cls}"
                 aria-label="${ariaLabel}"
                 ${tip ? `data-tip="${tip.replace(/"/g,"'")}"` : ""}>
               <span class="cal-day__num">${d}</span>
               ${dots}
             </li>`;
  }

  grid.innerHTML = html;

  
  grid.querySelectorAll("[data-tip]").forEach(el => {
    el.addEventListener("mouseenter", e => mostrarTooltip(e.currentTarget));
    el.addEventListener("mouseleave", () => esconderTooltip());
  });
}



let tooltipEl = null;

function mostrarTooltip(cel) {
  esconderTooltip();
  const tip = cel.dataset.tip;
  if (!tip) return;
  tooltipEl = document.createElement("aside");
  tooltipEl.className = "cal-tooltip";
  tooltipEl.setAttribute("role","tooltip");
  tip.split("\n─────\n").forEach((bloco, i) => {
    if (i > 0) { const hr = document.createElement("hr"); tooltipEl.appendChild(hr); }
    bloco.split("\n").forEach(linha => {
      const p = document.createElement("p"); p.textContent = linha;
      tooltipEl.appendChild(p);
    });
  });
  document.body.appendChild(tooltipEl);
  const rect = cel.getBoundingClientRect();
  const tw   = tooltipEl.offsetWidth;
  let left   = rect.left + rect.width/2 - tw/2 + window.scrollX;
  let top    = rect.bottom + 8 + window.scrollY;
  if (left + tw > window.innerWidth - 8) left = window.innerWidth - tw - 8;
  if (left < 8) left = 8;
  tooltipEl.style.left = left + "px";
  tooltipEl.style.top  = top  + "px";
}

function esconderTooltip() {
  if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
}
function initCalendario() {
  document.getElementById("cal-prev").addEventListener("click", () => {
    calMes--;
    if (calMes < 0) { calMes = 11; calAno--; }
    renderCalendario();
  });
  document.getElementById("cal-next").addEventListener("click", () => {
    calMes++;
    if (calMes > 11) { calMes = 0; calAno++; }
    renderCalendario();
  });
}


function atualizarPrazo(idEmp, idDev, idOutput) {
  const emp = document.getElementById(idEmp).value;
  const dev = document.getElementById(idDev).value;
  const out = document.getElementById(idOutput);
  if (!out) return;

  if (!emp || !dev) { out.hidden = true; return; }

  const dias = diasEntre(emp, dev);
  if (dias <= 0) {
    out.textContent = "⚠️ A data de devolução deve ser após o empréstimo.";
    out.className = "prazo-preview prazo-preview--danger";
  } else if (dias <= 7) {
    out.textContent = `⚡ Prazo curto: ${dias} dia${dias>1?"s":""} para devolução.`;
    out.className = "prazo-preview prazo-preview--warn";
  } else {
    out.textContent = `✅ Prazo de ${dias} dia${dias>1?"s":""} para devolução.`;
    out.className = "prazo-preview prazo-preview--ok";
  }
  out.hidden = false;
}


function initSearchUsuario() {
  const input   = document.getElementById("f-usuario");
  const lista   = document.getElementById("lista-usuarios");
  const card    = document.getElementById("selected-user");
  const clearBtn= document.getElementById("clear-user");

  function mostrarDropdown(q) {
    const results = USUARIOS.filter(u =>
        u.nome.toLowerCase().includes(q) || u.matricula.includes(q)
    ).slice(0, 6);

    if (!q || results.length === 0) {
      lista.innerHTML = q
          ? `<li class="dropdown__empty">Nenhum usuário encontrado.</li>`
          : "";
      lista.hidden = !q;
      input.setAttribute("aria-expanded", q ? "true" : "false");
      return;
    }

    lista.innerHTML = results.map(u => `
      <li role="option" data-id="${u.id}" tabindex="-1"
          aria-selected="false">
        <span class="dropdown__avatar ${avCor(u.id)}">${iniciais(u.nome)}</span>
        <span class="dropdown__info">
          <strong>${u.nome}</strong>
          <span>${u.matricula} · ${u.tipo}</span>
        </span>
        <span class="dropdown__badge ${u.status === "bloqueado" ? "dropdown__badge--emp" : "dropdown__badge--disp"}">
          ${u.status === "bloqueado" ? "Bloqueado" : "Ativo"}
        </span>
      </li>`).join("");

    lista.hidden = false;
    input.setAttribute("aria-expanded","true");

    lista.querySelectorAll("li[data-id]").forEach(li => {
      li.addEventListener("mousedown", e => {
        e.preventDefault();
        selecionarUsuario(parseInt(li.dataset.id));
      });
    });
  }

  function selecionarUsuario(id) {
    const u = getUsuario(id);
    if (!u) return;
    selUsuarioId = id;
    document.getElementById("f-usuario-id").value = id;
    input.value = "";
    lista.hidden = true;
    input.setAttribute("aria-expanded","false");

    document.getElementById("sel-user-av").className   = `selected-user__avatar ${avCor(u.id)}`;
    document.getElementById("sel-user-av").textContent = iniciais(u.nome);
    document.getElementById("sel-user-nome").textContent = u.nome;
    document.getElementById("sel-user-meta").textContent = `${u.matricula} · ${u.tipo}`;
    card.hidden = false;
    card.style.display = "";
    input.closest("p.field").querySelector(".field__error").textContent = "";
  }

  input.addEventListener("input", () => mostrarDropdown(input.value.toLowerCase().trim()));
  input.addEventListener("focus", () => { if (input.value) mostrarDropdown(input.value.toLowerCase().trim()); });
  input.addEventListener("blur",  () => setTimeout(() => { lista.hidden = true; input.setAttribute("aria-expanded","false"); }, 150));

  clearBtn.addEventListener("click", () => {
    selUsuarioId = null;
    document.getElementById("f-usuario-id").value = "";
    card.hidden = true;
    card.style.display = "none";
    document.getElementById("sel-user-av").textContent = "";
    document.getElementById("sel-user-nome").textContent = "";
    document.getElementById("sel-user-meta").textContent = "";
    input.value = "";
    input.focus();
  });
}


function initSearchLivro() {
  const input   = document.getElementById("f-livro");
  const lista   = document.getElementById("lista-livros");
  const card    = document.getElementById("selected-book");
  const clearBtn= document.getElementById("clear-book");

  function mostrarDropdown(q) {
    const results = LIVROS.filter(l =>
        l.titulo.toLowerCase().includes(q) || l.autor.toLowerCase().includes(q)
    ).slice(0, 6);

    if (!q || results.length === 0) {
      lista.innerHTML = q
          ? `<li class="dropdown__empty">Nenhum livro encontrado.</li>`
          : "";
      lista.hidden = !q;
      input.setAttribute("aria-expanded", q ? "true" : "false");
      return;
    }

    lista.innerHTML = results.map(l => `
      <li role="option" data-id="${l.id}" tabindex="-1">
        <span class="dropdown__cover ${coverCor(l.id)}" style="background:${coverHex(l.id)}33;color:${coverHex(l.id)}">
          ${coverEmoji(l.id)}
        </span>
        <span class="dropdown__info">
          <strong>${l.titulo}</strong>
          <span>${l.autor} · ${CAT_NOMES[l.categoria] || l.categoria}</span>
        </span>
        <span class="dropdown__badge ${l.status === "disponivel" ? "dropdown__badge--disp" : "dropdown__badge--emp"}">
          ${l.status === "disponivel" ? "Disponível" : "Emprestado"}
        </span>
      </li>`).join("");

    lista.hidden = false;
    input.setAttribute("aria-expanded","true");

    lista.querySelectorAll("li[data-id]").forEach(li => {
      li.addEventListener("mousedown", e => {
        e.preventDefault();
        selecionarLivro(parseInt(li.dataset.id));
      });
    });
  }

  function selecionarLivro(id) {
    const l = getLivro(id);
    if (!l) return;
    selLivroId = id;
    document.getElementById("f-livro-id").value = id;
    input.value = "";
    lista.hidden = true;
    input.setAttribute("aria-expanded","false");

    const cov = document.getElementById("sel-book-cover");
    cov.className   = `selected-book__cover ${coverCor(l.id)}`;
    cov.style.background = `${coverHex(l.id)}33`;
    cov.style.color      = coverHex(l.id);
    cov.textContent      = coverEmoji(l.id);

    document.getElementById("sel-book-titulo").textContent = l.titulo;
    document.getElementById("sel-book-autor").textContent  = l.autor;
    document.getElementById("sel-book-cat").textContent    = CAT_NOMES[l.categoria] || l.categoria;
    card.hidden = false;
    card.style.display = "";
    input.closest("p.field").querySelector(".field__error").textContent = "";
  }

  input.addEventListener("input", () => mostrarDropdown(input.value.toLowerCase().trim()));
  input.addEventListener("focus", () => { if (input.value) mostrarDropdown(input.value.toLowerCase().trim()); });
  input.addEventListener("blur",  () => setTimeout(() => { lista.hidden = true; input.setAttribute("aria-expanded","false"); }, 150));

  clearBtn.addEventListener("click", () => {
    selLivroId = null;
    document.getElementById("f-livro-id").value = "";
    card.hidden = true;
    card.style.display = "none";
    document.getElementById("sel-book-cover").textContent = "";
    document.getElementById("sel-book-titulo").textContent = "";
    document.getElementById("sel-book-autor").textContent = "";
    document.getElementById("sel-book-cat").textContent = "";
    input.value = "";
    input.focus();
  });
}


function initForm() {
  const form    = document.getElementById("form-emprestimo");
  const dataEmp = document.getElementById("f-data-emp");
  const dataDev = document.getElementById("f-data-dev");

  
  dataEmp.min = isoHoje();
  dataEmp.value = isoHoje();

  
  dataEmp.addEventListener("change", () => {
    dataDev.min = dataEmp.value;
    if (dataDev.value && dataDev.value < dataEmp.value) dataDev.value = "";
    atualizarPrazo("f-data-emp","f-data-dev","prazo-preview");
  });
  dataDev.addEventListener("change", () => atualizarPrazo("f-data-emp","f-data-dev","prazo-preview"));

  
  document.getElementById("btn-cancelar").addEventListener("click", resetForm);

  form.addEventListener("submit", e => {
    e.preventDefault();

    let valido = true;

    
    if (!selUsuarioId) {
      document.querySelector("#f-usuario").closest("p.field").querySelector(".field__error").textContent = "Selecione um usuário.";
      valido = false;
    }
    
    if (!selLivroId) {
      document.querySelector("#f-livro").closest("p.field").querySelector(".field__error").textContent = "Selecione um livro.";
      valido = false;
    }
    
    if (!dataEmp.value) {
      dataEmp.closest("p.field").querySelector(".field__error").textContent = "Informe a data de empréstimo.";
      valido = false;
    }
    if (!dataDev.value) {
      dataDev.closest("p.field").querySelector(".field__error").textContent = "Informe a data de devolução.";
      valido = false;
    }
    if (dataEmp.value && dataDev.value && dataDev.value <= dataEmp.value) {
      dataDev.closest("p.field").querySelector(".field__error").textContent = "A devolução deve ser após o empréstimo.";
      valido = false;
    }
    if (!valido) return;

    const status = form.querySelector('input[name="status"]:checked').value;
    const obs    = form.observacao.value.trim();

    emprestimos.unshift({
      id: proximoId++,
      usuarioId: selUsuarioId,
      livroId:   selLivroId,
      dataEmp:   dataEmp.value,
      dataDev:   dataDev.value,
      status,
      obs,
    });

    resetForm();
    renderLista();
    renderCalendario();
    atualizarMetricas();
    mostrarToast("Empréstimo registrado com sucesso!");
  });
}

function resetForm() {
  const form = document.getElementById("form-emprestimo");
  form.reset();
  selUsuarioId = null; selLivroId = null;
  document.getElementById("f-usuario-id").value = "";
  document.getElementById("f-livro-id").value   = "";
  document.getElementById("selected-user").hidden = true;
  document.getElementById("selected-book").hidden = true;
  document.getElementById("selected-user").style.display = "none";
  document.getElementById("selected-book").style.display = "none";
  document.getElementById("f-usuario").value = "";
  document.getElementById("f-livro").value   = "";
  document.getElementById("prazo-preview").hidden = true;
  document.getElementById("f-data-emp").value = isoHoje();
  document.getElementById("f-data-dev").value = "";
  document.querySelectorAll(".field__error").forEach(el => el.textContent = "");
  
  const rad = document.querySelector('input[name="status"][value="ativo"]');
  if (rad) rad.checked = true;
}


function empFiltrados() {
  const q = filtros.busca.toLowerCase().trim();
  return emprestimos.filter(e => {
    const u = getUsuario(e.usuarioId);
    const l = getLivro(e.livroId);
    const matchBusca  = !q ||
        (u && u.nome.toLowerCase().includes(q)) ||
        (l && l.titulo.toLowerCase().includes(q));
    const matchStatus = !filtros.status || e.status === filtros.status;
    return matchBusca && matchStatus;
  });
}

const STATUS_LABEL = { ativo:"Em aberto", devolvido:"Devolvido", atrasado:"Atrasado", emprestado:"Em aberto" };

function renderLista() {
  const lista   = document.getElementById("emp-list");
  const emptyEl = document.getElementById("empty-list");
  const arr     = empFiltrados();

  if (arr.length === 0) {
    lista.innerHTML = "";
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  lista.innerHTML = arr.map(e => {
    const u   = getUsuario(e.usuarioId);
    const l   = getLivro(e.livroId);
    const st  = e.status === "emprestado" ? "ativo" : e.status;
    const cor = l ? coverHex(l.id) : "#7c3aed";
    const emo = l ? coverEmoji(l.id) : "📚";

    return `
      <li class="emp-item emp-item--${st}" data-id="${e.id}">
        <span class="emp-item__cover"
              style="background:${cor}22;color:${cor}">${emo}</span>
        <span class="emp-item__info">
          <p class="emp-item__book">${l ? l.titulo : "Livro removido"}</p>
          <p class="emp-item__user">${u ? u.nome : "Usuário removido"}</p>
          <p class="emp-item__dates">
            📅 ${fmtData(e.dataEmp)} → 📆 ${fmtData(e.dataDev)}
          </p>
        </span>
        <span class="emp-item__status emp-item__status--${st}">
          ${STATUS_LABEL[e.status] || e.status}
        </span>
        <span class="emp-item__actions">
          <button type="button" class="btn-icon"
                  onclick="abrirEdicao(${e.id})"
                  aria-label="Editar empréstimo">✏️</button>
          <button type="button" class="btn-icon btn-icon--del"
                  onclick="abrirExcluir(${e.id})"
                  aria-label="Excluir empréstimo">🗑</button>
        </span>
      </li>`;
  }).join("");
}


function initFiltros() {
  document.getElementById("busca-emp").addEventListener("input", e => {
    filtros.busca = e.target.value; renderLista();
  });
  document.getElementById("filtro-status").addEventListener("change", e => {
    filtros.status = e.target.value; renderLista();
  });
}


const modal = document.getElementById("modal");

function abrirEdicao(id) {
  const e = emprestimos.find(x => x.id === id);
  if (!e) return;
  editandoId = id;

  const u = getUsuario(e.usuarioId);
  const l = getLivro(e.livroId);

  document.getElementById("modal-info").innerHTML =
      `<strong>${l ? l.titulo : "?"}</strong> para <strong>${u ? u.nome : "?"}</strong>`;

  document.getElementById("e-data-emp").value = e.dataEmp;
  document.getElementById("e-data-dev").value = e.dataDev;
  const rad = document.querySelector(`input[name="e_status"][value="${e.status}"]`);
  if (rad) rad.checked = true;
  document.getElementById("e-obs").value = e.obs || "";

  modal.showModal();
}

function initModal() {
  document.getElementById("modal-close").addEventListener("click",    () => { modal.close(); editandoId = null; });
  document.getElementById("modal-cancelar").addEventListener("click", () => { modal.close(); editandoId = null; });
  modal.addEventListener("click", e => { if (e.target === modal) { modal.close(); editandoId = null; } });

  document.getElementById("form-editar").addEventListener("submit", ev => {
    ev.preventDefault();
    if (!editandoId) return;

    const idx = emprestimos.findIndex(x => x.id === editandoId);
    if (idx === -1) return;

    emprestimos[idx].dataEmp = document.getElementById("e-data-emp").value;
    emprestimos[idx].dataDev = document.getElementById("e-data-dev").value;
    emprestimos[idx].status  = document.querySelector('input[name="e_status"]:checked').value;
    emprestimos[idx].obs     = document.getElementById("e-obs").value.trim();

    modal.close(); editandoId = null;
    renderLista(); renderCalendario(); atualizarMetricas();
    mostrarToast("Empréstimo atualizado com sucesso!");
  });
}


const modalExcluir = document.getElementById("modal-excluir");

function abrirExcluir(id) {
  const e = emprestimos.find(x => x.id === id);
  if (!e) return;
  excluindoId = id;
  const u = getUsuario(e.usuarioId);
  const l = getLivro(e.livroId);
  document.getElementById("excluir-info").textContent =
      `"${l ? l.titulo : "?"}" para ${u ? u.nome : "?"}`;
  modalExcluir.showModal();
}

function initModalExcluir() {
  document.getElementById("excluir-close").addEventListener("click",    () => { modalExcluir.close(); excluindoId = null; });
  document.getElementById("excluir-cancelar").addEventListener("click", () => { modalExcluir.close(); excluindoId = null; });
  modalExcluir.addEventListener("click", e => { if (e.target === modalExcluir) { modalExcluir.close(); excluindoId = null; } });

  document.getElementById("excluir-confirmar").addEventListener("click", () => {
    emprestimos = emprestimos.filter(x => x.id !== excluindoId);
    modalExcluir.close(); excluindoId = null;
    renderLista(); renderCalendario(); atualizarMetricas();
    mostrarToast("Empréstimo excluído.", "warn");
  });
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
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !modal.open && !modalExcluir.open) fechar();
  });
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


function initFab() {
  document.getElementById("btn-fab").addEventListener("click", () => {
    document.getElementById("f-usuario").scrollIntoView({ behavior:"smooth", block:"center" });
    setTimeout(() => document.getElementById("f-usuario").focus(), 400);
  });
}


document.addEventListener("DOMContentLoaded", () => {
  initSearchUsuario();
  initSearchLivro();
  initForm();
  initFiltros();
  initCalendario();
  initModal();
  initModalExcluir();
  initMenu();
  initNav();
  initFab();

  renderCalendario();
  renderLista();
  atualizarMetricas();
});


const API_ORIGIN = location.port === "63342" ? "http://localhost:8081" : "";
const USUARIOS_API = API_ORIGIN + "/usuarios";
const LIVROS_API = API_ORIGIN + "/livros";
const EMPRESTIMOS_API = API_ORIGIN + "/emprestimos";
function normalizarUsuarioApi(u) { return { id:u.id, nome:u.nome || "", matricula:u.cpf || "", tipo:u.tipoUsuario || "Cliente", status:"ativo" }; }
function normalizarLivroApi(l) { return { id:l.id, titulo:l.titulo || "", autor:l.autor || "", categoria:l.categoria || "", formato:"impresso", status:Number(l.quantidadeDisponivel || 0) > 0 ? "disponivel" : "emprestado" }; }
function normalizarEmprestimoApi(e) { return { id:e.id, usuarioId:e.usuario && e.usuario.id, livroId:e.livro && e.livro.id, dataEmp:e.dataEmprestimo, dataDev:e.dataPrevistaDevolucao, status:String(e.status || "ATIVO").toLowerCase(), obs:"" }; }
async function carregarEmprestimosApi() {
  try { const r = await Promise.all([fetch(USUARIOS_API), fetch(LIVROS_API), fetch(EMPRESTIMOS_API)]); if (!r[0].ok || !r[1].ok || !r[2].ok) throw new Error("Erro"); USUARIOS = (await r[0].json()).filter(u => u.tipoUsuario === "CLIENTE").map(normalizarUsuarioApi); LIVROS = (await r[1].json()).map(normalizarLivroApi); emprestimos = (await r[2].json()).map(normalizarEmprestimoApi); proximoId = emprestimos.length ? Math.max(...emprestimos.map(e => e.id || 0)) + 1 : 1; renderLista(); renderCalendario(); atualizarMetricas(); }
  catch (erro) { USUARIOS = []; LIVROS = []; emprestimos = []; renderLista(); renderCalendario(); atualizarMetricas(); mostrarToast("Erro ao carregar dados do banco de dados.", "error"); }
}
document.addEventListener("DOMContentLoaded", () => {
  carregarEmprestimosApi();
  document.getElementById("form-emprestimo")?.addEventListener("submit", async e => {
    e.preventDefault(); e.stopImmediatePropagation(); if (!selUsuarioId || !selLivroId) return;
    const dataEmprestimo = document.getElementById("f-data-emp").value || isoHoje();
    const dataPrevistaDevolucao = document.getElementById("f-data-dev").value;
    try { const resp = await fetch(EMPRESTIMOS_API + "?usuarioId=" + selUsuarioId + "&livroId=" + selLivroId + "&dataEmprestimo=" + encodeURIComponent(dataEmprestimo) + "&dataPrevistaDevolucao=" + encodeURIComponent(dataPrevistaDevolucao), { method:"POST" }); if (!resp.ok) throw new Error(await resp.text()); resetForm(); await carregarEmprestimosApi(); mostrarToast("Empréstimo registrado com sucesso!"); }
    catch (erro) { mostrarToast("Erro ao registrar empréstimo no banco de dados.", "error"); }
  }, true);
  document.getElementById("excluir-confirmar")?.addEventListener("click", async e => {
    e.preventDefault(); e.stopImmediatePropagation(); if (!excluindoId) return;
    try { const resp = await fetch(EMPRESTIMOS_API + "/" + excluindoId, { method:"DELETE" }); if (!resp.ok) throw new Error(await resp.text()); modalExcluir.close(); excluindoId = null; await carregarEmprestimosApi(); mostrarToast("Empréstimo excluído.", "warn"); }
    catch (erro) { mostrarToast("Erro ao excluir empréstimo do banco de dados.", "error"); }
  }, true);
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("form-editar")?.addEventListener("submit", async ev => {
    ev.preventDefault();
    ev.stopImmediatePropagation();
    if (!editandoId) return;

    const atual = emprestimos.find(x => x.id === editandoId);
    if (!atual) return;

    try {
      const resp = await fetch(EMPRESTIMOS_API + "/" + editandoId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataEmprestimo: document.getElementById("e-data-emp").value,
          dataPrevistaDevolucao: document.getElementById("e-data-dev").value,
          status: document.querySelector('input[name="e_status"]:checked').value.toUpperCase(),
          usuario: { id: atual.usuarioId },
          livro: { id: atual.livroId }
        })
      });

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      modal.close();
      editandoId = null;
      await carregarEmprestimosApi();
      mostrarToast("Empréstimo atualizado com sucesso!");
    } catch (erro) {
      mostrarToast("Erro ao atualizar empréstimo no banco de dados.", "error");
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

    if (nomeEl) nomeEl.textContent = usuario.nome || "Usuário";
    if (emailEl && usuario.email) emailEl.textContent = usuario.email;
    card.setAttribute("aria-label", "Usuário logado: " + (usuario.nome || "Usuário"));
  });
}

document.addEventListener("DOMContentLoaded", atualizarCardUsuarioLogado);
