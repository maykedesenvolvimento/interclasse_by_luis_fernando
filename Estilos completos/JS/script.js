// ==========================================
// MENU MOBILE - HAMBÚRGUER
// ==========================================
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Abrir/Fechar menu ao clicar no hambúrguer
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Fechar menu ao clicar em qualquer link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ==========================================
// CARROSSEL DE IMAGENS
// ==========================================
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const indicators = document.querySelectorAll('.indicator');

// Função para mostrar slide específico
function showSlide(index) {
    // Remove classe active de todos os slides e indicadores
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // Controle de limites (loop infinito)
    if (index >= slides.length) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = slides.length - 1;
    } else {
        currentSlide = index;
    }
    
    // Adiciona classe active ao slide e indicador atual
    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
}

// Função para mover o carrossel (próximo/anterior)
function moveCarousel(direction) {
    showSlide(currentSlide + direction);
}

// Função para ir direto a um slide específico
function goToSlide(index) {
    showSlide(index);
}

// Auto-play do carrossel (troca a cada 5 segundos)
setInterval(() => {
    moveCarousel(1);
}, 5000);

// Inicializa o carrossel
showSlide(0);

// ==========================================
// MODALS (JANELAS POP-UP)
// ==========================================

// Função para abrir modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Previne scroll da página
}

// Função para fechar modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaura scroll da página
}

// Fechar modal ao clicar fora dele (no fundo escuro)
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// Fechar modal com a tecla Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }
});

// ==========================================
// SMOOTH SCROLL (ROLAGEM SUAVE)
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==========================================
// EFEITO PARALLAX
// ==========================================
window.addEventListener('scroll', function() {
    const parallaxSections = document.querySelectorAll('.parallax-section, .parallax-section-2');
    parallaxSections.forEach(section => {
        let scrollPosition = window.pageYOffset;
        section.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
    });
});

// ==========================================
// ANIMAÇÃO AO SCROLL (INTERSECTION OBSERVER)
// ==========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Aplicar animação aos cards quando carregam
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.modalidade-card, .stat-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
});