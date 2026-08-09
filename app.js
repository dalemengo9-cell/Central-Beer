/*
  CENTRAL BEER
  Painel protegido por senha

  Senha do painel:
  B2013a2018
*/

const SENHA_DONO = "B2013a2018";

const $ = (id) => document.getElementById(id);


/* =========================
   SUPABASE
========================= */

const SUPABASE_URL =
  "https://uvotghmxngvjdtfcbgcl.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_Hh2haDTRjBANOa37q6VHvw_WT6IY9FR";

const sb =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );


/* =========================
   SEGURANÇA DE HTML
========================= */

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );
}


/* =========================
   DINHEIRO
========================= */

function money(value) {
  if (value == null) return "";

  return `R$ ${Number(value)
    .toFixed(2)
    .replace(".", ",")}`;
}


/* =========================
   MODAL
========================= */

function modal(html) {

  document
    .querySelector(".modal")
    ?.remove();

  const m =
    document.createElement("div");

  m.className = "modal";

  m.innerHTML = `
    <div class="modal-box">
      ${html}
    </div>
  `;

  document.body.appendChild(m);

  m.querySelector(".close")
    ?.addEventListener(
      "click",
      () => m.remove()
    );

  return m;
}


/* =========================
   CARREGAR PROMOÇÕES
========================= */

async function loadPromocoes() {

  const element =
    $("promocoesList");

  if (!element) return;

  const result =
    await sb
      .from("promocoes")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (result.error) {

    console.error(result.error);

    element.innerHTML = `
      <div class="empty">
        Erro ao carregar promoções.
      </div>
    `;

    return;
  }

  const items =
    result.data || [];

  if (!items.length) {

    element.innerHTML = `
      <div class="empty">
        Nenhuma promoção cadastrada.
      </div>
    `;

    return;
  }

  element.innerHTML =
    items.map((item) => `

      <article class="card">

        <h3>
          🔥 ${escapeHtml(item.nome)}
        </h3>

        ${
          item.preco != null
            ? `
              <div class="price">
                ${money(item.preco)}
              </div>
            `
            : ""
        }

        <p>
          ${escapeHtml(
            item.descricao || ""
          )}
        </p>

      </article>

    `).join("");
}


/* =========================
   CARREGAR EVENTOS
========================= */

async function loadEventos() {

  const element =
    $("eventosList");

  if (!element) return;

  const result =
    await sb
      .from("eventos")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (result.error) {

    console.error(result.error);

    element.innerHTML = `
      <div class="empty">
        Erro ao carregar eventos.
      </div>
    `;

    return;
  }

  const items =
    result.data || [];

  if (!items.length) {

    element.innerHTML = `
      <div class="empty">
        Nenhum evento cadastrado.
      </div>
    `;

    return;
  }

  element.innerHTML =
    items.map((item) => `

      <article class="card">

        <h3>
          🎉 ${escapeHtml(item.nome)}
        </h3>

        <div class="date">
          📅 ${escapeHtml(
            item.data_hora || ""
          )}
        </div>

        <p>
          ${escapeHtml(
            item.descricao || ""
          )}
        </p>

      </article>

    `).join("");
}


/* =========================
   CARREGAR SITE
========================= */

async function loadPublic() {

  await Promise.all([
    loadPromocoes(),
    loadEventos()
  ]);

}


/* =========================
   LOGIN POR SENHA
========================= */

function openLogin() {

  const m = modal(`

    <button class="close">
      ×
    </button>

    <h2 class="admin-title">
      ⚙️ Painel do dono
    </h2>

    <p class="muted">
      Digite a senha para entrar.
    </p>

    <input
      id="ownerPassword"
      class="field"
      type="password"
      placeholder="Senha"
      autocomplete="off"
    >

    <button
      id="enterAdmin"
      class="gold-btn"
    >
      Entrar
    </button>

    <p
      id="passwordMessage"
      class="muted"
    ></p>

  `);


  const passwordInput =
    $("ownerPassword");

  const button =
    $("enterAdmin");

  const message =
    $("passwordMessage");


  async function login() {

    const password =
      passwordInput.value;

    if (!password) {

      message.textContent =
        "Digite a senha.";

      return;
    }


    if (
      password !==
      SENHA_DONO
    ) {

      message.textContent =
        "Senha incorreta.";

      passwordInput.value = "";

      passwordInput.focus();

      return;
    }


    /*
      Senha correta.
    */

    sessionStorage.setItem(
      "centralBeerAdmin",
      "true"
    );

    m.remove();

    openAdmin();
  }


  button.onclick = login;


  passwordInput
    .addEventListener(
      "keydown",
      (event) => {

        if (
          event.key === "Enter"
        ) {
          login();
        }

      }
    );

}


