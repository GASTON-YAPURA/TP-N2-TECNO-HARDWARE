// Menú hamburguesa funcionalidad
const menuToggle = document.querySelector('.menu-toggle');
const navList = document.querySelector('.nav-list');
menuToggle.addEventListener('click', function() {
    navList.classList.toggle('open');
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !expanded);
});

// Slider "Público Objetivo" - autoplay e infinito (mejorado)
(function() {
    const viewport = document.querySelector('.publico-viewport');
    const track = document.querySelector('.publico-track');
    if (!viewport || !track) return;

    let slidesToShow = getSlidesToShow();
    const AUTOPLAY_INTERVAL = 2500; // ms
    let index = slidesToShow; // empezamos despues de los clones prepended
    let isAnimating = false;
    let autoplayId = null;
    let originalCount = 0;

    function getSlidesToShow() {
        const w = window.innerWidth;
        if (w <= 480) return 1;
        if (w <= 1024) return 2;
        return 4;
    }

    function setSlideWidths() {
        const viewportWidth = viewport.clientWidth;
        const slideWidth = viewportWidth / slidesToShow;
        Array.from(track.children).forEach(s => {
            s.style.minWidth = slideWidth + 'px';
        });
    }

    // Crear clones al inicio (últimos N) y al final (primeros N) para loop infinito
    function setupInfinite() {
        // eliminar clones previos
        const existingClones = track.querySelectorAll('.clone');
        existingClones.forEach(c => c.remove());

        // recuperar slides reales (los que quedan ahora en track)
        const realSlides = Array.from(track.children);
        originalCount = realSlides.length;
        if (originalCount === 0) return;

        // si slidesToShow es mayor que originalCount, ajustarlo (evita errores)
        if (slidesToShow >= originalCount) slidesToShow = Math.max(1, originalCount);

        // clonar últimos N y poner al inicio
        for (let i = originalCount - slidesToShow; i < originalCount; i++) {
            const clone = realSlides[i].cloneNode(true);
            clone.classList.add('clone');
            track.insertBefore(clone, track.firstChild);
        }

        // clonar primeros N y poner al final (usar los mismos realSlides originales)
        for (let i = 0; i < slidesToShow; i++) {
            const clone = realSlides[i].cloneNode(true);
            clone.classList.add('clone');
            track.appendChild(clone);
        }

        // actualizar index para comenzar en el primer slide real
        index = slidesToShow;
        // fijar anchos
        setSlideWidths();
        // posicion inicial sin animación
        moveTo(index, true);
    }

    function moveTo(idx, instant = false) {
        // permitir reubicación instantánea aun si isAnimating true (cuando instant es true)
        if (isAnimating && !instant) return;
        isAnimating = !instant; // si es instant, no considerar como animando
        const viewportWidth = viewport.clientWidth;
        const slideWidth = viewportWidth / slidesToShow;
        track.style.transition = instant ? 'none' : 'transform 0.5s ease';
        track.style.transform = `translateX(${-idx * slideWidth}px)`;
        index = idx;
        if (instant) {
            // forzar repaint y permitir nuevas interacciones
            requestAnimationFrame(() => { isAnimating = false; });
        }
    }

    function next() {
        if (isAnimating) return;
        moveTo(index + 1);
    }

    function prev() {
        if (isAnimating) return;
        moveTo(index - 1);
    }

    track.addEventListener('transitionend', () => {
        // número de slides reales (sin clones)
        const realTotal = originalCount;
        // limites en el track con clones: [0 .. realTotal + 2*slidesToShow -1]
        // si nos desplazamos más allá del final de los reales -> reiniciar a la posición equivalente
        if (index >= realTotal + slidesToShow) {
            // por ejemplo index = realTotal + slidesToShow -> mover a slidesToShow (misma apariencia)
            index = index - realTotal;
            moveTo(index, true);
        } else if (index < slidesToShow) {
            // si entramos en los clones prepended, saltar a la posición equivalente al final
            index = index + realTotal;
            moveTo(index, true);
        } else {
            // transición normal terminó
            isAnimating = false;
        }
        // asegurar flag correcto
        isAnimating = false;
    });

    // Botones
    const nextBtn = document.querySelector('.pub-next');
    const prevBtn = document.querySelector('.pub-prev');
    if (nextBtn) nextBtn.addEventListener('click', () => { stopAutoplay(); next(); startAutoplay(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { stopAutoplay(); prev(); startAutoplay(); });

    // Autoplay
    function startAutoplay() {
        stopAutoplay();
        autoplayId = setInterval(() => { next(); }, AUTOPLAY_INTERVAL);
    }
    function stopAutoplay() {
        if (autoplayId) { clearInterval(autoplayId); autoplayId = null; }
    }

    // Pausar al hover
    viewport.addEventListener('mouseenter', stopAutoplay);
    viewport.addEventListener('mouseleave', startAutoplay);

    // Resize handling: recalcular slidesToShow y reconstruir clones
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const newSlidesToShow = getSlidesToShow();
            if (newSlidesToShow !== slidesToShow) {
                slidesToShow = newSlidesToShow;
            }
            // reconstruir el slider (elimina clones y vuelve a crear)
            setupInfinite();
        }, 150);
    });

    // Inicializar
    slidesToShow = getSlidesToShow();
    setSlideWidths();
    setupInfinite();
    startAutoplay();
})();