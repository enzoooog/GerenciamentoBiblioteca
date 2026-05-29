const AVATAR_CORES = ["av0","av1","av2","av3","av4","av5","av6","av7"];
const COVER_HEX    = ["#e74c3c","#f39c12","#1abc9c","#3498db","#9b59b6","#2ecc71","#e91e63","#00bcd4"];
const COVER_EMOJI  = ["📗","📘","📙","📕","📓","📔","📒","📚"];
const MULTA_DIA    = 2.00;

let USUARIOS = [];

let LIVROS = [];

let multas = [];

let filtros  = { busca:"", status:"", ord:"valor-desc" };
let modalId  = null;
let detId    = null;
let atualizandoMultas = false;

const METODO_LABEL = { dinheiro:"💵 Dinheiro", pix:"📱 PIX", cartao:"💳 Cartão", transferencia:"🏦 Transferência" };


const getU  = id => USUARIOS.find(u => u.id === id);
const getL  = id => LIVROS.find(l => l.id === id);
const avCor = id => AVATAR_CORES[(id-1) % AVATAR_CORES.length];
const cHex  = id => COVER_HEX[(id-1)   % COVER_HEX.length];
const cEmo  = id => COVER_EMOJI[(id-1)  % COVER_EMOJI.length];
const inic  = nome => nome.split(" ").slice(0,2).map(p=>p[0].toUpperCase()).join("");
const moeda = v => `R$ ${Number(v).toFixed(2).replace(".",",")}`;
const fmtDt = iso => { if(!iso) return "—"; const[y,m,d]=iso.split("-"); return `${d}/${m}/${y}`; };
const hoje  = () => new Date().toISOString().slice(0,10);
const dataLocal = iso => { const [y,m,d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const setText = (id,t) => { const e=document.getElementById(id); if(e) e.textContent=t; };


function atualizarMetricas() {
    const abertas  = multas.filter(m => m.status === "aberto").length;
    const parciais = multas.filter(m => m.status === "parcial").length;
    const recebido = multas.reduce((a,m) => a + m.valorPago, 0);
    const total    = multas.reduce((a,m) => a + m.valorTotal, 0);
    const aberto   = total - recebido;

    animCount("m-aberto",  abertas);
    animCount("m-parcial", parciais);
    setText("m-recebido", moeda(recebido));
    setText("m-total",    moeda(total));

    
    const pct = total > 0 ? Math.round((recebido/total)*100) : 0;
    setText("prog-pct", `${pct}%`);
    const fill  = document.getElementById("prog-fill");
    const track = document.getElementById("prog-track");
    if (fill)  fill.style.width = pct + "%";
    if (track) track.setAttribute("aria-valuenow", pct);
    setText("prog-pago-txt",   `${moeda(recebido)} recebido`);
    setText("prog-aberto-txt", `${moeda(aberto)} em aberto`);
}

function animCount(id, alvo, dur = 700) {
    const el = document.getElementById(id);
    if (!el) return;
    let v = 0;
    const step = Math.max(1, Math.ceil(alvo/(dur/16)));
    const t = setInterval(() => {
        v += step;
        if (v >= alvo) { el.textContent = alvo; clearInterval(t); }
        else el.textContent = v;
    }, 16);
}


function renderTopDevedores() {
    const el = document.getElementById("top-devedores");
    const top = [...multas]
        .filter(m => m.status !== "pago")
        .sort((a,b) => (b.valorTotal - b.valorPago) - (a.valorTotal - a.valorPago))
        .slice(0, 5);

    if (top.length === 0) { el.innerHTML = `<li style="color:var(--text-3);font-size:12px;text-align:center;padding:10px">Sem devedores ativos 🎉</li>`; return; }

    el.innerHTML = top.map((m, i) => {
        const u = getU(m.usuarioId);
        const restante = m.valorTotal - m.valorPago;
        return `
      <li class="top-item">
        <span class="top-item__rank">#${i+1}</span>
        <span class="top-item__av ${avCor(m.usuarioId)}" aria-hidden="true">${u ? inic(u.nome) : "?"}</span>
        <span class="top-item__info">
          <p class="top-item__name">${u ? u.nome : "?"}</p>
          <p class="top-item__sub">${m.diasAtraso} dias · ${u ? u.matricula : ""}</p>
        </span>
        <strong class="top-item__valor">${moeda(restante)}</strong>
      </li>`;
    }).join("");
}


function multasFiltradas() {
    const q = filtros.busca.toLowerCase().trim();
    let arr = multas.filter(m => {
        const u = getU(m.usuarioId);
        const l = getL(m.livroId);
        const okBusca  = !q || (u&&u.nome.toLowerCase().includes(q)) || (l&&l.titulo.toLowerCase().includes(q)) || (u&&u.matricula.includes(q));
        const okStatus = !filtros.status || m.status === filtros.status;
        return okBusca && okStatus;
    });

    switch (filtros.ord) {
        case "valor-desc": arr.sort((a,b) => b.valorTotal - a.valorTotal); break;
        case "dias-desc":  arr.sort((a,b) => b.diasAtraso - a.diasAtraso); break;
        case "data-desc":  arr.sort((a,b) => b.dataMulta.localeCompare(a.dataMulta)); break;
    }
    return arr;
}


function renderTabela() {
    const tbody   = document.getElementById("tbody-multas");
    const emptyEl = document.getElementById("empty-tabela");
    const arr     = multasFiltradas();

    if (arr.length === 0) { tbody.innerHTML = ""; emptyEl.hidden = false; return; }
    emptyEl.hidden = true;

    tbody.innerHTML = arr.map(m => {
        const u    = getU(m.usuarioId);
        const l    = getL(m.livroId);
        const cor  = cHex(m.livroId);
        const emo  = cEmo(m.livroId);
        const rest = m.valorTotal - m.valorPago;
        const pct  = m.valorTotal > 0 ? Math.round((m.valorPago/m.valorTotal)*100) : 0;

        
        const diasCls = m.diasAtraso >= 14 ? "high" : m.diasAtraso >= 7 ? "medium" : "low";
        
        const valCls  = m.status === "pago" ? "green" : m.status === "parcial" ? "orange" : "red";

        const btnPagar = m.status !== "pago"
            ? `<button type="button" class="btn-row btn-row--pay" onclick="abrirModal(${m.id})">💰 Pagar</button>`
            : `<button type="button" class="btn-row btn-row--pay" disabled>✓ Quitado</button>`;

        return `
      <tr data-id="${m.id}">
        <td>
          <span class="user-cell">
            <span class="user-av ${avCor(m.usuarioId)}" aria-hidden="true">${u ? inic(u.nome) : "?"}</span>
            <span>
              <p class="user-cell__name">${u ? u.nome : "—"}</p>
              <p class="user-cell__mat">${u ? u.matricula+" · "+u.tipo : ""}</p>
            </span>
          </span>
        </td>
        <td>
          <span class="book-cell">
            <span class="book-cover" style="background:${cor}22;color:${cor}">${emo}</span>
            <span>
              <p class="book-cell__title">${l ? l.titulo : "—"}</p>
              <p class="book-cell__author">${l ? l.autor : ""}</p>
            </span>
          </span>
        </td>
        <td><span class="dias-badge dias-badge--${diasCls}">⏰ ${m.diasAtraso} dia${m.diasAtraso!==1?"s":""}</span></td>
        <td>
          <strong class="valor-txt valor-txt--${valCls}">${moeda(m.valorTotal)}</strong>
          ${m.valorPago>0 ? `
            <p style="font-size:11px;color:var(--text-3);margin-top:2px">Pago: ${moeda(m.valorPago)}</p>
            <span class="mini-prog-wrap"><span class="mini-prog-fill" style="width:${pct}%"></span></span>` : ""}
        </td>
        <td>
          ${rest > 0
            ? `<strong style="font-size:13px;font-weight:700;color:#fca5a5">${moeda(rest)}</strong><p style="font-size:10px;color:var(--text-3)">a receber</p>`
            : `<strong style="color:#86efac;font-size:13px">—</strong>`}
        </td>
        <td><span class="status-badge status-badge--${m.status}">${m.status==="aberto"?"Em aberto":m.status==="parcial"?"Parcial":"Quitado"}</span></td>
        <td>
          <span class="row-actions">
            ${btnPagar}
            <button type="button" class="btn-row btn-row--det" onclick="abrirDetalhe(${m.id})">Detalhes</button>
          </span>
        </td>
      </tr>`;
    }).join("");
}


const modal = document.getElementById("modal");

function abrirModal(id) {
    const m = multas.find(x => x.id===id);
    if (!m || m.status==="pago") return;
    modalId = id;

    const l=getL(m.livroId), u=getU(m.usuarioId);
    const cor=cHex(m.livroId), emo=cEmo(m.livroId);
    const cov=document.getElementById("resumo-cover");
    cov.style.background=`${cor}22`; cov.style.color=cor; cov.textContent=emo;
    setText("resumo-livro",   l?l.titulo:"?");
    setText("resumo-usuario", u?`👤 ${u.nome} · ${u.matricula}`:"");
    setText("resumo-dias",    `⏰ ${m.diasAtraso} dias de atraso`);
    setText("resumo-valor",   moeda(m.valorTotal));

    const rest=m.valorTotal-m.valorPago;
    const valorPagoEl = document.getElementById("f-valor-pago");
    valorPagoEl.value = rest.toFixed(2);
    valorPagoEl.readOnly = true;
    document.getElementById("f-data-pag").value   = hoje();
    document.getElementById("f-obs").value         = "";
    atualizarResumoPag();
    modal.showModal();
    document.getElementById("f-data-pag").focus();
}

function atualizarResumoPag() {
    const m = multas.find(x=>x.id===modalId);
    if (!m) return;
    const agora = parseFloat(document.getElementById("f-valor-pago").value)||0;
    const saldo = Math.max(0, (m.valorTotal-m.valorPago)-agora);
    setText("pr-total",    moeda(m.valorTotal));
    setText("pr-pago",     moeda(m.valorPago));
    setText("pr-agora",    moeda(agora));
    setText("pr-restante", moeda(saldo));
    const dd=document.getElementById("pr-restante");
    if(dd) dd.style.color = saldo<=0?"#86efac":"#fca5a5";
}

function fecharModal() { modal.close(); modalId=null; }

function initModal() {
    document.getElementById("modal-close").addEventListener("click", fecharModal);
    document.getElementById("btn-cancelar").addEventListener("click", fecharModal);
    modal.addEventListener("click", e => { if(e.target===modal) fecharModal(); });
    document.getElementById("f-valor-pago").addEventListener("input", atualizarResumoPag);

    document.getElementById("form-pagamento").addEventListener("submit", async ev => {
        ev.preventDefault();
        const m = multas.find(x=>x.id===modalId);
        if (!m) return;

        const val  = parseFloat(document.getElementById("f-valor-pago").value);
        const errEl= document.querySelector("#f-valor-pago ~ .field__error");
        if (!val || val<=0) { if(errEl) errEl.textContent="Informe um valor valido."; return; }
        if (errEl) errEl.textContent="";

        try {
            const restante = Math.max(0, m.valorTotal - m.valorPago - val);
            const resp = await fetch(EMPRESTIMOS_API + "/" + m.id, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dataEmprestimo: m.dataEmprestimo,
                    dataPrevistaDevolucao: m.dataPrevistaDevolucao,
                    dataDevolucao: document.getElementById("f-data-pag").value,
                    status: restante <= 0 ? "DEVOLVIDO" : "ATRASADO",
                    multa: restante <= 0 ? m.valorTotal : restante
                })
            });
            if (!resp.ok) throw new Error(await resp.text());

            fecharModal();
            await carregarMultasApi();
            mostrarToast(restante <= 0 ? "Multa quitada com sucesso!" : "Pagamento de " + moeda(val) + " registrado!");
        } catch (erro) {
            mostrarToast("Erro ao salvar pagamento no banco de dados.", "warn");
        }
    });
}