/* =========================
   VERIFICAR LOGIN
========================= */

function isAdmin() {

  return (
    sessionStorage.getItem(
      "centralBeerAdmin"
    ) === "true"
  );

}


/* =========================
   PAINEL
========================= */

async function openAdmin() {

  if (!isAdmin()) {

    openLogin();

    return;
  }


  const m = modal(`

    <button class="close">
      ×
    </button>

    <h2 class="admin-title">
      ⚙️ Painel do dono
    </h2>

    <div class="notice">
      Acesso autorizado.
    </div>


    <!-- PROMOÇÕES -->

    <div class="form-section">

      <h3>
        🔥 Adicionar promoção
      </h3>

      <input
        id="pNome"
        class="field"
        placeholder="Nome da promoção"
      >

      <input
        id="pPreco"
        class="field"
        type="number"
        step="0.01"
        placeholder="Preço"
      >

      <textarea
        id="pDesc"
        class="field textarea"
        placeholder="Descrição"
      ></textarea>

      <button
        id="addPromo"
        class="gold-btn"
      >
        Adicionar promoção
      </button>

      <div
        id="pList"
        class="admin-list"
      ></div>

    </div>


    <!-- EVENTOS -->

    <div class="form-section">

      <h3>
        🎉 Adicionar evento
      </h3>

      <input
        id="eNome"
        class="field"
        placeholder="Nome do evento"
      >

      <input
        id="eData"
        class="field"
        placeholder="Data e horário"
      >

      <textarea
        id="eDesc"
        class="field textarea"
        placeholder="Descrição"
      ></textarea>

      <button
        id="addEvent"
        class="gold-btn"
      >
        Adicionar evento
      </button>

      <div
        id="eList"
        class="admin-list"
      ></div>

    </div>


    <!-- DÍVIDAS -->

    <div class="form-section">

      <h3>
        💰 Controle de dívidas
      </h3>

      <input
        id="dNome"
        class="field"
        placeholder="Nome da pessoa"
      >

      <input
        id="dValor"
        class="field"
        type="number"
        step="0.01"
        placeholder="Valor"
      >

      <button
        id="addDebt"
        class="gold-btn"
      >
        Adicionar dívida
      </button>

      <div
        id="dList"
        class="admin-list"
      ></div>

    </div>


    <!-- SAIR -->

    <div class="form-section">

      <button
        id="logout"
        class="dark-btn"
      >
        Sair
      </button>

    </div>

  `);


  /* =========================
     SAIR
  ========================= */

  $("logout").onclick =
    () => {

      sessionStorage.removeItem(
        "centralBeerAdmin"
      );

      m.remove();

    };


  /* =========================
     ADICIONAR PROMOÇÃO
  ========================= */

  $("addPromo").onclick =
    async () => {

      const nome =
        $("pNome")
          .value
          .trim();

      const preco =
        parseFloat(
          $("pPreco").value
        );

      const descricao =
        $("pDesc")
          .value
          .trim();


      if (!nome) {

        alert(
          "Digite o nome da promoção."
        );

        return;
      }


      const result =
        await sb
          .from("promocoes")
          .insert({

            nome,

            preco:
              Number.isFinite(preco)
                ? preco
                : null,

            descricao

          });


      if (result.error) {

        alert(
          result.error.message
        );

        return;
      }


      $("pNome").value = "";
      $("pPreco").value = "";
      $("pDesc").value = "";


      await refreshAdmin();
      await loadPublic();

    };


  /* =========================
     ADICIONAR EVENTO
  ========================= */

  $("addEvent").onclick =
    async () => {

      const nome =
        $("eNome")
          .value
          .trim();

      const data_hora =
        $("eData")
          .value
          .trim();

      const descricao =
        $("eDesc")
          .value
          .trim();


      if (!nome) {

        alert(
          "Digite o nome do evento."
        );

        return;
      }


      const result =
        await sb
          .from("eventos")
          .insert({

            nome,

            data_hora,

            descricao

          });


      if (result.error) {

        alert(
          result.error.message
        );

        return;
      }


      $("eNome").value = "";
      $("eData").value = "";
      $("eDesc").value = "";


      await refreshAdmin();
      await loadPublic();

    };


  /* =========================
     ADICIONAR DÍVIDA
  ========================= */

  $("addDebt").onclick =
    async () => {

      const nome =
        $("dNome")
          .value
          .trim();

      const valor =
        parseFloat(
          $("dValor").value
        );


      if (
        !nome ||
        !Number.isFinite(valor)
      ) {

        alert(
          "Preencha nome e valor."
        );

        return;
      }


      const result =
        await sb
          .from("dividas")
          .insert({

            nome,

            valor,

            pago: false

          });


      if (result.error) {

        alert(
          result.error.message
        );

        return;
      }


      $("dNome").value = "";
      $("dValor").value = "";


      await refreshAdmin();

    };


  await refreshAdmin();

}


