/* =========================================================
   NOVA — Main App JavaScript
   js/app.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initMobileMenu();
    initHeroSearch();
});


/* =========================================================
   THEME
   ========================================================= */

function initTheme() {
    const themeToggle = document.getElementById("themeToggle");

    if (!themeToggle) return;

    const savedTheme = localStorage.getItem("nova-theme");

    if (savedTheme === "light") {
        document.body.classList.add("light-theme");
        updateThemeIcon(themeToggle, true);
    } else {
        document.body.classList.remove("light-theme");
        updateThemeIcon(themeToggle, false);
    }

    themeToggle.addEventListener("click", () => {
        const isLight = document.body.classList.toggle("light-theme");

        localStorage.setItem(
            "nova-theme",
            isLight ? "light" : "dark"
        );

        updateThemeIcon(themeToggle, isLight);
    });
}


function updateThemeIcon(button, isLight) {
    button.textContent = isLight ? "☀" : "☾";

    button.setAttribute(
        "aria-label",
        isLight ? "Switch to dark mode" : "Switch to light mode"
    );

    button.setAttribute(
        "title",
        isLight ? "Light mode" : "Dark mode"
    );
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function initMobileMenu() {
    const menuButton = document.getElementById("mobileMenuButton");
    const mobileMenu = document.getElementById("mobileMenu");

    if (!menuButton || !mobileMenu) return;

    menuButton.addEventListener("click", () => {
        const isOpen = mobileMenu.classList.toggle("open");

        menuButton.textContent = isOpen ? "✕" : "☰";

        menuButton.setAttribute(
            "aria-label",
            isOpen ? "Close menu" : "Open menu"
        );
    });


    /* Close menu after clicking a link */

    const menuLinks = mobileMenu.querySelectorAll("a");

    menuLinks.forEach((link) => {
        link.addEventListener("click", () => {
            mobileMenu.classList.remove("open");

            menuButton.textContent = "☰";

            menuButton.setAttribute(
                "aria-label",
                "Open menu"
            );
        });
    });


    /* Close menu when clicking outside */

    document.addEventListener("click", (event) => {
        const clickedInsideMenu =
            mobileMenu.contains(event.target);

        const clickedButton =
            menuButton.contains(event.target);

        if (
            !clickedInsideMenu &&
            !clickedButton &&
            mobileMenu.classList.contains("open")
        ) {
            mobileMenu.classList.remove("open");

            menuButton.textContent = "☰";

            menuButton.setAttribute(
                "aria-label",
                "Open menu"
            );
        }
    });
}


/* =========================================================
   HERO SEARCH
   ========================================================= */

function initHeroSearch() {
    const searchForm =
        document.getElementById("heroSearchForm");

    const searchInput =
        document.getElementById("heroSearchInput");

    if (!searchForm || !searchInput) return;


    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const query =
            searchInput.value.trim();

        if (!query) {
            searchInput.focus();
            return;
        }

        const encodedQuery =
            encodeURIComponent(query);

        window.location.href =
            `services.html?search=${encodedQuery}`;
    });


    /* Enter key */

    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            searchForm.requestSubmit();
        }
    });
};


/* =========================================================
   GLOBAL HELPERS
   ========================================================= */

function getUrlParam(name) {
    const params =
        new URLSearchParams(window.location.search);

    return params.get(name);
}


function escapeHTML(value) {
    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}


/* =========================================================
   NOVA GLOBAL OBJECT
   ========================================================= */

window.NOVA = {
    getUrlParam,
    escapeHTML
};