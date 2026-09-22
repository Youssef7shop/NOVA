// ============================================================
// NOVA - AUTH SYSTEM
// js/auth.js
// ============================================================

(function () {
  "use strict";

  // ------------------------------------------------------------
  // SUPABASE CHECK
  // ------------------------------------------------------------

  if (!window.NOVA_SUPABASE) {
    console.error("NOVA_SUPABASE is not configured.");
    return;
  }

  const supabase = window.NOVA_SUPABASE;


  // ------------------------------------------------------------
  // UI HELPERS
  // ------------------------------------------------------------

  function showMessage(message, type = "error") {
    const box = document.getElementById("authMessage");

    if (!box) {
      console.log(`[${type}]`, message);
      return;
    }

    box.textContent = message;
    box.className = `auth-message ${type}`;
    box.style.display = "block";
  }


  function hideMessage() {
    const box = document.getElementById("authMessage");

    if (!box) return;

    box.textContent = "";
    box.style.display = "none";
  }


  function setLoading(button, loading, text = "Please wait...") {
    if (!button) return;

    if (loading) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = text;
    } else {
      button.disabled = false;
      button.textContent =
        button.dataset.originalText || button.textContent;
    }
  }


  // ------------------------------------------------------------
  // VALIDATION
  // ------------------------------------------------------------

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }


  function cleanText(value) {
    return String(value || "").trim();
  }


  // ------------------------------------------------------------
  // GET USER PROFILE
  // ------------------------------------------------------------

  async function getUserProfile(userId) {
    if (!userId) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        first_name,
        last_name,
        email,
        avatar_url,
        phone,
        country,
        is_email_verified,
        is_active,
        role_id,
        roles (
          name
        )
      `)
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Profile error:", error);
      return null;
    }

    return data;
  }


  // ------------------------------------------------------------
  // ROLE
  // ------------------------------------------------------------

  function getRoleName(profile) {
    return (
      profile?.roles?.name ||
      profile?.role?.name ||
      "client"
    ).toLowerCase();
  }


  // ------------------------------------------------------------
  // DASHBOARD REDIRECT
  // ------------------------------------------------------------

  function goAfterLogin(role) {
    role = String(role || "client").toLowerCase();

    if (role === "admin") {
      window.location.href = "admin/dashboard.html";
      return;
    }

    if (role === "worker") {
      window.location.href = "worker/dashboard.html";
      return;
    }

    window.location.href = "client/dashboard.html";
  }


  // ------------------------------------------------------------
  // GET REDIRECT PARAMETER
  // ------------------------------------------------------------

  function getRedirectPage() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    if (!redirect) return null;

    // Security: block external URLs
    if (
      redirect.startsWith("http://") ||
      redirect.startsWith("https://") ||
      redirect.startsWith("//")
    ) {
      return null;
    }

    return redirect;
  }


  // ------------------------------------------------------------
  // REGISTER
  // ------------------------------------------------------------

  async function registerWithEmail(
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    termsAccepted
  ) {
    hideMessage();

    firstName = cleanText(firstName);
    lastName = cleanText(lastName);
    email = cleanText(email).toLowerCase();

    if (!firstName) {
      showMessage("Please enter your first name.");
      return false;
    }

    if (!lastName) {
      showMessage("Please enter your last name.");
      return false;
    }

    if (!isValidEmail(email)) {
      showMessage("Please enter a valid email address.");
      return false;
    }

    if (!password || password.length < 8) {
      showMessage("Password must contain at least 8 characters.");
      return false;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.");
      return false;
    }

    if (!termsAccepted) {
      showMessage("Please accept the Terms and Conditions.");
      return false;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,

        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (error) {
        console.error("Registration error:", error);

        showMessage(
          error.message || "Registration failed."
        );

        return false;
      }

      if (!data.user) {
        showMessage(
          "Account could not be created. Please try again."
        );

        return false;
      }


      // --------------------------------------------------------
      // EMAIL CONFIRMATION DISABLED
      // --------------------------------------------------------

      if (data.session) {
        const profile = await getUserProfile(data.user.id);

        if (!profile) {
          showMessage(
            "Account created, but your profile could not be loaded."
          );

          return false;
        }

        const role = getRoleName(profile);

        showMessage(
          "Account created successfully. Redirecting...",
          "success"
        );

        setTimeout(() => {
          goAfterLogin(role);
        }, 500);

        return true;
      }


      // If Supabase doesn't return a session
      // even though confirmation is disabled
      showMessage(
        "Account created successfully. Please log in.",
        "success"
      );

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);

      return true;

    } catch (error) {
      console.error("Unexpected registration error:", error);

      showMessage(
        "Something went wrong. Please try again."
      );

      return false;
    }
  }


  // ------------------------------------------------------------
  // LOGIN
  // ------------------------------------------------------------

  async function loginWithEmail(email, password) {
    hideMessage();

    email = cleanText(email).toLowerCase();

    if (!isValidEmail(email)) {
      showMessage("Please enter a valid email address.");
      return false;
    }

    if (!password) {
      showMessage("Please enter your password.");
      return false;
    }

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        console.error("Login error:", error);

        // ------------------------------------------------------
        // IMPORTANT:
        // NO EMAIL CONFIRMATION CHECK HERE
        // ------------------------------------------------------

        showMessage(
          error.message || "Email or password is incorrect."
        );

        return false;
      }

      if (!data.user) {
        showMessage(
          "Login failed. Please try again."
        );

        return false;
      }


      // --------------------------------------------------------
      // GET PROFILE
      // --------------------------------------------------------

      const profile = await getUserProfile(data.user.id);

      if (!profile) {
        showMessage(
          "Your profile could not be loaded."
        );

        await supabase.auth.signOut();

        return false;
      }


      // --------------------------------------------------------
      // ACCOUNT ACTIVE CHECK
      // --------------------------------------------------------

      if (profile.is_active === false) {
        await supabase.auth.signOut();

        showMessage(
          "Your account is currently disabled."
        );

        return false;
      }


      // --------------------------------------------------------
      // ROLE
      // --------------------------------------------------------

      const role = getRoleName(profile);


      // --------------------------------------------------------
      // OPTIONAL REDIRECT
      // --------------------------------------------------------

      const redirect = getRedirectPage();

      if (redirect) {
        // Only allow internal paths
        if (
          !redirect.includes("login.html") &&
          !redirect.includes("register.html")
        ) {
          window.location.href = redirect;
          return true;
        }
      }


      // --------------------------------------------------------
      // NORMAL DASHBOARD REDIRECT
      // --------------------------------------------------------

      goAfterLogin(role);

      return true;

    } catch (error) {
      console.error("Unexpected login error:", error);

      showMessage(
        "Something went wrong while logging in."
      );

      return false;
    }
  }


  // ------------------------------------------------------------
  // GOOGLE LOGIN
  // ------------------------------------------------------------

  async function loginWithGoogle() {
    hideMessage();

    try {
      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",

          options: {
            redirectTo:
              window.location.origin +
              "/client/dashboard.html"
          }
        });

      if (error) {
        console.error("Google login error:", error);

        showMessage(
          error.message || "Google login failed."
        );

        return false;
      }

      return true;

    } catch (error) {
      console.error("Unexpected Google login error:", error);

      showMessage(
        "Google login failed. Please try again."
      );

      return false;
    }
  }


  // ------------------------------------------------------------
  // GET SESSION
  // ------------------------------------------------------------

  async function getSession() {
    const {
      data,
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Session error:", error);
      return null;
    }

    return data.session;
  }


  // ------------------------------------------------------------
  // REQUIRE AUTH
  // ------------------------------------------------------------

  async function requireAuth() {
    const session = await getSession();

    if (!session) {
      const currentPage =
        window.location.pathname.split("/").pop();

      const currentPath =
        window.location.pathname
          .split("/")
          .slice(-2)
          .join("/");

      window.location.href =
        `../login.html?redirect=${encodeURIComponent(currentPath)}`;

      return null;
    }

    return session;
  }


  // ------------------------------------------------------------
  // REQUIRE CLIENT
  // ------------------------------------------------------------

  async function requireClient() {
    const session = await requireAuth();

    if (!session) return null;

    const profile =
      await getUserProfile(session.user.id);

    if (!profile) {
      await supabase.auth.signOut();

      window.location.href = "../login.html";

      return null;
    }

    if (profile.is_active === false) {
      await supabase.auth.signOut();

      window.location.href =
        "../login.html?error=disabled";

      return null;
    }

    const role = getRoleName(profile);

    if (role === "worker") {
      window.location.href =
        "../worker/dashboard.html";

      return null;
    }

    if (role === "admin") {
      window.location.href =
        "../admin/dashboard.html";

      return null;
    }

    return {
      session,
      profile
    };
  }


  // ------------------------------------------------------------
  // LOGOUT
  // ------------------------------------------------------------

  async function logout() {
    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        return false;
      }

      window.location.href = "../index.html";

      return true;

    } catch (error) {
      console.error("Unexpected logout error:", error);
      return false;
    }
  }


  // ------------------------------------------------------------
  // REGISTER FORM
  // ------------------------------------------------------------

  const registerForm =
    document.getElementById("registerForm");

  if (registerForm) {

    registerForm.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();

        const firstName =
          document.getElementById("firstName")?.value || "";

        const lastName =
          document.getElementById("lastName")?.value || "";

        const email =
          document.getElementById("email")?.value || "";

        const password =
          document.getElementById("password")?.value || "";

        const confirmPassword =
          document.getElementById("confirmPassword")?.value || "";

        const terms =
          document.getElementById("terms")?.checked || false;

        const button =
          registerForm.querySelector(
            'button[type="submit"]'
          );

        setLoading(
          button,
          true,
          "Creating account..."
        );

        await registerWithEmail(
          firstName,
          lastName,
          email,
          password,
          confirmPassword,
          terms
        );

        setLoading(button, false);
      }
    );
  }


  // ------------------------------------------------------------
  // LOGIN FORM
  // ------------------------------------------------------------

  const loginForm =
    document.getElementById("loginForm");

  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();

        const email =
          document.getElementById("email")?.value || "";

        const password =
          document.getElementById("password")?.value || "";

        const button =
          loginForm.querySelector(
            'button[type="submit"]'
          );

        setLoading(
          button,
          true,
          "Signing in..."
        );

        await loginWithEmail(
          email,
          password
        );

        setLoading(button, false);
      }
    );
  }


  // ------------------------------------------------------------
  // GOOGLE BUTTON
  // ------------------------------------------------------------

  const googleButtons =
    document.querySelectorAll(
      "[data-google-login]"
    );

  googleButtons.forEach((button) => {

    button.addEventListener(
      "click",
      async function () {

        setLoading(
          button,
          true,
          "Connecting..."
        );

        await loginWithGoogle();

        setLoading(button, false);
      }
    );

  });


  // ------------------------------------------------------------
  // LOGOUT BUTTONS
  // ------------------------------------------------------------

  const logoutButtons =
    document.querySelectorAll(
      "[data-logout]"
    );

  logoutButtons.forEach((button) => {

    button.addEventListener(
      "click",
      async function (event) {

        event.preventDefault();

        await logout();
      }
    );

  });


  // ------------------------------------------------------------
  // AUTH STATE
  // ------------------------------------------------------------

  supabase.auth.onAuthStateChange(
    function (event, session) {

      console.log(
        "NOVA Auth:",
        event,
        session?.user?.email || "No user"
      );

    }
  );


  // ------------------------------------------------------------
  // GLOBAL API
  // ------------------------------------------------------------

  window.NOVA_AUTH = {

    getSession,
    getUserProfile,

    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,

    requireAuth,
    requireClient,

    logout,

    goAfterLogin

  };


  // ------------------------------------------------------------
  // DEBUG
  // ------------------------------------------------------------

  console.log(
    "NOVA Auth System loaded successfully."
  );

})();