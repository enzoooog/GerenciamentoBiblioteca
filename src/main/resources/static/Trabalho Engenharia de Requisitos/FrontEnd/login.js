function switchTab(tab) {
    const login = document.getElementById("painel-login");
    const cadastro = document.getElementById("painel-cadastro");

    const tabLogin = document.getElementById("tab-login");
    const tabCadastro = document.getElementById("tab-cadastro");

    if (tab === "login") {
        login.classList.add("active");
        cadastro.classList.remove("active");

        tabLogin.classList.add("active");
        tabCadastro.classList.remove("active");
    } else {
        cadastro.classList.add("active");
        login.classList.remove("active");

        tabCadastro.classList.add("active");
        tabLogin.classList.remove("active");
    }
}


async function fazerLogin() {
  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;
  const origem = location.port === "63342" ? "http://localhost:8081" : "";

  try {
    const resposta = await fetch(origem + "/usuarios/email/" + encodeURIComponent(email));
    if (!resposta.ok) {
      throw new Error("Usuário não encontrado");
    }

    const usuario = await resposta.json();
    const perfilValido = usuario.tipoUsuario === "ADMINISTRADOR" || usuario.tipoUsuario === "BIBLIOTECARIO";

    if (!perfilValido || usuario.senha !== senha) {
      throw new Error("Login inválido");
    }

    localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
    window.location.href = "dashboard.html";
  } catch (erro) {
    mostrarToast("E-mail, senha ou perfil inválido.");
  }
}

async function fazerCadastro() {
  const form = document.querySelector("#painel-cadastro form");
  const campos = form.querySelectorAll("input, select");
  const perfil = campos[5].value;

  const usuario = {
    nome: campos[0].value.trim(),
    email: campos[1].value.trim(),
    senha: campos[2].value,
    cpf: campos[3].value.replace(/\D/g, ""),
    telefone: campos[4].value.replace(/\D/g, ""),
    tipoUsuario: tipoUsuarioApi(perfil)
  };

  try {
    const origem = location.port === "63342" ? "http://localhost:8081" : "";
    const resposta = await fetch(origem + "/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuario)
    });

    if (!resposta.ok) {
      throw new Error(await obterMensagemErro(resposta));
    }

    form.reset();
    mostrarToast("Conta criada com sucesso!");
    switchTab("login");
  } catch (erro) {
    const mensagem = erro.message.includes("CPF")
      ? erro.message
      : erro.message.includes("Telefone")
        ? erro.message
        : erro.message.includes("E-mail")
          ? erro.message
          : "Erro ao criar conta.";

    mostrarToast(mensagem);
  }
}

function tipoUsuarioApi(perfil) {
  const valor = perfil
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (valor.includes("admin")) {
    return "ADMINISTRADOR";
  }

  if (valor.includes("bibliotec")) {
    return "BIBLIOTECARIO";
  }

  return "CLIENTE";
}

async function obterMensagemErro(resposta) {
  const texto = await resposta.text();

  try {
    const erro = JSON.parse(texto);
    return erro.message || "Erro ao criar conta.";
  } catch {
    return texto || "Erro ao criar conta.";
  }
}

function switchTab(tab) {
    const container = document.querySelector(".container-form");

    const tabLogin = document.getElementById("tab-login");
    const tabCadastro = document.getElementById("tab-cadastro");

    if (tab === "login") {
        container.classList.remove("cadastro");
        container.classList.add("login");

        tabLogin.classList.add("active");
        tabCadastro.classList.remove("active");
    } else {
        container.classList.remove("login");
        container.classList.add("cadastro");

        tabCadastro.classList.add("active");
        tabLogin.classList.remove("active");
    }
}

function formatarCPF(valor) {
  valor = valor.replace(/\D/g, ''); 

  valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
  valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
  valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

  return valor;
}

const inputCPF = document.getElementById('cadastro-cpf');

inputCPF.addEventListener('input', (e) => {
  let valor = e.target.value.replace(/\D/g, '');

  
  if (valor.length > 11) {
    valor = valor.slice(0, 11);
  }

  
  valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
  valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
  valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

  e.target.value = valor;
});

function mostrarToast(mensagem) {
  const container = document.getElementById('toast-container');

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = mensagem;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

