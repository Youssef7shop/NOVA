document.addEventListener("DOMContentLoaded", () => {

  const services = {

    thumbnail: {
      title: "Professional YouTube Thumbnail",
      icon: "🎨",
      category: "YouTube",
      rating: 4.9,
      orders: "120+ orders",
      delivery: "2 days",
      description:
        "Professional and eye-catching YouTube thumbnails designed to increase the visual quality of your channel and make your videos stand out.",
      requirements:
        "Send your video title, main idea, preferred colors, logo if available, and any images you want included.",
      worker: {
        name: "Adam Design",
        initials: "AD",
        specialty: "Graphic Designer",
        description:
          "Professional designer specialized in YouTube thumbnails, social media graphics and modern visual content.",
        rating: "4.9",
        orders: "250+",
        response: "1h"
      },
      packages: [
        {
          name: "Basic",
          price: 49,
          delivery: "2 days",
          revisions: 1,
          description: "1 professional thumbnail"
        },
        {
          name: "Standard",
          price: 79,
          delivery: "2 days",
          revisions: 2,
          description: "2 thumbnails + source files"
        },
        {
          name: "Premium",
          price: 129,
          delivery: "1 day",
          revisions: 3,
          description: "4 thumbnails + source files"
        }
      ],
      reviews: [
        {
          name: "Youssef",
          initials: "Y",
          rating: 5,
          text: "Very clean design and fast delivery. The result looks professional."
        },
        {
          name: "Mehdi",
          initials: "M",
          rating: 5,
          text: "Good communication and excellent quality."
        }
      ]
    },

    tiktok: {
      title: "TikTok Video Editing",
      icon: "🎬",
      category: "Video",
      rating: 4.8,
      orders: "95+ orders",
      delivery: "3 days",
      description:
        "Professional TikTok video editing with modern cuts, transitions, captions and engaging pacing.",
      requirements:
        "Send your raw video, desired style, text/captions, music preference and any references.",
      worker: {
        name: "Yassine Edit",
        initials: "YE",
        specialty: "Video Editor",
        description:
          "Video editor focused on TikTok, Reels, Shorts and social media content.",
        rating: "4.8",
        orders: "180+",
        response: "2h"
      },
      packages: [
        {
          name: "Basic",
          price: 79,
          delivery: "3 days",
          revisions: 1,
          description: "Up to 30 seconds"
        },
        {
          name: "Standard",
          price: 119,
          delivery: "3 days",
          revisions: 2,
          description: "Up to 60 seconds"
        },
        {
          name: "Premium",
          price: 179,
          delivery: "2 days",
          revisions: 3,
          description: "Up to 90 seconds"
        }
      ],
      reviews: [
        {
          name: "Hamza",
          initials: "H",
          rating: 5,
          text: "The editing style was exactly what I wanted."
        },
        {
          name: "Anas",
          initials: "A",
          rating: 4,
          text: "Good work and quick communication."
        }
      ]
    },

    reels: {
      title: "Instagram Reels Editing",
      icon: "📱",
      category: "Instagram",
      rating: 5.0,
      orders: "80+ orders",
      delivery: "3 days",
      description:
        "Modern Instagram Reels editing optimized for social media with smooth transitions, captions and engaging cuts.",
      requirements:
        "Send your raw footage, brand colors, captions, logo and preferred music.",
      worker: {
        name: "Studio Social",
        initials: "SS",
        specialty: "Social Media Editor",
        description:
          "Creative studio specialized in Instagram Reels, TikTok content and social media visuals.",
        rating: "5.0",
        orders: "160+",
        response: "1h"
      },
      packages: [
        {
          name: "Basic",
          price: 99,
          delivery: "3 days",
          revisions: 1,
          description: "1 Reel up to 30 sec"
        },
        {
          name: "Standard",
          price: 149,
          delivery: "3 days",
          revisions: 2,
          description: "2 Reels + captions"
        },
        {
          name: "Premium",
          price: 249,
          delivery: "2 days",
          revisions: 3,
          description: "4 Reels + captions"
        }
      ],
      reviews: [
        {
          name: "Sara",
          initials: "S",
          rating: 5,
          text: "Excellent Reels editing. Very professional."
        },
        {
          name: "Aya",
          initials: "A",
          rating: 5,
          text: "Amazing result and great communication."
        }
      ]
    },

    logo: {
      title: "Modern Logo Design",
      icon: "✏️",
      category: "Design",
      rating: 4.9,
      orders: "70+ orders",
      delivery: "4 days",
      description:
        "Modern and professional logo design created to give your brand a strong and memorable visual identity.",
      requirements:
        "Send your brand name, business type, preferred colors, style references and any existing ideas.",
      worker: {
        name: "M Design",
        initials: "MD",
        specialty: "Brand Designer",
        description:
          "Designer specialized in logos, branding, social media identity and modern visual systems.",
        rating: "4.9",
        orders: "140+",
        response: "3h"
      },
      packages: [
        {
          name: "Basic",
          price: 149,
          delivery: "4 days",
          revisions: 1,
          description: "1 logo concept"
        },
        {
          name: "Standard",
          price: 249,
          delivery: "4 days",
          revisions: 2,
          description: "2 logo concepts + source"
        },
        {
          name: "Premium",
          price: 399,
          delivery: "3 days",
          revisions: 3,
          description: "3 concepts + full brand kit"
        }
      ],
      reviews: [
        {
          name: "Omar",
          initials: "O",
          rating: 5,
          text: "Very professional logo and excellent communication."
        },
        {
          name: "Rachid",
          initials: "R",
          rating: 5,
          text: "The final logo looks exactly like a real brand identity."
        }
      ]
    }

  };


  const relatedServices = [
    {
      id: "thumbnail",
      title: "YouTube Thumbnail",
      icon: "🎨",
      price: "49 MAD"
    },
    {
      id: "tiktok",
      title: "TikTok Video Editing",
      icon: "🎬",
      price: "79 MAD"
    },
    {
      id: "reels",
      title: "Instagram Reels Editing",
      icon: "📱",
      price: "99 MAD"
    }
  ];


  const params = new URLSearchParams(window.location.search);
  const serviceId = params.get("id");

  const service = services[serviceId];


  const loading = document.getElementById("serviceLoading");
  const error = document.getElementById("serviceError");
  const content = document.getElementById("serviceContent");


  if (!service) {
    loading.style.display = "none";
    error.style.display = "block";
    return;
  }


  loading.style.display = "none";
  content.style.display = "block";


  /* =========================
     BASIC SERVICE INFO
  ========================= */

  document.title = `${service.title} — NOVA`;

  document.getElementById("breadcrumbTitle").textContent =
    service.title;

  document.getElementById("serviceIcon").textContent =
    service.icon;

  document.getElementById("serviceHeroTitle").textContent =
    service.title;

  document.getElementById("serviceHeroDescription").textContent =
    service.description;

  document.getElementById("serviceTitle").textContent =
    service.title;

  document.getElementById("serviceRating").textContent =
    `⭐ ${service.rating}`;

  document.getElementById("serviceOrders").textContent =
    service.orders;

  document.getElementById("serviceDelivery").textContent =
    `⚡ ${service.delivery} delivery`;

  document.getElementById("serviceDescription").textContent =
    service.description;

  document.getElementById("featureDelivery").textContent =
    `Delivery in ${service.delivery}.`;

  document.getElementById("requirements").textContent =
    service.requirements;


  /* =========================
     WORKER
  ========================= */

  document.getElementById("workerAvatar").textContent =
    service.worker.initials;

  document.getElementById("workerName").textContent =
    service.worker.name;

  document.getElementById("workerSpecialty").textContent =
    service.worker.specialty;

  document.getElementById("workerDescription").textContent =
    service.worker.description;

  document.getElementById("workerRating").textContent =
    service.worker.rating;

  document.getElementById("workerOrders").textContent =
    service.worker.orders;

  document.getElementById("workerResponse").textContent =
    service.worker.response;


  /* =========================
     PACKAGES
  ========================= */

  const packagesContainer =
    document.getElementById("packagesContainer");

  let selectedPackage = service.packages[1] || service.packages[0];


  function renderPackages() {

    packagesContainer.innerHTML = "";

    service.packages.forEach((pkg, index) => {

      const article = document.createElement("article");

      article.className =
        `package ${index === 1 ? "featured" : ""}`;

      article.innerHTML = `
        <div class="package-label">
          ${index === 1 ? "Most Popular" : pkg.name}
        </div>

        <h4>${pkg.name}</h4>

        <div class="package-price">
          ${pkg.price} MAD
        </div>

        <ul>
          <li>${pkg.description}</li>
          <li>${pkg.delivery} delivery</li>
          <li>${pkg.revisions} revision${pkg.revisions > 1 ? "s" : ""}</li>
          <li>Direct communication</li>
        </ul>

        <button
          class="btn ${index === 1 ? "btn-primary" : "btn-ghost"} package-select"
          data-index="${index}"
        >
          Select ${pkg.name}
        </button>
      `;

      packagesContainer.appendChild(article);
    });


    document
      .querySelectorAll(".package-select")
      .forEach(button => {

        button.addEventListener("click", () => {

          const index =
            Number(button.dataset.index);

          selectedPackage =
            service.packages[index];

          updateSelectedPackage();

          document
            .querySelectorAll(".package")
            .forEach(card =>
              card.classList.remove("featured")
            );

          button.closest(".package")
            .classList.add("featured");

          document.getElementById("orderBtn")
            .scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
        });

      });
  }


  function updateSelectedPackage() {

    document.getElementById("selectedPackageName")
      .textContent = selectedPackage.name;

    document.getElementById("selectedPackageDelivery")
      .textContent = selectedPackage.delivery;

    document.getElementById("selectedPackagePrice")
      .textContent = `${selectedPackage.price} MAD`;

    document.getElementById("featureRevisions")
      .textContent =
      `${selectedPackage.revisions} revision${selectedPackage.revisions > 1 ? "s" : ""} included.`;
  }


  renderPackages();
  updateSelectedPackage();


  /* =========================
     REVIEWS
  ========================= */

  const reviewList =
    document.getElementById("reviewList");

  reviewList.innerHTML = "";

  service.reviews.forEach(review => {

    const article =
      document.createElement("article");

    article.className = "review";

    const stars =
      "★".repeat(review.rating) +
      "☆".repeat(5 - review.rating);

    article.innerHTML = `
      <div class="review-top">

        <div class="review-user">

          <div class="review-avatar">
            ${review.initials}
          </div>

          <div>
            <strong>${review.name}</strong>
            <span>Completed order</span>
          </div>

        </div>

        <div class="stars">
          ${stars}
        </div>

      </div>

      <p>${review.text}</p>
    `;

    reviewList.appendChild(article);
  });


  /* =========================
     RELATED SERVICES
  ========================= */

  const relatedContainer =
    document.getElementById("relatedServices");

  relatedContainer.innerHTML = "";

  relatedServices
    .filter(item => item.id !== serviceId)
    .forEach(item => {

      const link =
        document.createElement("a");

      link.className = "related-card";

      link.href =
        `service.html?id=${item.id}`;

      link.innerHTML = `
        <div class="related-icon">
          ${item.icon}
        </div>

        <h4>${item.title}</h4>

        <span>
          Starting from ${item.price}
        </span>
      `;

      relatedContainer.appendChild(link);
    });


  /* =========================
     FAVORITE
  ========================= */

  const favoriteBtn =
    document.getElementById("favoriteBtn");

  const favoriteKey =
    `nova-favorite-service-${serviceId}`;

  const isFavorite =
    localStorage.getItem(favoriteKey) === "true";

  if (isFavorite) {
    favoriteBtn.classList.add("active");
    favoriteBtn.textContent = "♥";
  }


  favoriteBtn.addEventListener("click", () => {

    const active =
      favoriteBtn.classList.toggle("active");

    localStorage.setItem(
      favoriteKey,
      active ? "true" : "false"
    );

    favoriteBtn.textContent =
      active ? "♥" : "♡";
  });


  /* =========================
     SHARE
  ========================= */

  document.getElementById("shareBtn")
    .addEventListener("click", async () => {

      const shareData = {
        title: service.title,
        text: `Check this service on NOVA: ${service.title}`,
        url: window.location.href
      };

      try {

        if (navigator.share) {

          await navigator.share(shareData);

        } else {

          await navigator.clipboard
            .writeText(window.location.href);

          alert("Service link copied!");

        }

      } catch (error) {
        console.log("Share cancelled.");
      }

    });


  /* =========================
     ORDER
  ========================= */

  document.getElementById("orderBtn")
    .addEventListener("click", () => {

      /*
       * DEMO MODE
       *
       * Supabase order creation will be connected
       * later.
       */

      const params =
        new URLSearchParams();

      params.set("service", serviceId);
      params.set("package", selectedPackage.name);

      window.location.href =
        `login.html?redirect=service.html?id=${encodeURIComponent(serviceId)}`;
    });


  /* =========================
     MESSAGE WORKER
  ========================= */

  document.getElementById("messageBtn")
    .addEventListener("click", () => {

      alert(
        "Messaging will be connected with NOVA Chat after Supabase integration."
      );

    });

});