const modalDet = document.getElementById("modal-detalhe");

function abrirDetalhe(id) {
    const m=multas.find(x=>x.id===id);
    if(!m) return;
    const u=getU(m.usuarioId), l=getL(m.livroId);
    const rest=m.valorTotal-m.valorPago;
    document.getElementById("det-body").innerHTML = `
    <dl class="detalhe-grid">
      <dt>Livro</dt>          <dd>${l?l.titulo:"—"}</dd>
      <dt>Autor</dt>          <dd>${l?l.autor:"—"}</dd>
      <dt>Usuário</dt>        <dd>${u?u.nome:"—"}</dd>
      <dt>Matrícula</dt>      <dd>${u?u.matricula:"—"}</dd>
      <dt>Dias de atraso</dt> <dd>${m.diasAtraso} dia${m.diasAtraso!==1?"s":""}</dd>
      <dt>Valor total</dt>    <dd>${moeda(m.valorTotal)}</dd>
      <dt>Valor pago</dt>     <dd style="color:#86efac">${moeda(m.valorPago)}</dd>
      <dt>Saldo</dt>          <dd style="color:${rest>0?"#fca5a5":"#86efac"}">${moeda(rest)}</dd>
      <dt>Status</dt>         <dd>${m.status==="pago"?"✅ Quitado":m.status==="parcial"?"⏳ Parcial":"🔴 Em aberto"}</dd>
      <dt>Data da multa</dt>  <dd>${fmtDt(m.dataMulta)}</dd>
      ${m.dataPag?`<dt>Data pagamento</dt><dd>${fmtDt(m.dataPag)}</dd>`:""}
      ${m.metodo?`<dt>Método</dt><dd>${METODO_LABEL[m.metodo]||m.metodo}</dd>`:""}
      ${m.obs?`<dt>Observação</dt><dd>${m.obs}</dd>`:""}
    </dl>`;
    modalDet.showModal();
}

