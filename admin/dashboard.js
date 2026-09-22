"use strict";

/* =========================================================
   NOVA ADMIN DASHBOARD
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

let currentAdmin = null;

let allUsers = [];
let allWorkers = [];
let allServices = [];
let allOrders = [];
let allTickets = [];
let allReviews = [];
let allCoupons = [];
let allLogs = [];

let isChangingHash = false;


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


function shortId(value, length = 8) {
  if (!value) return "—";
  return String(value).slice(0, length);
}


function showAlert(message, type = "info") {
  const container = $("#globalAlert");

  if (!container) {
    console[type === "danger" ? "error" : "log"](message);
    return;
  }

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


function setTableMessage(selector, message, colspan = 5) {
  const tbody = $(selector);

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="${colspan}">
        <div class="admin-empty">
          ${escapeHtml(message)}
        </div>
      </td>
    </tr>
  `;
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

  if (
    sessionError ||
    !sessionData?.session
  ) {

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
      created_at,
      roles (
        id,
        name
      )
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {

    console.error(
      "Admin profile error:",
      error
    );

    showAlert(
      "Unable to load administrator profile.",
      "danger"
    );

    return null;
  }

  if (!profile) {

    await window.NOVA_SUPABASE.auth.signOut();

    window.location.replace(
      "../login.html"
    );

    return null;
  }

  const role = getRoleName(profile);

  if (role !== "admin") {

    if (role === "worker") {
      window.location.replace(
        "../worker/dashboard.html"
      );
    } else {
      window.location.replace(
        "../client/dashboard.html"
      );
    }

    return null;
  }

  if (profile.is_active === false) {

    await window.NOVA_SUPABASE.auth.signOut();

    window.location.replace(
      "../login.html"
    );

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

  const nameElement = $("#adminName");
  const avatar = $("#adminAvatar");

  if (nameElement) {
    nameElement.textContent = name;
  }

  if (!avatar) return;

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


async function openSection(sectionName, updateHash = true) {

  if (!sectionTitles[sectionName]) {
    sectionName = "overview";
  }

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
      sectionTitles[sectionName];
  }

  if (updateHash) {

    const newHash = `#${sectionName}`;

    if (window.location.hash !== newHash) {
      history.replaceState(
        null,
        "",
        newHash
      );
    }
  }

  if (window.innerWidth <= 900) {
    closeMobileMenu();
  }

  /* Load section data */

  switch (sectionName) {

    case "overview":
      await loadStats();
      break;

    case "users":
      await loadUsers();
      break;

    case "workers":
      await loadWorkers();
      break;

    case "services":
      await loadServices();
      break;

    case "orders":
      await loadOrders();
      break;

    case "wallets":
      await loadWalletStats();
      break;

    case "support":
      await loadSupportTickets();
      break;

    case "reviews":
      await loadReviews();
      break;

    case "coupons":
      await loadCoupons();
      break;

    case "nova-guard":
      await loadNovaGuard();
      break;

    case "settings":
      await loadSettings();
      break;

    case "logs":
      await loadAdminLogs();
      break;
  }
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function openMobileMenu() {

  $("#adminSidebar")?.classList.add(
    "open"
  );

  $("#adminOverlay")?.classList.add(
    "active"
  );
}


function closeMobileMenu() {

  $("#adminSidebar")?.classList.remove(
    "open"
  );

  $("#adminOverlay")?.classList.remove(
    "active"
  );
}


/* =========================================================
   ADMIN LOG
   ========================================================= */

async function createAdminLog(
  action,
  targetType = null,
  targetId = null,
  details = {}
) {

  try {

    const { error } =
      await window.NOVA_SUPABASE.rpc(
        "create_admin_log",
        {
          p_action: action,
          p_target_type: targetType,
          p_target_id: targetId,
          p_details: details
        }
      );

    if (error) {
      console.warn(
        "Admin log error:",
        error.message
      );
    }

  } catch (error) {

    console.warn(
      "Admin log exception:",
      error
    );
  }
}


/* =========================================================
   DASHBOARD STATS
   ========================================================= */

