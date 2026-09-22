"use strict";

/* =========================================================
   NOVA ADMIN DASHBOARD
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

let currentAdmin = null;
let allUsers = [];
let allOrders = [];


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} MAD`;
}


function formatDate(value) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return "—";
  }
}


function showAlert(message, type = "info") {

  const container = $("#globalAlert");

  if (!container) return;

  container.innerHTML = `
    <div class="admin-alert admin-alert-${escapeHtml(type)}">
      ${escapeHtml(message)}
    </div>
  `;

  setTimeout(() => {
    container.innerHTML = "";
  }, 5000);
}


function getRoleName(profile) {

  return String(
    profile?.roles?.name ||
    profile?.role ||
    ""
  ).toLowerCase();
}


/* =========================================================
   ADMIN AUTH
   ========================================================= */

async function requireAdmin() {

  if (!window.NOVA_SUPABASE) {
    window.location.replace("../login.html");
    return null;
  }

  const {
    data: sessionData,
    error: sessionError
  } = await window.NOVA_SUPABASE.auth.getSession();

  if (sessionError || !sessionData?.session) {

    window.location.replace(
      "../login.html?redirect=admin/dashboard.html"
    );

    return null;
  }

  const user = sessionData.session.user;

  const {
    data: profile,
    error
  } = await window.NOVA_SUPABASE
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      email,
      avatar_url,
      role_id,
      is_active,
      roles (
        id,
        name
      )
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {

    console.error("Admin profile error:", error);

    showAlert(
      "Unable to load administrator profile.",
      "danger"
    );

    return null;
  }

  if (!profile) {

    await window.NOVA_SUPABASE.auth.signOut();

    window.location.replace("../login.html");

    return null;
  }

  const role = getRoleName(profile);

  if (role !== "admin") {

    if (role === "worker") {
      window.location.replace("../worker/dashboard.html");
    } else {
      window.location.replace("../client/dashboard.html");
    }

    return null;
  }

  if (profile.is_active === false) {

    await window.NOVA_SUPABASE.auth.signOut();

    window.location.replace("../login.html");

    return null;
  }

  currentAdmin = {
    user,
    profile
  };

  return currentAdmin;
}


/* =========================================================
   ADMIN PROFILE
   ========================================================= */