function initModalDet() {
    document.getElementById("det-close").addEventListener("click", ()=>modalDet.close());
    modalDet.addEventListener("click", e=>{ if(e.target===modalDet) modalDet.close(); });
}


function initFiltros() {
    document.getElementById("busca-top").addEventListener("input", e => {
        filtros.busca = e.target.value; renderTabela();
    });
    document.getElementById("filtro-status").addEventListener("change", e => {
        filtros.status = e.target.value; renderTabela();
    });
    document.getElementById("filtro-ord").addEventListener("change", e => {
        filtros.ord = e.target.value; renderTabela();
    });
}


let toastTimer = null;
function mostrarToast(msg, tipo="success") {
    const toast=document.getElementById("toast");
    const msgEl=document.getElementById("toast-msg");
    const iconEl=document.getElementById("toast-icon");
    toast.classList.remove("toast--warn");
    if(tipo==="warn"){ toast.classList.add("toast--warn"); iconEl.textContent="⚠"; }
    else { iconEl.textContent="✓"; }
    msgEl.textContent=msg;
    toast.hidden=false;
    requestAnimationFrame(()=>toast.classList.add("is-visible"));
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{
        toast.classList.remove("is-visible");
        setTimeout(()=>{ toast.hidden=true; },320);
    },3500);
}