async function loadStats() {

  try {

    const [
      usersResult,
      workersResult,
      ordersResult,
      walletsResult,
      servicesResult,
      ticketsResult
    ] = await Promise.all([

      window.NOVA_SUPABASE
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true
        }),

      window.NOVA_SUPABASE
        .from("profiles")
        .select(
          "id, roles!inner(name)",
          {
            count: "exact",
            head: true
          }
        )
        .eq("roles.name", "worker"),

      window.NOVA_SUPABASE
        .from("orders")
        .select("id", {
          count: "exact",
          head: true
        }),

      window.NOVA_SUPABASE
        .from("wallets")
        .select("balance"),

      window.NOVA_SUPABASE
        .from("services")
        .select("id", {
          count: "exact",
          head: true
        }),

      window.NOVA_SUPABASE
        .from("support_tickets")
        .select("id", {
          count: "exact",
          head: true
        })
        .in("status", [
          "open",
          "pending"
        ])
    ]);


    if (!usersResult.error) {

      if ($("#statUsers")) {
        $("#statUsers").textContent =
          usersResult.count ?? 0;
      }
    }


    if (!workersResult.error) {

      if ($("#statWorkers")) {
        $("#statWorkers").textContent =
          workersResult.count ?? 0;
      }
    }


    if (!ordersResult.error) {

      if ($("#statOrders")) {
        $("#statOrders").textContent =
          ordersResult.count ?? 0;
      }
    }


    if (!servicesResult.error) {

      if ($("#statServices")) {
        $("#statServices").textContent =
          servicesResult.count ?? 0;
      }
    }


    if (!ticketsResult.error) {

      if ($("#statTickets")) {
        $("#statTickets").textContent =
          ticketsResult.count ?? 0;
      }
    }


    if (!walletsResult.error) {

      const total =
        (walletsResult.data || [])
          .reduce(
            (sum, wallet) =>
              sum + Number(
                wallet.balance || 0
              ),
            0
          );

      if ($("#statWallet")) {
        $("#statWallet").textContent =
          formatMoney(total);
      }
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
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    console.error(
      "Users error:",
      error
    );

    setTableMessage(
      "#usersTable",
      error.message,
      5
    );

    return;
  }

  allUsers = data || [];

  renderUsers(allUsers);
}