function renderAdminProfile() {

  if (!currentAdmin) return;

  const profile = currentAdmin.profile;

  const name =
    `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
    || "Admin";

  const avatar = $("#adminAvatar");
  const nameElement = $("#adminName");

  if (nameElement) {
    nameElement.textContent = name;
  }

  if (avatar) {

    if (profile.avatar_url) {

      avatar.innerHTML = `
        <img
          src="${escapeHtml(profile.avatar_url)}"
          alt="Admin"
        >
      `;

    } else {

      avatar.textContent =
        name.charAt(0).toUpperCase();
    }
  }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

const sectionTitles = {
  overview: "Overview",
  users: "Users",
  workers: "Workers",
  services: "Services",
  orders: "Orders",
  wallets: "Wallets",
  support: "Support",
  reviews: "Reviews",
  coupons: "Coupons",
  "nova-guard": "NOVA Guard",
  settings: "Settings",
  logs: "Admin Logs"
};


function openSection(sectionName) {

  const sections =
    document.querySelectorAll(".admin-section");

  const navLinks =
    document.querySelectorAll(".admin-nav-link");

  sections.forEach(section => {
    section.hidden =
      section.id !== `section-${sectionName}`;
  });

  navLinks.forEach(link => {
    link.classList.toggle(
      "active",
      link.dataset.section === sectionName
    );
  });

  const title = $("#pageTitle");

  if (title) {
    title.textContent =
      sectionTitles[sectionName] || "Admin";
  }

  window.location.hash = sectionName;

  if (window.innerWidth <= 900) {
    closeMobileMenu();
  }

  if (sectionName === "users") {
    loadUsers();
  }

  if (sectionName === "workers") {
    loadWorkers();
  }

  if (sectionName === "orders") {
    loadOrders();
  }

  if (sectionName === "wallets") {
    loadWalletStats();
  }
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function openMobileMenu() {

  $("#adminSidebar")?.classList.add("open");
  $("#adminOverlay")?.classList.add("active");
}


function closeMobileMenu() {

  $("#adminSidebar")?.classList.remove("open");
  $("#adminOverlay")?.classList.remove("active");
}


/* =========================================================
   LOAD DASHBOARD STATS
   ========================================================= */

async function loadStats() {

  try {

    const [
      usersResult,
      workersResult,
      ordersResult,
      walletsResult
    ] = await Promise.all([

      window.NOVA_SUPABASE
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true
        }),

      window.NOVA_SUPABASE
        .from("profiles")
        .select(`
          id,
          roles!inner(name)
        `, {
          count: "exact",
          head: true
        })
        .eq("roles.name", "worker"),

      window.NOVA_SUPABASE
        .from("orders")
        .select("id", {
          count: "exact",
          head: true
        }),

      window.NOVA_SUPABASE
        .from("wallets")
        .select("balance")
    ]);


    if (!usersResult.error) {
      $("#statUsers").textContent =
        usersResult.count ?? 0;
    }


    if (!workersResult.error) {
      $("#statWorkers").textContent =
        workersResult.count ?? 0;
    }


    if (!ordersResult.error) {
      $("#statOrders").textContent =
        ordersResult.count ?? 0;
    }


    if (!walletsResult.error) {

      const total =
        (walletsResult.data || [])
          .reduce(
            (sum, wallet) =>
              sum + Number(wallet.balance || 0),
            0
          );

      $("#statWallet").textContent =
        formatMoney(total);
    }

  } catch (error) {

    console.error(
      "Admin stats error:",
      error
    );
  }
}


/* =========================================================
   USERS
   ========================================================= */

async function loadUsers() {

  const tbody = $("#usersTable");

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="5">
        <div class="admin-loading">
          Loading users...
        </div>
      </td>
    </tr>
  `;

  const {
    data,
    error
  } = await window.NOVA_SUPABASE
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      email,
      avatar_url,
      is_active,
      created_at,
      roles (
        id,
        name
      )
    `)
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(
      "Users error:",
      error
    );

    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="admin-empty">
            <div class="admin-empty-title">
              Unable to load users
            </div>

            <div class="admin-empty-text">
              ${escapeHtml(error.message)}
            </div>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  allUsers = data || [];

  renderUsers(allUsers);
}


function renderUsers(users) {

  const tbody = $("#usersTable");

  if (!tbody) return;

  if (!users.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="admin-empty">
            <div class="admin-empty-icon">
              👥
            </div>

            <div class="admin-empty-title">
              No users found
            </div>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = users.map(user => {

    const name =
      `${user.first_name || ""} ${user.last_name || ""}`.trim()
      || "Unnamed User";

    const role =
      user.roles?.name || "unknown";

    const active =
      user.is_active !== false;

    const avatar =
      user.avatar_url
        ? `
          <img
            src="${escapeHtml(user.avatar_url)}"
            alt=""
          >
        `
        : escapeHtml(
            name.charAt(0).toUpperCase()
          );

    return `
      <tr>

        <td>

          <div class="admin-user-cell">

            <div class="admin-user-cell-avatar">
              ${avatar}
            </div>

            <div>

              <div class="admin-user-cell-name">
                ${escapeHtml(name)}
              </div>

              <div class="admin-user-cell-email">
                ${escapeHtml(user.email || "—")}
              </div>

            </div>

          </div>

        </td>

        <td>
          <span class="admin-status status-info">
            ${escapeHtml(role)}
          </span>
        </td>

        <td>

          <span class="admin-status ${
            active
              ? "status-success"
              : "status-danger"
          }">

            ${active ? "Active" : "Disabled"}

          </span>

        </td>

        <td>
          ${formatDate(user.created_at)}
        </td>

        <td>

          ${
            user.id === currentAdmin?.user?.id
              ? `<span class="admin-form-help">Current admin</span>`
              : `
                <button
                  class="admin-btn ${
                    active
                      ? "admin-btn-danger"
                      : "admin-btn-success"
                  } admin-btn-sm"
                  data-toggle-user="${escapeHtml(user.id)}"
                  data-current-active="${active}"
                >
                  ${active ? "Disable" : "Enable"}
                </button>
              `
          }

        </td>

      </tr>
    `;

  }).join("");
}


/* =========================================================
   USER SEARCH
   ========================================================= */

function filterUsers() {

  const input = $("#usersSearch");

  if (!input) return;

  const query =
    input.value
      .trim()
      .toLowerCase();

  if (!query) {

    renderUsers(allUsers);

    return;
  }

  const filtered =
    allUsers.filter(user => {

      const text = [
        user.first_name,
        user.last_name,
        user.email,
        user.roles?.name
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });

  renderUsers(filtered);
}


/* =========================================================
   WORKERS
   ========================================================= */

async function loadWorkers() {

  const tbody = $("#workersTable");

  if (!tbody) return;

  const {
    data,
    error
  } = await window.NOVA_SUPABASE
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      email,
      is_active,
      created_at,
      roles!inner (
        name
      )
    `)
    .eq("roles.name", "worker")
    .order("created_at", {
      ascending: false
    });

  if (error) {

    tbody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="admin-empty">
            <div class="admin-empty-title">
              Unable to load workers
            </div>

            <div class="admin-empty-text">
              ${escapeHtml(error.message)}
            </div>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  if (!data?.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="admin-empty">
            <div class="admin-empty-icon">
              🧑‍💻
            </div>

            <div class="admin-empty-title">
              No workers yet
            </div>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    data.map(worker => {

      const name =
        `${worker.first_name || ""} ${worker.last_name || ""}`.trim()
        || "Worker";

      return `
        <tr>

          <td>
            <strong>
              ${escapeHtml(name)}
            </strong>
          </td>

          <td>
            ${escapeHtml(worker.email || "—")}
          </td>

          <td>

            <span class="admin-status ${
              worker.is_active
                ? "status-success"
                : "status-danger"
            }">

              ${
                worker.is_active
                  ? "Active"
                  : "Disabled"
              }

            </span>

          </td>

          <td>
            ${formatDate(worker.created_at)}
          </td>

        </tr>
      `;

    }).join("");
}


/* =========================================================
   ORDERS
   ========================================================= */

async function loadOrders() {

  const tbody = $("#ordersTable");

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6">
        <div class="admin-loading">
          Loading orders...
        </div>
      </td>
    </tr>
  `;

  const {
    data,
    error
  } = await window.NOVA_SUPABASE
    .from("orders")
    .select(`
      id,
      client_id,
      worker_id,
      service_id,
      package_name,
      quantity,
      total_amount,
      status,
      created_at
    `)
    .order("created_at", {
      ascending: false
    });

  if (error) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="admin-empty">
            <div class="admin-empty-title">
              Unable to load orders
            </div>

            <div class="admin-empty-text">
              ${escapeHtml(error.message)}
            </div>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  allOrders = data || [];

  renderOrders(allOrders);
}


function renderOrders(orders) {

  const tbody = $("#ordersTable");

  if (!tbody) return;

  if (!orders.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="admin-empty">
            <div class="admin-empty-icon">
              📦
            </div>

            <div class="admin-empty-title">
              No orders found
            </div>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    orders.map(order => {

      const status =
        order.status || "pending";

      const statusClass =
        status === "completed"
          ? "status-success"
          : status === "cancelled"
            ? "status-danger"
            : status === "pending"
              ? "status-warning"
              : "status-info";

      return `
        <tr>

          <td>
            <strong>
              #${escapeHtml(
                String(order.id).slice(0, 8)
              )}
            </strong>
          </td>

          <td>
            ${escapeHtml(
              String(order.client_id).slice(0, 8)
            )}
          </td>

          <td>
            ${
              order.worker_id
                ? escapeHtml(
                    String(order.worker_id).slice(0, 8)
                  )
                : "Not assigned"
            }
          </td>

          <td>
            <strong>
              ${formatMoney(order.total_amount)}
            </strong>
          </td>

          <td>

            <span class="admin-status ${statusClass}">
              ${escapeHtml(status)}
            </span>

          </td>

          <td>
            ${formatDate(order.created_at)}
          </td>

        </tr>
      `;

    }).join("");
}


/* =========================================================
   WALLET STATS
   ========================================================= */

async function loadWalletStats() {

  const {
    data,
    error
  } = await window.NOVA_SUPABASE
    .from("wallets")
    .select("balance");

  if (error) {

    console.warn(
      "Wallet stats:",
      error.message
    );

    return;
  }

  const total =
    (data || []).reduce(
      (sum, wallet) =>
        sum + Number(wallet.balance || 0),
      0
    );

  if ($("#walletTotal")) {
    $("#walletTotal").textContent =
      formatMoney(total);
  }
}


/* =========================================================
   USER ENABLE / DISABLE
   ========================================================= */

async function toggleUser(userId, currentActive) {

  if (!userId) return;

  const newValue =
    !Boolean(currentActive);

  const confirmed =
    window.confirm(
      newValue
        ? "Enable this account?"
        : "Disable this account?"
    );

  if (!confirmed) return;


  const {
    error
  } = await window.NOVA_SUPABASE
    .rpc("admin_set_user_active", {
      p_user_id: userId,
      p_is_active: newValue
    });


  if (error) {

    console.error(
      "Toggle user error:",
      error
    );

    showAlert(
      error.message,
      "danger"
    );

    return;
  }

  showAlert(
    newValue
      ? "User enabled successfully."
      : "User disabled successfully.",
    "success"
  );

  await loadUsers();
  await loadStats();
}


/* =========================================================
   THEME
   ========================================================= */

function initTheme() {

  const saved =
    localStorage.getItem("nova-theme");

  if (saved === "dark") {
    document.documentElement.classList.add("dark");
  }

  $("#themeBtn")?.addEventListener(
    "click",
    () => {

      document.documentElement.classList.toggle(
        "dark"
      );

      const dark =
        document.documentElement.classList.contains(
          "dark"
        );

      localStorage.setItem(
        "nova-theme",
        dark ? "dark" : "light"
      );
    }
  );
}


/* =========================================================
   SETTINGS
   ========================================================= */

function initSettings() {

  $("#saveSettingsBtn")?.addEventListener(
    "click",
    () => {

      /*
       * Platform settings database will be connected
       * after the platform_settings table is created.
       */

      showAlert(
        "Settings UI is ready. Database settings will be connected next.",
        "info"
      );
    }
  );
}


/* =========================================================
   EVENTS
   ========================================================= */

function initEvents() {

  document
    .querySelectorAll(".admin-nav-link")
    .forEach(link => {

      link.addEventListener(
        "click",
        () => {

          openSection(
            link.dataset.section
          );

        }
      );

    });


  document
    .querySelectorAll("[data-open-section]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          openSection(
            button.dataset.openSection
          );

        }
      );

    });


  $("#usersSearch")?.addEventListener(
    "input",
    filterUsers
  );


  $("#orderStatusFilter")?.addEventListener(
    "change",
    event => {

      const status =
        event.target.value;

      if (!status) {

        renderOrders(allOrders);

        return;
      }

      renderOrders(
        allOrders.filter(
          order =>
            order.status === status
        )
      );

    }
  );


  $("#usersTable")?.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-toggle-user]"
        );

      if (!button) return;

      toggleUser(
        button.dataset.toggleUser,
        button.dataset.currentActive === "true"
      );

    }
  );


  $("#menuBtn")?.addEventListener(
    "click",
    openMobileMenu
  );


  $("#adminOverlay")?.addEventListener(
    "click",
    closeMobileMenu
  );


  $("#logoutBtn")?.addEventListener(
    "click",
    async () => {

      await window.NOVA_SUPABASE.auth.signOut();

      window.location.replace(
        "../login.html"
      );

    }
  );


  window.addEventListener(
    "hashchange",
    () => {

      const hash =
        window.location.hash
          .replace("#", "");

      if (sectionTitles[hash]) {
        openSection(hash);
      }

    }
  );
}


/* =========================================================
   INIT
   ========================================================= */

async function initAdminDashboard() {

  const admin =
    await requireAdmin();

  if (!admin) return;

  renderAdminProfile();

  initTheme();

  initEvents();

  initSettings();

  await loadStats();

  const initialSection =
    window.location.hash
      .replace("#", "");

  openSection(
    sectionTitles[initialSection]
      ? initialSection
      : "overview"
  );

  console.log(
    "NOVA Admin Dashboard loaded:",
    admin.profile.email
  );
}


document.addEventListener(
  "DOMContentLoaded",
  initAdminDashboard
);