function initMenu() {
    const sidebar=document.getElementById("sidebar");
    const overlay=document.getElementById("overlay");
    const btn=document.getElementById("btn-menu");
    const abrir =()=>{ sidebar.classList.add("is-open");    overlay.classList.add("is-open");    btn.setAttribute("aria-expanded","true"); };
    const fechar=()=>{ sidebar.classList.remove("is-open"); overlay.classList.remove("is-open"); btn.setAttribute("aria-expanded","false"); };
    btn.addEventListener("click",()=>sidebar.classList.contains("is-open")?fechar():abrir());
    overlay.addEventListener("click",fechar);
    document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!modal.open&&!modalDet.open) fechar(); });
}

function initNav() {
    document.querySelectorAll(".nav__link:not(.nav__link--sair)").forEach(link=>{
        link.addEventListener("click",ev=>{
            if(link.href&&!link.href.endsWith("#")) return;
            ev.preventDefault();
            document.querySelectorAll(".nav__link").forEach(l=>{l.classList.remove("nav__link--active");l.removeAttribute("aria-current");});
            link.classList.add("nav__link--active"); link.setAttribute("aria-current","page");
            document.getElementById("sidebar").classList.remove("is-open");
            document.getElementById("overlay").classList.remove("is-open");
        });
    });
}