function renderUsers(users) {

  const tbody = $("#usersTable");

  if (!tbody) return;

  if (!users.length) {

    setTableMessage(
      "#usersTable",
      "No users found.",
      5
    );

    return;
  }

  tbody.innerHTML =
    users.map(user => {

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

              ? `
                <span class="admin-form-help">
                  Current admin
                </span>
              `

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

  tbody.innerHTML = `
    <tr>
      <td colspan="4">
        <div class="admin-loading">
          Loading workers...
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
      is_active,
      created_at,
      roles!inner (
        name
      )
    `)
    .eq(
      "roles.name",
      "worker"
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    setTableMessage(
      "#workersTable",
      error.message,
      4
    );

    return;
  }

  allWorkers = data || [];

  if (!allWorkers.length) {

    setTableMessage(
      "#workersTable",
      "No workers yet.",
      4
    );

    return;
  }

  tbody.innerHTML =
    allWorkers.map(worker => {

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
            ${escapeHtml(
              worker.email || "—"
            )}
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
            ${formatDate(
              worker.created_at
            )}
          </td>

        </tr>
      `;

    }).join("");
}


/* =========================================================
   SERVICES
   ========================================================= */

async function loadServices() {

  const tbody = $("#servicesTable");

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6">
        <div class="admin-loading">
          Loading services...
        </div>
      </td>
    </tr>
  `;

  const {
    data,
    error
  } = await window.NOVA_SUPABASE
    .from("services")
    .select(`
      id,
      worker_id,
      category_id,
      title,
      slug,
      price,
      delivery_days,
      status,
      is_featured,
      created_at
    `)
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    setTableMessage(
      "#servicesTable",
      error.message,
      6
    );

    return;
  }

  allServices = data || [];

  if (!allServices.length) {

    setTableMessage(
      "#servicesTable",
      "No services found.",
      6
    );

    return;
  }

  tbody.innerHTML =
    allServices.map(service => {

      const status =
        service.status || "draft";

      const statusClass =
        status === "active"
          ? "status-success"
          : status === "rejected"
            ? "status-danger"
            : status === "pending"
              ? "status-warning"
              : "status-info";

      return `
        <tr>

          <td>
            <strong>
              ${escapeHtml(
                service.title
              )}
            </strong>
          </td>

          <td>
            ${escapeHtml(
              shortId(
                service.worker_id
              )
            )}
          </td>

          <td>
            ${formatMoney(
              service.price
            )}
          </td>

          <td>
            ${escapeHtml(
              String(
                service.delivery_days
              )
            )} days
          </td>

          <td>

            <span class="admin-status ${statusClass}">
              ${escapeHtml(status)}
            </span>

          </td>

          <td>
            ${formatDate(
              service.created_at
            )}
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
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    setTableMessage(
      "#ordersTable",
      error.message,
      6
    );

    return;
  }

  allOrders = data || [];

  renderOrders(allOrders);
}


function renderOrders(orders) {

  const tbody = $("#ordersTable");

  if (!tbody) return;

  if (!orders.length) {

    setTableMessage(
      "#ordersTable",
      "No orders found.",
      6
    );

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
                shortId(order.id)
              )}
            </strong>
          </td>

          <td>
            ${escapeHtml(
              shortId(order.client_id)
            )}
          </td>

          <td>
            ${
              order.worker_id
                ? escapeHtml(
                    shortId(
                      order.worker_id
                    )
                  )
                : "Not assigned"
            }
          </td>

          <td>
            <strong>
              ${formatMoney(
                order.total_amount
              )}
            </strong>
          </td>

          <td>

            <span class="admin-status ${statusClass}">
              ${escapeHtml(status)}
            </span>

          </td>

          <td>
            ${formatDate(
              order.created_at
            )}
          </td>

        </tr>
      `;

    }).join("");
}


/* =========================================================
   WALLET
   ========================================================= */

async function loadWalletStats() {

  const {
    data,
    error
  } = await window.NOVA_SUPABASE
    .from("wallets")
    .select(`
      id,
      user_id,
      balance,
      created_at
    `);

  if (error) {

    console.warn(
      "Wallet stats:",
      error.message
    );

    if ($("#walletTotal")) {
      $("#walletTotal").textContent =
        "0.00 MAD";
    }

    return;
  }

  const total =
    (data || []).reduce(
      (sum, wallet) =>
        sum + Number(
          wallet.balance || 0
        ),
      0
    );

  if ($("#walletTotal")) {

    $("#walletTotal").textContent =
      formatMoney(total);
  }
}


/* =========================================================
   SUPPORT TICKETS
   ========================================================= */

async function loadSupportTickets() {

  const tbody =
    $("#supportTable");

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6">
        <div class="admin-loading">
          Loading support tickets...
        </div>
      </td>
    </tr>
  `;

  const {
    data,
    error
  } = await window.NOVA_SUPABASE
    .from("support_tickets")
    .select(`
      id,
      user_id,
      subject,
      message,
      status,
      priority,
      assigned_admin_id,
      created_at,
      updated_at
    `)
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    setTableMessage(
      "#supportTable",
      error.message,
      6
    );

    return;
  }

  allTickets = data || [];

  if (!allTickets.length) {

    setTableMessage(
      "#supportTable",
      "No support tickets.",
      6
    );

    return;
  }

  tbody.innerHTML =
    allTickets.map(ticket => {

      const priorityClass =
        ticket.priority === "urgent"
          ? "status-danger"
          : ticket.priority === "high"
            ? "status-warning"
            : "status-info";

      return `
        <tr>

          <td>
            #${escapeHtml(
              shortId(ticket.id)
            )}
          </td>

          <td>
            ${escapeHtml(
              shortId(ticket.user_id)
            )}
          </td>

          <td>
            <strong>
              ${escapeHtml(
                ticket.subject
              )}
            </strong>
          </td>

          <td>

            <span class="admin-status ${priorityClass}">
              ${escapeHtml(
                ticket.priority
              )}
            </span>

          </td>

          <td>

            <span class="admin-status status-info">
              ${escapeHtml(
                ticket.status
              )}
            </span>

          </td>

          <td>
            ${formatDate(
              ticket.created_at
            )}
          </td>

        </tr>
      `;

    }).join("");
}


/* =========================================================
   REVIEWS
   ========================================================= */

async function loadReviews() {

  const tbody =
    $("#reviewsTable");

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6">
        <div class="admin-loading">
          Loading reviews...
        </div>
      </td>
    </tr>
  `;

  const {
    data,
    error
  } = await window.NOVA_SUPABASE
    .from("reviews")
    .select(`
      id,
      service_id,
      order_id,
      client_id,
      worker_id,
      rating,
      comment,
      status,
      created_at
    `)
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    setTableMessage(
      "#reviewsTable",
      error.message,
      6
    );

    return;
  }

  allReviews = data || [];

  if (!allReviews.length) {

    setTableMessage(
      "#reviewsTable",
      "No reviews found.",
      6
    );

    return;
  }

  tbody.innerHTML =
    allReviews.map(review => {

      return `
        <tr>

          <td>
            #${escapeHtml(
              shortId(review.id)
            )}
          </td>

          <td>
            ${escapeHtml(
              shortId(
                review.service_id
              )
            )}
          </td>

          <td>
            ${"⭐".repeat(
              Number(
                review.rating || 0
              )
            )}
          </td>

          <td>
            ${escapeHtml(
              review.comment || "—"
            )}
          </td>

          <td>

            <span class="admin-status status-info">
              ${escapeHtml(
                review.status
              )}
            </span>

          </td>

          <td>
            ${formatDate(
              review.created_at
            )}
          </td>

        </tr>
      `;

    }).join("");
}


