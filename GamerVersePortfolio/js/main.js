document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('header');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    // i18n Dictionary
    const translations = {
        en: {
            "nav-home": "Home",
            "nav-games": "Games",
            "nav-privacy": "Privacy",
            "nav-about": "About Us",
            "nav-support": "Support",
            
            "hero-badge": "GamerVerse 307",
            "hero-title-1": "Satisfying & Addictive",
            "hero-title-2": "Arcade Experiences",
            "hero-desc": "We design arcade and casual mobile games featuring dynamic mechanics and fluid one-finger dragging controls. Founded by Fernando Alberto Goncalvez Aguilar.",
            "hero-btn-games": "Browse Games",
            "hero-btn-contact": "Contact Support",
            
            "meta-dev-label": "Legal Developer",
            "meta-id-label": "Google Play Developer ID",
            "meta-contact-label": "Official Contact",
            
            "games-section-title": "Our Games",
            "games-section-subtitle": "Explore our portfolio of fast-paced, highly engaging arcade games optimized for Android and iOS.",
            "game-tag-1": "Space Arcade / Shooter",
            "game-desc-1": "An action-packed space shooter where you protect a lost astronaut. Evade plasma storms, gather cosmic coins, and defeat challenging bosses using fluid dragging controls.",
            "game-tag-2": "Arcade / Puzzle",
            "game-desc-2": "A challenging puzzle-arcade hybrid. Dodging high-speed arrow waves, plan your routes carefully, and test your reflexes in increasingly complex levels.",
            "game-tag-3": "Endless Runner",
            "game-desc-3": "Dash through floating platforms in deep space. Avoid neon meteorites, collect speed boosts, and beat your own high score in this addictive casual runner.",
            "game-links-privacy": "Privacy",
            "game-links-download": "Coming Soon",
            
            "privacy-section-title": "Privacy Policies",
            "privacy-section-subtitle": "In compliance with Google Play Developer Program Policies, we provide detailed, public privacy policies for each of our published games.",
            "privacy-desc-1": "Official privacy policy applicable for Android & iOS.",
            "privacy-desc-2": "Official privacy policy applicable for Android & iOS.",
            "privacy-btn": "View Policy",
            
            "about-badge": "About Us",
            "about-title": "GamerVerse 307",
            "about-desc-1": "We are an independent game development studio founded by Fernando Alberto Goncalvez Aguilar based in Doral, Florida. Our philosophy is to create gameplay mechanics that are easy to learn yet challenging to master.",
            "about-desc-2": "Each of our titles is meticulously designed with the mobile user in mind, incorporating clean layouts, optimized performance via modern hybrid web technologies, and carefully balanced gameplay.",
            
            "support-title": "Support & Contact",
            "support-desc": "Do you have any questions, feedback, or need technical support with any of our games? Feel free to contact us directly.",
            "support-email-label": "Direct Email",
            "verification-box-title": "Google Play Verification",
            "verification-box-desc": "This website serves as the official developer portal for the personal account of Fernando Alberto Goncalvez Aguilar (GamerVerse 307) registered under Developer ID 8432820019942584164. For identity validation and Google Play policy verification requests, please contact us via our verified email address."
        },
        es: {
            "nav-home": "Inicio",
            "nav-games": "Juegos",
            "nav-privacy": "Privacidad",
            "nav-about": "Nosotros",
            "nav-support": "Soporte",
            
            "hero-badge": "GamerVerse 307",
            "hero-title-1": "Experiencias Arcade",
            "hero-title-2": "satisfactorias y adictivas",
            "hero-desc": "Diseñamos videojuegos móviles arcade y casuales con mecánicas dinámicas y controles optimizados para un solo dedo. Creado por Fernando Alberto Goncalvez Aguilar.",
            "hero-btn-games": "Ver Juegos",
            "hero-btn-contact": "Contactar Soporte",
            
            "meta-dev-label": "Desarrollador Legal",
            "meta-id-label": "ID de Desarrollador de Google Play",
            "meta-contact-label": "Contacto Oficial",
            
            "games-section-title": "Nuestros Videojuegos",
            "games-section-subtitle": "Explora nuestro portafolio de juegos arcade rápidos y adictivos, optimizados para Android e iOS.",
            "game-tag-1": "Space Arcade / Shooter",
            "game-desc-1": "Un shooter espacial en el que debes proteger a un astronauta perdido. Esquiva tormentas de plasma, recoge monedas cósmicas y vence a jefes desafiantes con controles fluidos de arrastre directo.",
            "game-tag-2": "Arcade / Puzzle",
            "game-desc-2": "Un desafiante híbrido entre puzzle y arcade táctico. Esquiva lluvias de flechas de alta velocidad, planifica tus movimientos y pon a prueba tus reflejos en niveles cada vez más complejos.",
            "game-tag-3": "Endless Runner",
            "game-desc-3": "Corre por plataformas flotantes en el espacio profundo. Esquiva meteoritos de neón, recolecta potenciadores de velocidad y rompe tu propio récord de puntuación en este adictivo runner casual.",
            "game-links-privacy": "Políticas",
            "game-links-download": "Próximamente",
            
            "privacy-section-title": "Políticas de Privacidad",
            "privacy-section-subtitle": "De conformidad con los requisitos de Google Play Developer Program Policies, proporcionamos las políticas de privacidad detalladas de cada uno de nuestros juegos.",
            "privacy-desc-1": "Política de privacidad oficial aplicable para Android e iOS.",
            "privacy-desc-2": "Política de privacidad oficial aplicable para Android e iOS.",
            "privacy-btn": "Ver Política",
            
            "about-badge": "Sobre Nosotros",
            "about-title": "GamerVerse 307",
            "about-desc-1": "Somos un estudio de desarrollo de videojuegos fundado por Fernando Alberto Goncalvez Aguilar con base en Doral, Florida. Nuestra filosofía consiste en crear mecánicas de juego fáciles de aprender pero desafiantes de dominar.",
            "about-desc-2": "Cada uno de nuestros títulos es diseñado meticulosamente pensando en la experiencia del usuario móvil, incorporando interfaces limpias, rendimiento optimizado mediante tecnologías web híbridas modernas y balanceos refinados.",
            
            "support-title": "Soporte y Contacto",
            "support-desc": "¿Tienes alguna pregunta, sugerencia o necesitas soporte con alguno de nuestros juegos? Ponte en contacto con nosotros directamente.",
            "support-email-label": "Correo Electrónico Directo",
            "verification-box-title": "Verificación de Google Play",
            "verification-box-desc": "Este sitio web actúa como el portal oficial de desarrollador para la cuenta personal de Fernando Alberto Goncalvez Aguilar (GamerVerse 307) registrada con el ID 8432820019942584164. Para consultas de validación de identidad o cumplimiento de políticas de Google Play, por favor póngase en contacto a través de nuestro correo oficial verificado."
        },
        pt: {
            "nav-home": "Início",
            "nav-games": "Jogos",
            "nav-privacy": "Privacidade",
            "nav-about": "Sobre Nós",
            "nav-support": "Suporte",
            
            "hero-badge": "GamerVerse 307",
            "hero-title-1": "Experiências Arcade",
            "hero-title-2": "satisfatórias e viciantes",
            "hero-desc": "Projetamos jogos móveis arcade e casuais com mecânicas dinâmicas e controles fluidos de arrastar com um único dedo. Criado por Fernando Alberto Goncalvez Aguilar.",
            "hero-btn-games": "Ver Jogos",
            "hero-btn-contact": "Contatar Suporte",
            
            "meta-dev-label": "Desenvolvedor Legal",
            "meta-id-label": "ID de Desenvolvedor do Google Play",
            "meta-contact-label": "Contato Oficial",
            
            "games-section-title": "Nossos Jogos",
            "games-section-subtitle": "Explore nosso portfólio de jogos arcade rápidos e envolventes, otimizados para Android e iOS.",
            "game-tag-1": "Space Arcade / Shooter",
            "game-desc-1": "Um shooter espacial onde você protege um astronauta perdido. Esquive de tempestades de plasma, colete moedas cósmicas e vença chefes desafiadores com controles fluidos de arrasto.",
            "game-tag-2": "Arcade / Puzzle",
            "game-desc-2": "Um desafiador híbrido de puzzle e arcade. Desvie de ondas de flechas em alta velocidade, planeje suas rotas com cuidado e teste seus reflexos em níveis progressivamente complexos.",
            "game-tag-3": "Endless Runner",
            "game-desc-3": "Corra por plataformas flutuantes no espaço profundo. Desvie de meteoritos de néon, colete aumentos de velocidade e quebre seu próprio recorde neste viciante runner casual.",
            "game-links-privacy": "Privacidade",
            "game-links-download": "Em Breve",
            
            "privacy-section-title": "Políticas de Privacidade",
            "privacy-section-subtitle": "Em conformidade com as Políticas de Programas para Desenvolvedores do Google Play, fornecemos políticas de privacidade detalhadas e públicas para cada um dos nossos jogos.",
            "privacy-desc-1": "Política de privacidade oficial aplicável para Android e iOS.",
            "privacy-desc-2": "Política de privacidade oficial aplicável para Android e iOS.",
            "privacy-btn": "Ver Política",
            
            "about-badge": "Sobre Nós",
            "about-title": "GamerVerse 307",
            "about-desc-1": "Somos um estúdio de desenvolvimento de jogos independente fundado por Fernando Alberto Goncalvez Aguilar, com sede em Doral, Flórida. Nossa filosofia é criar mecânicas fáceis de aprender, mas desafiadoras de dominar.",
            "about-desc-2": "Cada um de nossos títulos é meticulosamente projetado com o usuário móvel em mente, incorporando layouts limpos, desempenho otimizado por meio de tecnologias web híbridas modernas e jogabilidade balanceada.",
            
            "support-title": "Suporte & Contato",
            "support-desc": "Tem alguma dúvida, feedback ou precisa de suporte técnico com algum dos nossos jogos? Entre em contato diretamente conosco.",
            "support-email-label": "E-mail Direto",
            "verification-box-title": "Verificação do Google Play",
            "verification-box-desc": "Este site serve como o portal oficial do desenvolvedor para a conta pessoal de Fernando Alberto Goncalvez Aguilar (GamerVerse 307) registrada com o ID de Desenvolvedor 8432820019942584164. Para solicitações de validação de identidade e verificação de políticas do Google Play, entre em contato através do nosso endereço de e-mail verificado."
        }
    };

    // Handle Language Switching
    function setLanguage(lang) {
        // Toggle Active Class in Switcher Buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Set Body Language Class
        document.body.className = document.body.className.replace(/\blang-active-\S+/g, '');
        document.body.classList.add(`lang-active-${lang}`);
        document.documentElement.setAttribute('lang', lang);

        // Translate Elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const translationKey = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][translationKey]) {
                // If it's a link or contains nested elements we don't want to wipe, check carefully
                el.innerText = translations[lang][translationKey];
            }
        });

        // Save selection
        localStorage.setItem('gamerverse_lang', lang);
    }

    // Initialize switcher buttons click events
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            setLanguage(lang);
        });
    });

    // Determine initial language (saved preference -> or default to 'en')
    const initialLang = localStorage.getItem('gamerverse_lang') || 'en';
    setLanguage(initialLang);

    // Header scroll background effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        highlightNav();
    });

    // Navigation active state highlight on scroll
    function highlightNav() {
        let scrollPosition = window.scrollY + 120; // offset for header height

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // Smooth navigation clicking
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerOffset = 80;
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Set active class manually immediately
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Simple entry scroll animation
    const animateElements = document.querySelectorAll('.game-card, .dev-meta-card, .about-visual, .about-text, .privacy-list-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15
    });

    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(25px)';
        el.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        observer.observe(el);
    });
});
