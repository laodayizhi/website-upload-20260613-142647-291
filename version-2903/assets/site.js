(() => {
    const qs = (selector, root = document) => root.querySelector(selector);
    const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    function openSearch(form) {
        const input = form.querySelector('input[name="q"]');
        const base = form.getAttribute('data-search-url') || form.getAttribute('action') || 'search.html';
        const query = input ? input.value.trim() : '';
        const url = query ? `${base}?q=${encodeURIComponent(query)}` : base;
        window.location.href = url;
    }

    function setupNavigation() {
        const toggle = qs('.mobile-toggle');
        const panel = qs('.mobile-panel');
        if (toggle && panel) {
            toggle.addEventListener('click', () => {
                panel.classList.toggle('is-open');
                toggle.classList.toggle('is-open');
            });
        }
        qsa('.search-form').forEach((form) => {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                openSearch(form);
            });
        });
    }

    function setupHero() {
        const slides = qsa('.hero-slide');
        const dots = qsa('.hero-dot');
        if (!slides.length || !dots.length) {
            return;
        }
        let current = 0;
        let timer = null;
        const show = (index) => {
            current = (index + slides.length) % slides.length;
            slides.forEach((slide, slideIndex) => {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach((dot, dotIndex) => {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        };
        const start = () => {
            timer = window.setInterval(() => show(current + 1), 5200);
        };
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                if (timer) {
                    window.clearInterval(timer);
                }
                show(index);
                start();
            });
        });
        start();
    }

    function setupFilters() {
        const panel = qs('.filter-panel');
        const cards = qsa('.filter-grid .movie-card');
        if (!panel || !cards.length) {
            return;
        }
        const input = qs('.filter-input', panel);
        const type = qs('.filter-type', panel);
        const year = qs('.filter-year', panel);
        const apply = () => {
            const keyword = input ? input.value.trim().toLowerCase() : '';
            const selectedType = type ? type.value : '';
            const selectedYear = year ? year.value : '';
            cards.forEach((item) => {
                const text = item.getAttribute('data-search') || '';
                const itemType = item.getAttribute('data-type') || '';
                const itemYear = item.getAttribute('data-year') || '';
                const matched = (!keyword || text.includes(keyword)) && (!selectedType || itemType === selectedType) && (!selectedYear || itemYear === selectedYear);
                item.classList.toggle('is-hidden', !matched);
            });
        };
        [input, type, year].forEach((control) => {
            if (control) {
                control.addEventListener('input', apply);
                control.addEventListener('change', apply);
            }
        });
    }

    function movieCardHtml(movie) {
        const tags = (movie.tags || []).slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
        const img = `./${movie.coverIndex}.jpg`;
        const meta = [movie.year, movie.region, movie.categoryName].filter(Boolean).map(escapeHtml).join(' · ');
        return `<article class="movie-card">
    <a class="movie-card__poster" href="${escapeHtml(movie.url)}" aria-label="${escapeHtml(movie.title)}">
        <img src="${img}" alt="${escapeHtml(movie.title)}" loading="lazy" onerror="this.style.opacity='0';this.onerror=null;">
        <span class="movie-card__play">▶</span>
    </a>
    <div class="movie-card__body">
        <div class="movie-card__meta"><span>${meta}</span></div>
        <h3><a href="${escapeHtml(movie.url)}">${escapeHtml(movie.title)}</a></h3>
        <p>${escapeHtml(movie.oneLine || '')}</p>
        <div class="movie-card__tags">${tags}</div>
        <div class="movie-card__score"><span>★ ${Number(movie.rating).toFixed(1)}</span><span>${formatViews(movie.views)}</span></div>
    </div>
</article>`;
    }

    function setupSearchPage() {
        const form = qs('.search-page-form');
        const results = qs('.search-results');
        if (!form || !results || !window.MOVIE_DATA) {
            return;
        }
        const input = form.querySelector('input[name="q"]');
        const params = new URLSearchParams(window.location.search);
        const initial = params.get('q') || '';
        if (input) {
            input.value = initial;
        }
        const render = () => {
            const query = input ? input.value.trim().toLowerCase() : '';
            const list = window.MOVIE_DATA.filter((movie) => {
                const text = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.categoryName, (movie.tags || []).join(' '), movie.oneLine].join(' ').toLowerCase();
                return !query || text.includes(query);
            }).slice(0, 120);
            results.innerHTML = list.map(movieCardHtml).join('');
        };
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const query = input ? input.value.trim() : '';
            const url = query ? `search.html?q=${encodeURIComponent(query)}` : 'search.html';
            window.history.replaceState(null, '', url);
            render();
        });
        if (input) {
            input.addEventListener('input', render);
        }
        render();
    }

    function setupPlayers() {
        qsa('.player-shell').forEach((shell) => {
            const video = qs('video', shell);
            const cover = qs('.player-cover', shell);
            if (!video || !cover) {
                return;
            }
            const start = () => {
                const playUrl = shell.getAttribute('data-play');
                if (!playUrl) {
                    return;
                }
                shell.classList.add('is-playing');
                if (shell.getAttribute('data-ready') !== '1') {
                    shell.setAttribute('data-ready', '1');
                    if (window.Hls && window.Hls.isSupported()) {
                        const hls = new window.Hls({ enableWorker: true });
                        hls.attachMedia(video);
                        hls.on(window.Hls.Events.MEDIA_ATTACHED, () => {
                            hls.loadSource(playUrl);
                        });
                        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
                            video.play().catch(() => {});
                        });
                        shell._hls = hls;
                    } else {
                        video.src = playUrl;
                        video.addEventListener('loadedmetadata', () => {
                            video.play().catch(() => {});
                        }, { once: true });
                    }
                }
                video.play().catch(() => {});
            };
            cover.addEventListener('click', start);
            video.addEventListener('click', () => {
                if (shell.getAttribute('data-ready') !== '1') {
                    start();
                }
            });
        });
    }

    function formatViews(value) {
        const views = Number(value) || 0;
        if (views >= 10000) {
            return `${(views / 10000).toFixed(1)}万`;
        }
        return String(views);
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"]/g, (char) => {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;'
            };
            return map[char] || char;
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        setupNavigation();
        setupHero();
        setupFilters();
        setupSearchPage();
        setupPlayers();
    });
})();
