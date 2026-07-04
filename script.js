document.addEventListener("DOMContentLoaded", () => {
    /* 1. Gestão de Tema (LocalStorage) */
    const htmlTag = document.documentElement;
    const btnTheme = document.getElementById('btn-theme');
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlTag.setAttribute('data-theme', savedTheme);

    btnTheme.addEventListener('click', () => {
        const newTheme = htmlTag.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        htmlTag.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    /* 2. Acessibilidade: Ajuste de Fonte */
    let currentFontSize = 16;
    document.getElementById('btn-font-inc').addEventListener('click', () => {
        if(currentFontSize < 22) { currentFontSize += 2; document.body.style.fontSize = `${currentFontSize}px`; }
    });
    document.getElementById('btn-font-dec').addEventListener('click', () => {
        if(currentFontSize > 14) { currentFontSize -= 2; document.body.style.fontSize = `${currentFontSize}px`; }
    });

    /* 3. Compartilhamento (Web Share API) */
    const btnShare = document.getElementById('btn-share');
    if (navigator.share) {
        btnShare.addEventListener('click', () => {
            navigator.share({
                title: 'Estudar Online | Cursos Gratuitos',
                text: 'Encontrei este portal que mapeia cursos gratuitos sem barreiras ocultas.',
                url: window.location.href
            }).catch(console.error);
        });
    } else {
        if(btnShare) btnShare.style.display = 'none';
    }

    /* 4. Motor Assíncrono de Curadoria */
    const statusBusca = document.getElementById('status-busca');
    
    // Verifica se estamos na página principal para carregar os cursos
    const gridCursos = document.getElementById('grid-curadoria');
    
    Promise.all([
        fetch('dados.json').then(res => res.json()).catch(() => []),
        fetch('parceiros.json').then(res => res.json()).catch(() => [])
    ])
    .then(([dados, parceiros]) => {
        if(gridCursos) {
            renderCursos(dados);
            setupSearch(dados);
            if(statusBusca) statusBusca.textContent = "Catálogo carregado com sucesso.";
        }
        renderizarParceiros(parceiros);
    })
    .catch(error => {
        console.error("Falha ao carregar as bases de dados:", error);
    });

    function renderCursos(cursos) {
        const grid = document.getElementById('grid-curadoria');
        if(!grid) return;
        grid.innerHTML = '';
        let cardCounter = 0;
        const densidadeAdSense = 6; 

        cursos.forEach((curso) => {
            const article = document.createElement('article');
            article.className = 'card glass-panel';
            article.innerHTML = `
                <h3><span aria-hidden="true">${curso.emoji}</span> ${curso.nome}</h3>
                <p class="card-problem">Barreira superada: ${curso.dor_resolvida}</p>
                <p>${curso.descricao}</p>
                <a href="${curso.url}" class="card-link" target="_blank" rel="noopener noreferrer">Acessar Plataforma Oficial</a>
            `;
            grid.appendChild(article);
            cardCounter++;

            // Injeção de AdSense via DOM
            if (cardCounter % densidadeAdSense === 0 && cardCounter !== cursos.length) {
                const adSlot = document.createElement('div');
                adSlot.className = 'area-adsense glass-panel';
                adSlot.setAttribute('aria-hidden', 'true');
                adSlot.innerHTML = `
                    <p class="sr-only">Espaço publicitário reservado</p>
                    <ins class="adsbygoogle"
                         style="display:block; text-align:center;"
                         data-ad-layout="in-article"
                         data-ad-format="fluid"
                         data-ad-client="ca-pub-6821135120244573"
                         data-ad-slot="XXXXXXXXXX"></ins>
                    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
                `;
                grid.appendChild(adSlot);
            }
        });
    }

    /* Nova função otimizada para o Footer Profissional */
    function renderizarParceiros(data) {
        const container = document.getElementById('grid-parceiros-container');
        if (!container || !data || !data.length) return;
        
        let htmlParceiros = data.map(p => `
            <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="footer-partner-link">
                <span aria-hidden="true">${p.emoji}</span>
                <span>${p.nome}</span>
            </a>
        `).join('');

        container.innerHTML = htmlParceiros;
    }

    function setupSearch(cursos) {
        const input = document.getElementById('input-busca');
        if(!input) return;
        input.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase();
            const resultados = cursos.filter(c => 
                c.nome.toLowerCase().includes(termo) || 
                c.dor_resolvida.toLowerCase().includes(termo) ||
                c.descricao.toLowerCase().includes(termo)
            );
            renderCursos(resultados);
            if(statusBusca) statusBusca.textContent = `${resultados.length} resultados encontrados.`;
        });
    }
});