const API_ORIGIN = location.port === "63342" ? "http://localhost:8081" : "";
const USUARIOS_API = API_ORIGIN + "/usuarios";
const LIVROS_API = API_ORIGIN + "/livros";
const EMPRESTIMOS_API = API_ORIGIN + "/emprestimos";

function normalizarUsuarioApi(u) {
    return { id:u.id, nome:u.nome || "", matricula:u.cpf || "", tipo:u.tipoUsuario || "Cliente" };
}

function normalizarLivroApi(l) {
    return { id:l.id, titulo:l.titulo || "", autor:l.autor || "" };
}

function diasAtrasoEmprestimo(e) {
    const prevista = e.dataPrevistaDevolucao;
    if (!prevista) return 0;
    const final = e.dataDevolucao || hoje();
    const diff = Math.floor((dataLocal(final) - dataLocal(prevista)) / 86400000);
    return Math.max(0, diff);
}

function multaDeEmprestimo(e) {
    const statusApi = String(e.status || "").toUpperCase();
    const multaBanco = Number(e.multa || 0);
    const dias = diasAtrasoEmprestimo(e);
    const valorCalculado = dias * MULTA_DIA;
    const valor = statusApi === "DEVOLVIDO" && multaBanco > 0 ? multaBanco : valorCalculado;
    const pago = statusApi === "DEVOLVIDO" && valor > 0;
    return {
        id: e.id,
        usuarioId: e.usuario && e.usuario.id,
        livroId: e.livro && e.livro.id,
        diasAtraso: dias,
        valorTotal: valor,
        valorPago: pago ? valor : 0,
        status: pago ? "pago" : valor > 0 ? "aberto" : "pago",
        dataMulta: e.dataDevolucao || e.dataPrevistaDevolucao,
        dataPag: pago ? e.dataDevolucao : null,
        metodo: "",
        obs: "",
        dataEmprestimo: e.dataEmprestimo,
        dataPrevistaDevolucao: e.dataPrevistaDevolucao,
        dataDevolucao: e.dataDevolucao
    };
}

async function carregarMultasApi() {
    if (atualizandoMultas) return;
    atualizandoMultas = true;

    try {
        const resp = await Promise.all([
            fetch(USUARIOS_API),
            fetch(LIVROS_API),
            fetch(EMPRESTIMOS_API)
        ]);
        if (!resp[0].ok || !resp[1].ok || !resp[2].ok) throw new Error("Erro ao carregar multas");

        USUARIOS = (await resp[0].json()).map(normalizarUsuarioApi);
        LIVROS = (await resp[1].json()).map(normalizarLivroApi);
        multas = (await resp[2].json()).map(multaDeEmprestimo).filter(m => m.valorTotal > 0);

        renderTabela();
        renderTopDevedores();
        atualizarMetricas();
    } catch (erro) {
        USUARIOS = [];
        LIVROS = [];
        multas = [];
        renderTabela();
        renderTopDevedores();
        atualizarMetricas();
        mostrarToast("Erro ao carregar dados do banco de dados.", "warn");
    } finally {
        atualizandoMultas = false;
    }
}


document.addEventListener("DOMContentLoaded", () => {
    initFiltros(); initModal(); initModalDet(); initMenu(); initNav();
    carregarMultasApi();
    setInterval(carregarMultasApi, 10000);
    window.addEventListener("focus", carregarMultasApi);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) carregarMultasApi();
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