/* =========================
   ATUALIZAR PAINEL
========================= */

async function refreshAdmin() {

  if (!isAdmin()) return;


  const [
    promos,
    eventos,
    dividas
  ] = await Promise.all([

    sb
      .from("promocoes")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      ),

    sb
      .from("eventos")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      ),

    sb
      .from("dividas")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      )

  ]);


  /* PROMOÇÕES */

  $("pList").innerHTML =
    (promos.data || [])
      .map(item => `

        <div class="admin-item">

          <span>
            <b>
              ${escapeHtml(item.nome)}
            </b>

            ${
              item.preco != null
                ? " — " +
                  money(item.preco)
                : ""
            }
          </span>

          <button
            class="danger"
            onclick="deleteRow(
              'promocoes',
              '${item.id}'
            )"
          >
            Excluir
          </button>

        </div>

      `)
      .join("") ||
    "<span class='muted'>" +
    "Nenhuma promoção." +
    "</span>";


  /* EVENTOS */

  $("eList").innerHTML =
    (eventos.data || [])
      .map(item => `

        <div class="admin-item">

          <span>

            <b>
              ${escapeHtml(item.nome)}
            </b>

            —
            ${escapeHtml(
              item.data_hora || ""
            )}

          </span>

          <button
            class="danger"
            onclick="deleteRow(
              'eventos',
              '${item.id}'
            )"
          >
            Excluir
          </button>

        </div>

      `)
      .join("") ||
    "<span class='muted'>" +
    "Nenhum evento." +
    "</span>";


  /* DÍVIDAS */

  $("dList").innerHTML =
    (dividas.data || [])
      .map(item => `

        <div class="admin-item">

          <span>

            <b>
              ${escapeHtml(item.nome)}
            </b>

            —
            ${money(item.valor)}

            ${
              item.pago
                ? " (pago)"
                : ""
            }

          </span>

          <span>

            <button
              class="dark-btn"
              onclick="toggleDebt(
                '${item.id}',
                ${!item.pago}
              )"
            >
              ${
                item.pago
                  ? "Desmarcar"
                  : "Marcar pago"
              }
            </button>

            <button
              class="danger"
              onclick="deleteRow(
                'dividas',
                '${item.id}'
              )"
            >
              Excluir
            </button>

          </span>

        </div>

      `)
      .join("") ||
    "<span class='muted'>" +
    "Nenhuma dívida." +
    "</span>";

}


/* =========================
   EXCLUIR
========================= */

window.deleteRow =
  async function (
    table,
    id
  ) {

    if (!isAdmin()) {

      alert(
        "Acesso negado."
      );

      return;
    }


    if (
      !confirm(
        "Excluir este item?"
      )
    ) {

      return;
    }


    const result =
      await sb
        .from(table)
        .delete()
        .eq(
          "id",
          id
        );


    if (result.error) {

      alert(
        result.error.message
      );

      return;
    }


    await refreshAdmin();
    await loadPublic();

  };


/* =========================
   MARCAR DÍVIDA
========================= */

window.toggleDebt =
  async function (
    id,
    pago
  ) {

    if (!isAdmin()) {

      alert(
        "Acesso negado."
      );

      return;
    }


    const result =
      await sb
        .from("dividas")
        .update({
          pago
        })
        .eq(
          "id",
          id
        );


    if (result.error) {

      alert(
        result.error.message
      );

      return;
    }


    await refreshAdmin();

  };


/* =========================
   BOTÃO DO PAINEL
========================= */

$("adminBtn")
  ?.addEventListener(
    "click",
    () => {

      if (isAdmin()) {

        openAdmin();

      } else {

        openLogin();

      }

    }
  );


/* =========================
   INÍCIO
========================= */

loadPublic();

console.log(
  "Central Beer iniciado."
);