/* =========================================================
   COUPONS
   ========================================================= */

async function loadCoupons() {

  const tbody =
    $("#couponsTable");

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6">
        <div class="admin-loading">
          Loading coupons...
        </div>
      </td>
    </tr>
  `;

  const {
    data,
    error
  } = await window.NOVA_SUPABASE
    .from("coupons")
    .select(`
      id,
      code,
      discount_type,
      discount_value,
      minimum_order,
      max_uses,
      used_count,
      starts_at,
      expires_at,
      is_active,
      created_at
    `)
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {

    setTableMessage(
      "#couponsTable",
      error.message,
      6
    );

    return;
  }

  allCoupons = data || [];

  if (!allCoupons.length) {

    setTableMessage(
      "#couponsTable",
      "No coupons found.",
      6
    );

    return;
  }

  tbody.innerHTML =
    allCoupons.map(coupon => {

      const discount =
        coupon.discount_type === "percentage"
          ? `${coupon.discount_value}%`
          : formatMoney(
              coupon.discount_value
            );

      return `
        <tr>

          <td>
            <strong>
              ${escapeHtml(
                coupon.code
              )}
            </strong>
          </td>

          <td>
            ${escapeHtml(
              discount
            )}
          </td>

          <td>
            ${formatMoney(
              coupon.minimum_order
            )}
          </td>

          <td>
            ${coupon.used_count || 0}
            /
            ${coupon.max_uses ?? "∞"}
          </td>

          <td>

            <span class="admin-status ${
              coupon.is_active
                ? "status-success"
                : "status-danger"
            }">

              ${
                coupon.is_active
                  ? "Active"
                  : "Disabled"
              }

            </span>

          </td>

          <td>
            ${formatDate(
              coupon.expires_at
            )}
          </td>

        </tr>
      `;

    }).join("");
}


/* =========================================================
   NOVA GUARD
   ========================================================= */

async function loadNovaGuard() {

  const {
    data,
    error
  } = await window.NOVA_SUPABASE
    .from("platform_settings")
    .select(`
      key,
      value
    `)
    .in("key", [
      "nova_guard_enabled",
      "user_reports_enabled"
    ]);

  if (error) {

    console.warn(
      "NOVA Guard:",
      error.message
    );

    return;
  }

  const settings = {};

  (data || []).forEach(item => {
    settings[item.key] = item.value;
  });

  const guard =
    settings.nova_guard_enabled;

  const reports =
    settings.user_reports_enabled;

  const guardCheckbox =
    $("#novaGuardEnabled");

  const reportsCheckbox =
    $("#userReportsEnabled");

  if (guardCheckbox) {
    guardCheckbox.checked =
      guard === true ||
      guard === "true";
  }

  if (reportsCheckbox) {
    reportsCheckbox.checked =
      reports === true ||
      reports === "true";
  }
}


/* =========================================================
   SETTINGS
   ========================================================= */

async function loadSettings() {

  const {
    data,
    error
  } = await window.NOVA_SUPABASE
    .from("platform_settings")
    .select(`
      key,
      value,
      description
    `)
    .order("key");

  if (error) {

    console.warn(
      "Settings:",
      error.message
    );

    return;
  }

  const settings = {};

  (data || []).forEach(item => {
    settings[item.key] = item.value;
  });

  const platformName =
    $("#platformName");

  const platformDescription =
    $("#platformDescription");

  const platformCurrency =
    $("#platformCurrency");

  if (platformName) {
    platformName.value =
      settings.platform_name ?? "NOVA";
  }

  if (platformDescription) {
    platformDescription.value =
      settings.platform_description ?? "";
  }

  if (platformCurrency) {
    platformCurrency.value =
      settings.platform_currency ?? "MAD";
  }
}


/* =========================================================
   UPDATE SETTING
   ========================================================= */

async function updatePlatformSetting(
  key,
  value
) {

  const {
    error
  } = await window.NOVA_SUPABASE
    .from("platform_settings")
    .upsert({
      key,
      value,
      updated_by:
        currentAdmin?.user?.id || null,
      updated_at:
        new Date().toISOString()
    });

  if (error) {

    console.error(
      "Setting update error:",
      error
    );

    throw error;
  }

  await createAdminLog(
    "update_platform_setting",
    "platform_settings",
    key,
    { value }
  );
}


/* =========================================================
   SAVE SETTINGS
   ========================================================= */

async function saveSettings() {

  try {

    const platformName =
      $("#platformName")?.value
      || "NOVA";

    const platformDescription =
      $("#platformDescription")?.value
      || "";

    const platformCurrency =
      $("#platformCurrency")?.value
      || "MAD";

    await updatePlatformSetting(
      "platform_name",
      platformName
    );

    await updatePlatformSetting(
      "platform_description",
      platformDescription
    );

    await updatePlatformSetting(
      "platform_currency",
      platformCurrency
    );

    showAlert(
      "Settings saved successfully.",
      "success"
    );

  } catch (error) {

    showAlert(
      error.message,
      "danger"
    );
  }
}


/* =========================================================
   NOVA GUARD SAVE
   ========================================================= */

async function saveNovaGuard() {

  try {

    const guard =
      $("#novaGuardEnabled")?.checked
      ?? true;

    const reports =
      $("#userReportsEnabled")?.checked
      ?? true;

    await updatePlatformSetting(
      "nova_guard_enabled",
      guard
    );

    await updatePlatformSetting(
      "user_reports_enabled",
      reports
    );

    showAlert(
      "NOVA Guard settings saved.",
      "success"
    );

  } catch (error) {

    showAlert(
      error.message,
      "danger"
    );
  }
}


/* =========================================================
   ADMIN LOGS
   ========================================================= */

async function loadAdminLogs() {

  const tbody =
    $("#logsTable");

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="5">
        <div class="admin-loading">
          Loading admin logs...
        </div>
      </td>
    </tr>
  `;

  const {
    data,
    error
  } = await window.NOVA_SUPABASE
    .from("admin_logs")
    .select(`
      id,
      admin_id,
      action,
      target_type,
      target_id,
      details,
      created_at
    `)
    .order(
      "created_at",
      {
        ascending: false
      }
    )
    .limit(100);

  if (error) {

    setTableMessage(
      "#logsTable",
      error.message,
      5
    );

    return;
  }

  allLogs = data || [];

  if (!allLogs.length) {

    setTableMessage(
      "#logsTable",
      "No admin logs yet.",
      5
    );

    return;
  }

  tbody.innerHTML =
    allLogs.map(log => {

      return `
        <tr>

          <td>
            #${escapeHtml(
              String(log.id)
            )}
          </td>

          <td>
            ${escapeHtml(
              log.action
            )}
          </td>

          <td>
            ${escapeHtml(
              log.target_type || "—"
            )}
          </td>

          <td>
            ${escapeHtml(
              log.target_id || "—"
            )}
          </td>

          <td>
            ${formatDate(
              log.created_at
            )}
          </td>

        </tr>
      `;

    }).join("");
}


