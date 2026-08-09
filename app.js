/*
  Central Beer
  Login do dono: e-mail + senha
  Administradores:
  - bryanyttcontato@gmail.com
  - dalemengo9@gmail.com
*/

const SUPABASE_URL = "https://uvotghmxngvjdtfcbgcl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Hh2haDTRjBANOa37q6VHvw_WT6IY9FR";

const ADMIN_EMAILS = [
  "bryanyttcontato@gmail.com",
  "dalemengo9@gmail.com"
];

const configured =
  !SUPABASE_URL.includes("COLE_SUA") &&
  !SUPABASE_ANON_KEY.includes("COLE_SUA");

const sb = configured
  ? window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    )
  : null;

const $ = (id) => document.getElementById(id);

const isAdmin = (email) =>
  !!email &&
  ADMIN_EMAILS.includes(email.toLowerCase());

const money = (v) =>
  v !== null && v !== undefined
    ? `R$ ${Number(v).toFixed(2).replace(".", ",")}`
    : "";

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}


/* =========================
   LISTAS PÚBLICAS
========================= */

function showList(target, items, type) {
  const el = $(target);

  if (!el) return;

  if (!items.length) {
    el.innerHTML = `
      <div class="empty">
        ${
          type === "promo"
            ? "Sem promoções cadastradas"
            : "Nenhum evento cadastrado"
        }
        <br>
        <span class="muted">
          Adicione pelo painel do dono.
        </span>
      </div>
    `;
    return;
  }

  el.innerHTML = items.map(x => {

    if (type === "promo") {
      return `
        <article class="card">
          <h3>
            🔥 ${escapeHtml(x.nome)}
          </h3>

          ${
            x.preco !== null && x.preco !== undefined
              ? `<div class="price">${money(x.preco)}</div>`
              : ""
          }

          <p>
            ${escapeHtml(x.descricao || "")}
          </p>
        </article>
      `;
    }

    return `
      <article class="card">

        <h3>
          🎉 ${escapeHtml(x.nome)}
        </h3>

        ${
          x.data_hora
            ? `<div class="date">
                📅 ${escapeHtml(x.data_hora)}
               </div>`
            : ""
        }

        <p>
          ${escapeHtml(x.descricao || "")}
        </p>

      </article>
    `;

  }).join("");
}


async function loadPublic() {

  if (!sb) {
    showList("promocoesList", [], "promo");
    showList("eventosList", [], "event");
    return;
  }

  const [p, e] = await Promise.all([

    sb
      .from("promocoes")
      .select("*")
      .order("created_at", {
        ascending: false
      }),

    sb
      .from("eventos")
      .select("*")
      .order("created_at", {
        ascending: false
      })

  ]);

  if (p.error) {
    console.error("Erro nas promoções:", p.error);
  }

  if (e.error) {
    console.error("Erro nos eventos:", e.error);
  }

  showList(
    "promocoesList",
    p.data || [],
    "promo"
  );

  showList(
    "eventosList",
    e.data || [],
    "event"
  );
}


/* =========================
   MODAL
========================= */

function modal(html) {

  const old =
    document.querySelector(".modal");

  if (old) old.remove();

  const m =
    document.createElement("div");

  m.className = "modal";

  m.innerHTML = `
    <div class="modal-box">
      ${html}
    </div>
  `;

  document.body.appendChild(m);

  return m;
}


function bindClose() {

  const close =
    document.querySelector(".close");

  if (close) {

    close.addEventListener(
      "click",
      () => {
        document
          .querySelector(".modal")
          ?.remove();
      }
    );

  }
}


/* =========================
   LOGIN DO DONO
========================= */

$("adminBtn").onclick = async () => {

  if (!sb) {

    modal(`
      <button class="close">×</button>

      <h2 class="admin-title">
        ⚙️ Painel do dono
      </h2>

      <div class="notice">
        O site ainda não está conectado
        ao Supabase.
      </div>
    `);

    bindClose();
    return;
  }


  const {
    data: {
      session
    }
  } = await sb.auth.getSession();


  /* Já está logado */

  if (session) {

    if (!isAdmin(session.user.email)) {

      await sb.auth.signOut();

      alert(
        "Este acesso não é autorizado."
      );

      return;
    }

    openAdmin();

    return;
  }


  /* Tela de login */

  const m = modal(`

    <button class="close">
      ×
    </button>

    <div class="login">

      <h2 class="admin-title">
        ⚙️ Acesso do dono
      </h2>

      <p class="muted">
        Entre com seu e-mail e senha.
      </p>

      <input
        id="loginEmail"
        class="field"
        type="email"
        placeholder="E-mail"
      >

      <input
        id="loginPassword"
        class="field"
        type="password"
        placeholder="Senha"
      >

      <button
        id="loginBtn"
        class="gold-btn"
      >
        Entrar
      </button>

      <p
        id="loginMsg"
        class="muted"
      ></p>

    </div>
  `);

  bindClose();


  $("loginBtn").onclick =
    async () => {

      const email =
        $("loginEmail")
          .value
          .trim()
          .toLowerCase();

      const password =
        $("loginPassword")
          .value;


      if (!email || !password) {

        $("loginMsg").textContent =
          "Digite o e-mail e a senha.";

        return;
      }


      if (!isAdmin(email)) {

        $("loginMsg").textContent =
          "Este e-mail não é autorizado.";

        return;
      }


      $("loginBtn").disabled = true;

      $("loginMsg").textContent =
        "Entrando...";


      const {
        data,
        error
      } =
        await sb.auth.signInWithPassword({
          email,
          password
        });


      if (error) {

        $("loginBtn").disabled = false;

        $("loginMsg").textContent =
          "Erro: " + error.message;

        return;
      }


      if (
        !data.user ||
        !isAdmin(data.user.email)
      ) {

        await sb.auth.signOut();

        $("loginBtn").disabled = false;

        $("loginMsg").textContent =
          "Este e-mail não é autorizado.";

        return;
      }


      m.remove();

      openAdmin();
    };
};


