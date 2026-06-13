import { H as Hls } from "./hls-vendor.js";

const ready = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
};

const normalize = (value) => String(value || "").toLowerCase().trim();

const initMenu = () => {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-mobile-nav]");
  if (!toggle || !nav) {
    return;
  }
  toggle.addEventListener("click", () => {
    nav.classList.toggle("is-open");
  });
};

const initHero = () => {
  const hero = document.querySelector("[data-hero]");
  if (!hero) {
    return;
  }
  const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
  const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
  const prev = hero.querySelector("[data-hero-prev]");
  const next = hero.querySelector("[data-hero-next]");
  if (slides.length < 2) {
    return;
  }
  let index = 0;
  let timer = null;
  const show = (target) => {
    index = (target + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle("active", i === index));
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
  };
  const start = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => show(index + 1), 5200);
  };
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      show(i);
      start();
    });
  });
  if (prev) {
    prev.addEventListener("click", () => {
      show(index - 1);
      start();
    });
  }
  if (next) {
    next.addEventListener("click", () => {
      show(index + 1);
      start();
    });
  }
  hero.addEventListener("mouseenter", () => window.clearInterval(timer));
  hero.addEventListener("mouseleave", start);
  start();
};

const initFilters = () => {
  const lists = Array.from(document.querySelectorAll("[data-filter-list]"));
  if (!lists.length) {
    return;
  }
  const search = document.querySelector("[data-search]");
  const clear = document.querySelector("[data-clear-search]");
  const selects = Array.from(document.querySelectorAll("[data-filter]"));
  const empty = document.querySelector("[data-empty-state]");
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q");
  if (search && initialQuery) {
    search.value = initialQuery;
  }
  const apply = () => {
    const query = normalize(search ? search.value : "");
    const active = Object.fromEntries(selects.map((select) => [select.dataset.filter, normalize(select.value)]));
    let visible = 0;
    lists.forEach((list) => {
      const cards = Array.from(list.querySelectorAll(".movie-card"));
      cards.forEach((card) => {
        const text = normalize(card.dataset.text);
        const genre = normalize(card.dataset.genre);
        const region = normalize(card.dataset.region);
        const year = normalize(card.dataset.year);
        const matchQuery = !query || text.includes(query);
        const matchGenre = !active.genre || genre.includes(active.genre);
        const matchRegion = !active.region || region.includes(active.region);
        const matchYear = !active.year || year === active.year;
        const matched = matchQuery && matchGenre && matchRegion && matchYear;
        card.classList.toggle("is-hidden", !matched);
        if (matched) {
          visible += 1;
        }
      });
    });
    if (empty) {
      empty.classList.toggle("is-visible", visible === 0);
    }
  };
  if (search) {
    search.addEventListener("input", apply);
  }
  selects.forEach((select) => select.addEventListener("change", apply));
  if (clear && search) {
    clear.addEventListener("click", () => {
      search.value = "";
      selects.forEach((select) => {
        select.value = "";
      });
      apply();
      search.focus();
    });
  }
  apply();
};

export const initMoviePlayer = (videoId, overlayId, sourceUrl) => {
  const video = document.getElementById(videoId);
  const overlay = document.getElementById(overlayId);
  if (!video || !overlay || !sourceUrl) {
    return;
  }
  let initialized = false;
  let hls = null;
  const load = () => {
    if (initialized) {
      return;
    }
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = sourceUrl;
    } else if (Hls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
    } else {
      video.src = sourceUrl;
    }
    initialized = true;
  };
  const start = () => {
    load();
    overlay.classList.add("is-hidden");
    video.controls = true;
    const result = video.play();
    if (result && typeof result.catch === "function") {
      result.catch(() => {
        overlay.classList.remove("is-hidden");
      });
    }
  };
  overlay.addEventListener("click", start);
  video.addEventListener("click", () => {
    if (!initialized || video.paused) {
      start();
    }
  });
  video.addEventListener("ended", () => {
    overlay.classList.remove("is-hidden");
  });
  window.addEventListener("pagehide", () => {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  });
};

ready(() => {
  initMenu();
  initHero();
  initFilters();
});