/* =========================================================
   ENABLE / DISABLE USER
   ========================================================= */

async function toggleUser(
  userId,
  currentActive
) {

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
    .rpc(
      "admin_set_user_active",
      {
        p_user_id: userId,
        p_is_active: newValue
      }
    );

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

  await createAdminLog(
    newValue
      ? "enable_user"
      : "disable_user",
    "profile",
    userId,
    {
      is_active: newValue
    }
  );

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
    localStorage.getItem(
      "nova-theme"
    );

  if (saved === "dark") {
    document.documentElement.classList.add(
      "dark"
    );
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
        dark
          ? "dark"
          : "light"
      );
    }
  );
}


/* =========================================================
   EVENTS
   ========================================================= */

function initEvents() {

  document
    .querySelectorAll(
      ".admin-nav-link"
    )
    .forEach(link => {

      link.addEventListener(
        "click",
        async () => {

          await openSection(
            link.dataset.section
          );

        }
      );

    });


  document
    .querySelectorAll(
      "[data-open-section]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          await openSection(
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

        renderOrders(
          allOrders
        );

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


  $("#saveSettingsBtn")?.addEventListener(
    "click",
    saveSettings
  );


  $("#saveNovaGuardBtn")?.addEventListener(
    "click",
    saveNovaGuard
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
    async () => {

      if (isChangingHash) {
        return;
      }

      const hash =
        window.location.hash
          .replace("#", "");

      if (sectionTitles[hash]) {

        await openSection(
          hash,
          false
        );

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

  await loadStats();

  const hash =
    window.location.hash
      .replace("#", "");

  await openSection(
    sectionTitles[hash]
      ? hash
      : "overview",
    false
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