/* =========================
   PAINEL ADMIN
========================= */

async function openAdmin() {

  const m = modal(`

    <button class="close">
      ×
    </button>

    <h2 class="admin-title">
      ⚙️ Painel do dono
    </h2>

    <div class="notice">
      Administradores autorizados:
      <br>
      <b>bryanyttcontato@gmail.com</b>
      <br>
      <b>dalemengo9@gmail.com</b>
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
        placeholder="Descrição do evento"
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

      <p class="muted">
        Esta área é privada para os administradores.
      </p>

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


    <button
      id="logout"
      class="dark-btn"
    >
      Sair
    </button>

  `);

  bindClose();


  /* SAIR */

  $("logout").onclick =
    async () => {

      await sb.auth.signOut();

      m.remove();
    };


  /* PROMOÇÃO */

  $("addPromo").onclick =
    async () => {

      const nome =
        $("pNome").value.trim();

      const preco =
        parseFloat(
          $("pPreco").value
        );

      const descricao =
        $("pDesc").value.trim();


      if (!nome) {

        alert(
          "Digite o nome da promoção."
        );

        return;
      }


      const r =
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


      if (r.error) {

        alert(
          r.error.message
        );

        return;
      }


      $("pNome").value = "";
      $("pPreco").value = "";
      $("pDesc").value = "";


      await refreshAdmin();
      await loadPublic();
    };


  /* EVENTO */

  $("addEvent").onclick =
    async () => {

      const nome =
        $("eNome").value.trim();

      const data_hora =
        $("eData").value.trim();

      const descricao =
        $("eDesc").value.trim();


      if (!nome) {

        alert(
          "Digite o nome do evento."
        );

        return;
      }


      const r =
        await sb
          .from("eventos")
          .insert({
            nome,
            data_hora,
            descricao
          });


      if (r.error) {

        alert(
          r.error.message
        );

        return;
      }


      $("eNome").value = "";
      $("eData").value = "";
      $("eDesc").value = "";


      await refreshAdmin();
      await loadPublic();
    };


  /* DÍVIDA */

  $("addDebt").onclick =
    async () => {

      const nome =
        $("dNome").value.trim();

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


      const r =
        await sb
          .from("dividas")
          .insert({
            nome,
            valor,
            pago: false
          });


      if (r.error) {

        alert(
          r.error.message
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

  const [
    p,
    e,
    d
  ] = await Promise.all([

    sb
      .from("promocoes")
      .select("*")
      .order(
        "created_at",
        { ascending: false }
      ),

    sb
      .from("eventos")
      .select("*")
      .order(
        "created_at",
        { ascending: false }
      ),

    sb
      .from("dividas")
      .select("*")
      .order(
        "created_at",
        { ascending: false }
      )

  ]);


  /* PROMOÇÕES */

  $("pList").innerHTML =
    (p.data || [])
      .map(x => `

        <div class="admin-item">

          <span>
            <b>
              ${escapeHtml(x.nome)}
            </b>

            ${
              x.preco !== null &&
              x.preco !== undefined
                ? money(x.preco)
                : ""
            }
          </span>

          <button
            class="danger"
            onclick="
              deleteRow(
                'promocoes',
                '${x.id}'
              )
            "
          >
            Excluir
          </button>

        </div>

      `)
      .join("")
    ||
    "<span class='muted'>Nenhuma promoção.</span>";


  /* EVENTOS */

  $("eList").innerHTML =
    (e.data || [])
      .map(x => `

        <div class="admin-item">

          <span>

            <b>
              ${escapeHtml(x.nome)}
            </b>

            —
            ${escapeHtml(
              x.data_hora || ""
            )}

          </span>

          <button
            class="danger"
            onclick="
              deleteRow(
                'eventos',
                '${x.id}'
              )
            "
          >
            Excluir
          </button>

        </div>

      `)
      .join("")
    ||
    "<span class='muted'>Nenhum evento.</span>";


  /* DÍVIDAS */

  $("dList").innerHTML =
    (d.data || [])
      .map(x => `

        <div class="admin-item debt">

          <span
            class="${x.pago ? "paid" : ""}"
          >

            <b>
              ${escapeHtml(x.nome)}
            </b>

            —
            ${money(x.valor)}

            ${
              x.pago
                ? "(pago)"
                : ""
            }

          </span>


          <span>

            <button
              class="dark-btn"
              onclick="
                toggleDebt(
                  '${x.id}',
                  ${!x.pago}
                )
              "
            >
              ${
                x.pago
                  ? "Desmarcar"
                  : "Marcar pago"
              }
            </button>


            <button
              class="danger"
              onclick="
                deleteRow(
                  'dividas',
                  '${x.id}'
                )
              "
            >
              Excluir
            </button>

          </span>

        </div>

      `)
      .join("")
    ||
    "<span class='muted'>Nenhuma dívida cadastrada.</span>";
}


/* =========================
   EXCLUIR
========================= */

window.deleteRow =
  async (table, id) => {

    if (
      !confirm(
        "Excluir este item?"
      )
    ) {
      return;
    }


    const r =
      await sb
        .from(table)
        .delete()
        .eq("id", id);


    if (r.error) {

      alert(
        r.error.message
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
  async (id, pago) => {

    const r =
      await sb
        .from("dividas")
        .update({ pago })
        .eq("id", id);


    if (r.error) {

      alert(
        r.error.message
      );

      return;
    }


    await refreshAdmin();
  };


/* =========================
   INICIAR
========================= */

loadPublic();
