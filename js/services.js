/* =========================================================
   NOVA — Services Marketplace
   js/services.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("marketplaceGrid");
    const searchForm = document.getElementById("marketplaceSearchForm");
    const searchInput = document.getElementById("marketplaceSearchInput");
    const categoryPills = document.querySelectorAll(".category-pill");
    const resultCount = document.getElementById("resultsCount");
    const emptyState = document.getElementById("emptyState");
    const sortSelect = document.getElementById("sortSelect");
    const clearFilters = document.getElementById("clearFilters");
    const filterMobileButton = document.getElementById("filterMobileButton");
    const filtersSidebar = document.getElementById("filtersSidebar");

    if (!grid) return;

    const cards = Array.from(
        grid.querySelectorAll(".market-card")
    );

    let activeCategory = "all";
    let searchQuery = "";

    /* =====================================================
       URL PARAMETERS
       ===================================================== */

    const params = new URLSearchParams(
        window.location.search
    );

    const urlCategory = params.get("category");
    const urlSearch = params.get("search");

    if (urlCategory) {
        activeCategory = urlCategory.toLowerCase();

        categoryPills.forEach((pill) => {
            pill.classList.toggle(
                "active",
                pill.dataset.category === activeCategory
            );
        });
    }

    if (urlSearch) {
        searchQuery = urlSearch.toLowerCase();

        if (searchInput) {
            searchInput.value = urlSearch;
        }
    }


    /* =====================================================
       SEARCH
       ===================================================== */

    if (searchForm) {
        searchForm.addEventListener("submit", (event) => {
            event.preventDefault();

            searchQuery = searchInput.value
                .trim()
                .toLowerCase();

            updateURL();
            applyFilters();
        });
    }


    if (searchInput) {
        searchInput.addEventListener("input", () => {
            searchQuery = searchInput.value
                .trim()
                .toLowerCase();

            applyFilters();
        });
    }


    /* =====================================================
       CATEGORY PILLS
       ===================================================== */

    categoryPills.forEach((pill) => {
        pill.addEventListener("click", () => {

            activeCategory =
                pill.dataset.category || "all";

            categoryPills.forEach((item) => {
                item.classList.remove("active");
            });

            pill.classList.add("active");

            updateURL();
            applyFilters();
        });
    });


    /* =====================================================
       CHECKBOX FILTERS
       ===================================================== */

    const categoryCheckboxes =
        document.querySelectorAll(
            "[data-filter-category]"
        );

    const deliveryCheckboxes =
        document.querySelectorAll(
            "[data-filter-delivery]"
        );

    categoryCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener(
            "change",
            applyFilters
        );
    });


    deliveryCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener(
            "change",
            applyFilters
        );
    });


    /* =====================================================
       PRICE FILTERS
       ===================================================== */

    const minPrice =
        document.getElementById("minPrice");

    const maxPrice =
        document.getElementById("maxPrice");

    if (minPrice) {
        minPrice.addEventListener(
            "input",
            applyFilters
        );
    }

    if (maxPrice) {
        maxPrice.addEventListener(
            "input",
            applyFilters
        );
    }


    /* =====================================================
       RATING FILTER
       ===================================================== */

    const ratingInputs =
        document.querySelectorAll(
            'input[name="rating"]'
        );

    ratingInputs.forEach((input) => {
        input.addEventListener(
            "change",
            applyFilters
        );
    });


    /* =====================================================
       SORT
       ===================================================== */

    if (sortSelect) {
        sortSelect.addEventListener(
            "change",
            () => {
                sortCards(sortSelect.value);
            }
        );
    }


    /* =====================================================
       CLEAR FILTERS
       ===================================================== */

    if (clearFilters) {
        clearFilters.addEventListener(
            "click",
            clearAllFilters
        );
    }


    /* =====================================================
       MOBILE FILTER
       ===================================================== */

    if (
        filterMobileButton &&
        filtersSidebar
    ) {
        filterMobileButton.addEventListener(
            "click",
            () => {
                filtersSidebar.classList.toggle(
                    "open"
                );

                const isOpen =
                    filtersSidebar.classList.contains(
                        "open"
                    );

                filterMobileButton.textContent =
                    isOpen
                        ? "✕ Close filters"
                        : "⚙ Filters";
            }
        );
    }


    /* =====================================================
       FAVORITES
       ===================================================== */

    const favoriteButtons =
        document.querySelectorAll(
            "[data-favorite]"
        );

    favoriteButtons.forEach((button, index) => {

        const key =
            `nova-favorite-${index}`;

        const saved =
            localStorage.getItem(key);

        if (saved === "true") {
            button.classList.add("active");
            button.textContent = "♥";
        }

        button.addEventListener(
            "click",
            (event) => {

                event.preventDefault();
                event.stopPropagation();

                const active =
                    button.classList.toggle(
                        "active"
                    );

                button.textContent =
                    active ? "♥" : "♡";

                localStorage.setItem(
                    key,
                    active
                );
            }
        );
    });


    /* =====================================================
       SORT CARDS
       ===================================================== */

    function sortCards(type) {

        const sortedCards =
            [...cards];

        switch (type) {

            case "rating":

                sortedCards.sort((a, b) => {
                    return (
                        Number(
                            b.dataset.rating
                        ) -
                        Number(
                            a.dataset.rating
                        )
                    );
                });

                break;


            case "price-low":

                sortedCards.sort((a, b) => {
                    return (
                        Number(
                            a.dataset.price
                        ) -
                        Number(
                            b.dataset.price
                        )
                    );
                });

                break;


            case "price-high":

                sortedCards.sort((a, b) => {
                    return (
                        Number(
                            b.dataset.price
                        ) -
                        Number(
                            a.dataset.price
                        )
                    );
                });

                break;


            case "newest":

                sortedCards.reverse();

                break;


            default:

                break;
        }


        sortedCards.forEach((card) => {
            grid.appendChild(card);
        });


        applyFilters();
    }


    /* =====================================================
       APPLY FILTERS
       ===================================================== */

    function applyFilters() {

        const selectedCategories =
            Array.from(
                categoryCheckboxes
            )
            .filter(
                (checkbox) =>
                    checkbox.checked
            )
            .map(
                (checkbox) =>
                    checkbox.value
            );


        const selectedDelivery =
            Array.from(
                deliveryCheckboxes
            )
            .filter(
                (checkbox) =>
                    checkbox.checked
            )
            .map(
                (checkbox) =>
                    Number(checkbox.value)
            );


        const selectedRating =
            document.querySelector(
                'input[name="rating"]:checked'
            );


        const minimumRating =
            selectedRating
                ? Number(selectedRating.value)
                : 0;


        const minimumPrice =
            minPrice &&
            minPrice.value !== ""
                ? Number(minPrice.value)
                : 0;


        const maximumPrice =
            maxPrice &&
            maxPrice.value !== ""
                ? Number(maxPrice.value)
                : Infinity;


        let visibleCount = 0;


        cards.forEach((card) => {

            const categories =
                (
                    card.dataset.category ||
                    ""
                )
                .toLowerCase()
                .split(" ");


            const name =
                (
                    card.dataset.name ||
                    ""
                ).toLowerCase();


            const price =
                Number(
                    card.dataset.price || 0
                );


            const rating =
                Number(
                    card.dataset.rating || 0
                );


            const delivery =
                Number(
                    card.dataset.delivery || 0
                );


            /* Category pill */

            const matchesMainCategory =
                activeCategory === "all" ||
                categories.includes(
                    activeCategory
                );


            /* Search */

            const matchesSearch =
                !searchQuery ||
                name.includes(searchQuery) ||
                categories.some(
                    (category) =>
                        category.includes(
                            searchQuery
                        )
                );


            /* Sidebar categories */

            const matchesCategories =
                selectedCategories.length === 0 ||
                selectedCategories.some(
                    (category) =>
                        categories.includes(
                            category
                        )
                );


            /* Delivery */

            const matchesDelivery =
                selectedDelivery.length === 0 ||
                selectedDelivery.some(
                    (limit) =>
                        delivery <= limit
                );


            /* Price */

            const matchesPrice =
                price >= minimumPrice &&
                price <= maximumPrice;


            /* Rating */

            const matchesRating =
                rating >= minimumRating;


            const visible =
                matchesMainCategory &&
                matchesSearch &&
                matchesCategories &&
                matchesDelivery &&
                matchesPrice &&
                matchesRating;


            card.style.display =
                visible ? "" : "none";


            if (visible) {
                visibleCount++;
            }

        });


        updateResultsCount(
            visibleCount
        );


        if (emptyState) {
            emptyState.classList.toggle(
                "show",
                visibleCount === 0
            );
        }
    }


    /* =====================================================
       RESULT COUNT
       ===================================================== */

    function updateResultsCount(count) {

        if (!resultCount) return;

        resultCount.innerHTML =
            `Showing <strong>${count}</strong> service${count === 1 ? "" : "s"}`;
    }


    /* =====================================================
       CLEAR FILTERS
       ===================================================== */

    function clearAllFilters() {

        activeCategory = "all";
        searchQuery = "";

        if (searchInput) {
            searchInput.value = "";
        }


        categoryPills.forEach((pill) => {

            pill.classList.toggle(
                "active",
                pill.dataset.category === "all"
            );

        });


        categoryCheckboxes.forEach(
            (checkbox) => {
                checkbox.checked = false;
            }
        );


        deliveryCheckboxes.forEach(
            (checkbox) => {
                checkbox.checked = false;
            }
        );


        ratingInputs.forEach(
            (input) => {
                input.checked = false;
            }
        );


        if (minPrice) {
            minPrice.value = "";
        }


        if (maxPrice) {
            maxPrice.value = "";
        }


        if (sortSelect) {
            sortSelect.value = "featured";
        }


        updateURL();
        applyFilters();
    }


    /* =====================================================
       URL UPDATE
       ===================================================== */

    function updateURL() {

        const url =
            new URL(
                window.location.href
            );


        url.searchParams.delete(
            "category"
        );

        url.searchParams.delete(
            "search"
        );


        if (
            activeCategory &&
            activeCategory !== "all"
        ) {
            url.searchParams.set(
                "category",
                activeCategory
            );
        }


        if (searchQuery) {
            url.searchParams.set(
                "search",
                searchQuery
            );
        }


        window.history.replaceState(
            {},
            "",
            url
        );
    }


    /* =====================================================
       INITIAL LOAD
       ===================================================== */

    applyFilters();
});