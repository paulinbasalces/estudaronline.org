document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlTag = document.documentElement;
    const currentTheme = localStorage.getItem('theme') || 'light';
    htmlTag.setAttribute('data-theme', currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = htmlTag.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        htmlTag.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    const shareBtn = document.getElementById('share-btn');
    if (navigator.share) {
        shareBtn.addEventListener('click', () => {
            navigator.share({
                title: 'Estudar Online',
                text: 'Curadoria de cursos gratuitos e acessíveis.',
                url: window.location.href
            }).catch(console.error);
        });
    } else {
        shareBtn.style.display = 'none';
    }

    // Busca Assíncrona via Promise.all
    Promise.all([
        fetch('dados.json').then(res => res.json()),
        fetch('parceiros.json').then(res => res.json())
    ])
    .then(([dadosData, parceirosData]) => {
        renderizarCursos(dadosData);
        renderizarParceiros(parceirosData);
        configurarBusca(dadosData);
    })
    .catch(error => console.error("Falha ao carregar dados vitais:", error));

    function renderizarCursos(cursos) {
        const grid = document.getElementById('course-grid');
        grid.innerHTML = '';
        let cardCount = 0;

        cursos.forEach((curso, index) => {
            const card = document.createElement('article');
            card.className = 'card glass-panel';
            card.innerHTML = `
                <h3><span aria-hidden="true">${curso.emoji}</span> ${curso.nome}</h3>
                <p>${curso.descricao}</p>
                <div class="card-meta"><strong>Área:</strong> ${curso.area} | <strong>Certificado:</strong> ${curso.certificado}</div>
                <a href="${curso.url}" class="card-link" target="_blank" rel="noopener noreferrer">Acessar Plataforma &rarr;</a>
            `;
            grid.appendChild(card);
            cardCount++;

            // Injeção Dinâmica de AdSense para monetização moderada (a cada 6 cards)
            if (cardCount % 6 === 0 && cardCount !== cursos.length) {
                const adArea = document.createElement('div');
                adArea.className = 'area-adsense';
                adArea.innerHTML = `
                    <ins class="adsbygoogle"
                         style="display:block; text-align:center;"
                         data-ad-layout="in-article"
                         data-ad-format="fluid"
                         data-ad-client="ca-pub-XXXXXXXXXX"
                         data-ad-slot="XXXXXXXXXX"></ins>
                    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                `;
                grid.appendChild(adArea);
            }
        });
    }

    function renderizarParceiros(parceiros) {
        const grid = document.getElementById('partners-grid');
        parceiros.forEach(parceiro => {
            const card = document.createElement('a');
            card.href = parceiro.url;
            card.className = 'partner-card';
            card.target = '_blank';
            card.rel = 'sponsored noopener';
            card.innerHTML = `<span aria-hidden="true">${parceiro.emoji}</span> ${parceiro.nome} - ${parceiro.vantagem}`;
            grid.appendChild(card);
        });
    }

    function configurarBusca(cursos) {
        const input = document.getElementById('search-input');
        input.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase();
            const filtrados = cursos.filter(c => 
                c.nome.toLowerCase().includes(termo) || 
                c.area.toLowerCase().includes(termo) ||
                c.descricao.toLowerCase().includes(termo)
            );
            renderizarCursos(filtrados);
        });
    }
});