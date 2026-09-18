// =========================================================
//  BELLA DAY - script.js (OPTIMIZADO Y CORREGIDO)
// =========================================================

// =========================================================
//  DECLARACIONES GLOBALES (antes de cualquier uso)
// =========================================================
const hamburger = document.getElementById('hamburger');
const headerNavEl = document.getElementById('headerNav');

// ===== Año dinámico en el footer =====
const yearEl = document.getElementById('year');
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

// =========================================================
//  DETECCIÓN DE PREFERENCIAS DE MOVIMIENTO
// =========================================================
const prefiereReducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// =========================================================
//  FUNCIÓN AUXILIAR: CERRAR MENÚ MÓVIL
// =========================================================
function cerrarMenuMovil() {
    if (headerNavEl && headerNavEl.classList.contains('open')) {
        headerNavEl.classList.remove('open');
    }
    if (hamburger && hamburger.classList.contains('active')) {
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
    }
}

// =========================================================
//  BOTONES "COPIAR" INDIVIDUALES EN TRANSFERENCIA
// =========================================================
const botonesCopiar = document.querySelectorAll('.btn-copy-mini');

botonesCopiar.forEach(btn => {
    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const targetId = btn.getAttribute('data-copy');
        const el = document.getElementById(targetId);
        if (!el) return;

        const texto = el.textContent.trim();

        const copiarExitoso = () => {
            const textoOriginal = btn.innerHTML;
            btn.innerHTML = `
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                ¡Copiado!
            `;
            btn.classList.add('copiado');
            setTimeout(() => {
                btn.innerHTML = textoOriginal;
                btn.classList.remove('copiado');
            }, 2000);
        };

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(texto);
                copiarExitoso();
                return;
            }
            throw new Error('Clipboard API no disponible');
        } catch (err) {
            // Fallback SIN tocar el scroll
            const temp = document.createElement('textarea');
            temp.value = texto;
            temp.setAttribute('readonly', '');
            temp.style.position = 'fixed';
            temp.style.top = '-1000px';
            temp.style.left = '-1000px';
            temp.style.opacity = '0';
            document.body.appendChild(temp);

            temp.select();
            temp.setSelectionRange(0, texto.length);

            try {
                document.execCommand('copy');
                copiarExitoso();
            } catch (e) {
                alert('No se pudo copiar. El valor es: ' + texto);
            }

            document.body.removeChild(temp);
        }
    });
});

// =========================================================
//  HEADER: RESALTAR SECCIÓN ACTIVA
//  Cache de offsets + throttle con requestAnimationFrame
// =========================================================
const headerNav = document.getElementById('headerNav');
const hnavLinks = headerNav ? headerNav.querySelectorAll('.hnav-btn') : [];

let offsetsCache = [];
let activoActual = 'inicio';
let ticking = false;

function recalcularOffsets() {
    const secciones = ['inicio', 'precios', 'transferencia']
        .map(id => document.getElementById(id))
        .filter(Boolean);

    offsetsCache = secciones.map(sec => ({
        id: sec.id,
        top: sec.offsetTop
    }));
}

function actualizarHeader() {
    if (!headerNav || offsetsCache.length === 0) return;

    const scrollPos = window.scrollY + 160;
    let activo = 'inicio';

    for (let i = 0; i < offsetsCache.length; i++) {
        if (offsetsCache[i].top <= scrollPos) {
            activo = offsetsCache[i].id;
        }
    }

    if (activo !== activoActual) {
        activoActual = activo;
        hnavLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + activo);
        });
    }
}

function onScrollHeader() {
    if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
            actualizarHeader();
            ticking = false;
        });
    }
}

if (headerNav) {
    recalcularOffsets();
    window.addEventListener('scroll', onScrollHeader, { passive: true });
    window.addEventListener('resize', () => {
        clearTimeout(window.__resizeHeaderTimer);
        window.__resizeHeaderTimer = setTimeout(recalcularOffsets, 200);
    }, { passive: true });
    actualizarHeader();
}

// =========================================================
//  ANIMACIÓN DE APARICIÓN AL HACER SCROLL
// =========================================================
if (!prefiereReducirMovimiento && 'IntersectionObserver' in window) {

    const observerOptions = {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
                el.style.willChange = 'auto';
                observer.unobserve(el);
            }
        });
    }, observerOptions);

    const elementosAnimar = document.querySelectorAll(
        '.precio-card, .catalogo-descarga, .transfer-card, .section-title, .section-sub'
    );

    elementosAnimar.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(35px)';
        el.style.transition = 'opacity .6s ease, transform .6s ease';
        el.style.willChange = 'opacity, transform';
        observer.observe(el);
    });
}

// =========================================================
//  SCROLL SUAVE CON COMPENSACIÓN POR HEADER
//  - Cierra el menú móvil al instante
//  - Respeta prefers-reduced-motion
// =========================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || targetId.length < 2) return;
        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        // Cerrar menú móvil inmediatamente (usando la función auxiliar)
        cerrarMenuMovil();

        const headerEl = document.querySelector('.header');
        const headerHeight = headerEl ? headerEl.offsetHeight : 0;
        const offset = headerHeight + 20;

        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({
            top: targetPosition,
            behavior: prefiereReducirMovimiento ? 'auto' : 'smooth'
        });
    });
});

// =========================================================
//  AJUSTE DEL FONDO
//  ✅ FIX: Ya no aplica background-attachment: fixed
//  porque eso bloqueaba el scroll del trackpad en PC/laptop
// =========================================================
const bgImage = document.querySelector('.bg-image');
const esMovilCache = { valor: null };

function ajustarFondo() {
    if (!bgImage) return;

    const esMovil = window.matchMedia('(max-width: 720px)').matches;

    if (esMovilCache.valor === esMovil) return;
    esMovilCache.valor = esMovil;

    if (esMovil) {
        bgImage.style.backgroundSize = 'auto 100%';
        bgImage.style.backgroundPosition = 'center top';
    } else {
        bgImage.style.backgroundSize = 'cover';
        bgImage.style.backgroundPosition = 'center center';
    }

    // 👇 Siempre 'scroll' para no bloquear el trackpad en PC
    bgImage.style.backgroundAttachment = 'scroll';
}

ajustarFondo();

window.addEventListener('resize', () => {
    clearTimeout(window.__resizeBgTimer);
    window.__resizeBgTimer = setTimeout(ajustarFondo, 200);
}, { passive: true });

// =========================================================
//  MENÚ HAMBURGUESA (solo móvil)
// =========================================================
if (hamburger && headerNavEl) {
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        const abierto = headerNavEl.classList.toggle('open');
        hamburger.classList.toggle('active', abierto);
        hamburger.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });

    headerNavEl.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            cerrarMenuMovil();
        });
    });

    document.addEventListener('click', (e) => {
        if (!headerNavEl.contains(e.target) && !hamburger.contains(e.target)) {
            cerrarMenuMovil();
        }
    });

    // Cerrar menú al presionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && headerNavEl.classList.contains('open')) {
            cerrarMenuMovil();
        }
    });
}