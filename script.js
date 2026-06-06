document.addEventListener('DOMContentLoaded', () => {
    let baseDeDados = [];
    let categoriaAtiva = 'Todas';
    const htmlElement = document.documentElement;

    /* Acessibilidade de Tema e Tipografia */
    if (localStorage.getItem('tema') === 'dark') htmlElement.setAttribute('data-theme', 'dark');
    
    document.getElementById('btn-tema').addEventListener('click', () => {
        const isDark = htmlElement.getAttribute('data-theme') === 'dark';
        htmlElement.toggleAttribute('data-theme', !isDark);
        localStorage.setItem('tema', isDark ? 'light' : 'dark');
    });

    let fontScale = parseInt(localStorage.getItem('fontScale'), 10) || 100;
    const atualizarFonte = () => { htmlElement.style.fontSize = fontScale + '%'; localStorage.setItem('fontScale', fontScale); };
    atualizarFonte();
    
    document.getElementById('btn-fonte-mais').addEventListener('click', () => { if(fontScale < 130) { fontScale += 10; atualizarFonte(); } });
    document.getElementById('btn-fonte-menos').addEventListener('click', () => { if(fontScale > 90) { fontScale -= 10; atualizarFonte(); } });

    /* Fetch Simultâneo: Curadoria e Parceiros */
    carregarDados();
    carregarParceiros();

    function carregarDados() {
        fetch('dados.json')
            .then(res => res.json())
            .then(data => {
                baseDeDados = data || [];
                document.getElementById('total-ferramentas').textContent = baseDeDados.length;
                document.getElementById('total-categorias').textContent = new Set(baseDeDados.map(i => i.categoria)).size;
                renderizarFiltros();
                renderizarInterface();
                abrirModalDaUrl();
            })
            .catch(err => {
                console.error("Erro ao carregar dados:", err);
                document.getElementById('lista-ferramentas').innerHTML = '<p style="text-align:center; color: var(--text-muted);">Inconsistência na conexão. Verifique o acesso à rede.</p>';
            });
    }

    function carregarParceiros() {
        fetch('parceiros.json')
            .then(res => res.json())
            .then(data => {
                const container = document.getElementById('grid-parceiros-container');
                if (!container || !data.length) return;
                
                let htmlParceiros = data.map(p => `
                    <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="card-parceiro">
                        <span class="parceiro-tag">${p.categoria}</span>
                        <strong>${p.nome}</strong>
                        <small>${p.descricao}</small>
                    </a>
                `).join('');

                htmlParceiros += `
                    <a href="#" class="card-parceiro card-em-breve" aria-disabled="true">
                        <span class="parceiro-tag">Expansão</span>
                        <strong>Em Breve</strong>
                        <small>Novos projetos em desenvolvimento...</small>
                    </a>`;
                
                container.innerHTML = htmlParceiros;
            })
            .catch(err => console.error("Aviso: Parceiros não carregados.", err));
    }

    /* Motor de Busca e Menu Bento */
    const campoBusca = document.getElementById('campo-busca');
    const btnLimpar = document.getElementById('btn-limpar-busca');

    campoBusca.addEventListener('input', () => { atualizarUrlParam('q', campoBusca.value); renderizarInterface(); });
    btnLimpar.addEventListener('click', () => { campoBusca.value = ''; categoriaAtiva = 'Todas'; atualizarUrlParam('q', null); renderizarFiltros(); renderizarInterface(); });

    function renderizarFiltros() {
        const cats = ['Todas', ...new Set(baseDeDados.map(i => i.categoria))];
        const container = document.getElementById('bento-menu');
        
        const mapaEmojis = {};
        cats.forEach(cat => {
            const itemMatch = baseDeDados.find(i => i.categoria === cat);
            mapaEmojis[cat] = itemMatch ? itemMatch.emoji : '🔎';
        });

        container.innerHTML = cats.map(cat => {
            const ativo = cat === categoriaAtiva ? 'true' : 'false';
            const total = cat === 'Todas' ? baseDeDados.length : baseDeDados.filter(i => i.categoria === cat).length;
            const emojiDisplay = cat === 'Todas' ? '🎯' : mapaEmojis[cat];
            
            return `
                <button type="button" class="bento-card" data-cat="${cat}" aria-pressed="${ativo}">
                    <span class="bento-card-emoji" aria-hidden="true">${emojiDisplay}</span>
                    <span>${cat}</span> 
                    <strong>(${total})</strong>
                </button>`;
        }).join('');
        
        container.querySelectorAll('.bento-card').forEach(btn => btn.addEventListener('click', () => {
            categoriaAtiva = btn.dataset.cat; 
            renderizarFiltros(); 
            renderizarInterface();
        }));
    }

    function renderizarInterface() {
        const termoOriginal = campoBusca.value;
        const termoNormalizado = termoOriginal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        const filtradas = baseDeDados.filter(item => {
            const textMatch = termoNormalizado === '' || (item.nome + " " + item.dor_resolvida + " " + item.descricao).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(termoNormalizado);
            const catMatch = categoriaAtiva === 'Todas' || item.categoria === categoriaAtiva;
            return textMatch && catMatch;
        });

        document.getElementById('status-resultados').textContent = `${filtradas.length} recursos localizados.`;
        const container = document.getElementById('lista-ferramentas');
        
        if (!filtradas.length) { 
            container.innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-muted);">Nenhum sistema corresponde aos critérios informados.</p>'; 
            return; 
        }

        const grupos = filtradas.reduce((acc, obj) => { (acc[obj.categoria] = acc[obj.categoria] || []).push(obj); return acc; }, {});
        
        container.innerHTML = Object.keys(grupos).map((cat, idx, arr) => {
            const cards = grupos[cat].map(item => {
                
                let tituloLimpo = item.nome;
                let alertaTagHtml = '';
                const regexTag = /\[(.*?)\]/;
                const matchRegex = tituloLimpo.match(regexTag);
                
                if (matchRegex) {
                    const tagTexto = matchRegex[1];
                    tituloLimpo = tituloLimpo.replace(regexTag, '').trim();
                    alertaTagHtml = `<div class="card-alert-tag">${tagTexto}</div>`;
                }

                return `
                <article class="card">
                    <div class="card-topo">
                        <span class="card-emoji" aria-hidden="true">${item.emoji}</span>
                        <span class="card-tag">${item.categoria}</span>
                    </div>
                    <h3>${tituloLimpo}</h3>
                    <p class="card-desc">${item.dor_resolvida}</p>
                    <p class="card-editorial">${item.descricao}</p>
                    ${alertaTagHtml}
                    <div class="card-footer">
                        <button class="btn-card-abrir" onclick="abrirModal('${item.id}')" aria-label="Analisar ${tituloLimpo}">Ver Detalhes</button>
                        <a class="link-card-oficial" href="${item.url}" target="_blank" rel="noopener noreferrer">Acessar Oficial ➔</a>
                    </div>
                </article>`;
            }).join('');
            
            const areaAds = idx < arr.length - 1 ? `<div class="area-adsense"><p class="ads-label">Apoio Estratégico</p></div>` : '';
            return `<section class="sessao-categoria"><h2 class="sessao-titulo">${cat}</h2><div class="grid-cards">${cards}</div></section>${areaAds}`;
        }).join('');
    }

    /* Lógica de Modal e History API */
    window.abrirModal = function(id) {
        const item = baseDeDados.find(i => String(i.id) === String(id));
        if(!item) return;
        
        let tituloLimpo = item.nome;
        const regexTag = /\[(.*?)\]/;
        if (regexTag.test(tituloLimpo)) {
            tituloLimpo = tituloLimpo.replace(regexTag, '').trim();
        }

        document.getElementById('artigo-emoji').textContent = item.emoji;
        document.getElementById('artigo-titulo').textContent = tituloLimpo;
        document.getElementById('artigo-categoria').textContent = item.categoria;
        document.getElementById('artigo-dor').textContent = item.dor_resolvida;
        document.getElementById('artigo-descricao').textContent = item.descricao;
        
        document.getElementById('artigo-melhor-para').textContent = 'Profissionais em busca de aprimoramento e autodidatas com disciplina.';
        document.getElementById('artigo-cuidado').textContent = 'Avalie cuidadosamente a grade curricular antes de comprometer seu tempo.';
        
        const btnLink = document.getElementById('artigo-link');
        btnLink.href = item.url;
        
        const btnShare = document.getElementById('botoes-compartilhamento');
        btnShare.innerHTML = `<button class="btn-share" onclick="compartilhar('${tituloLimpo}', '${item.id}')">Copiar Link e Indicar</button>`;
        
        const modal = document.getElementById('modal-overlay');
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        
        atualizarUrlParam('modal', item.id);
        document.getElementById('fechar-modal').focus();
    };

    const modalOverlay = document.getElementById('modal-overlay');
    document.getElementById('fechar-modal').addEventListener('click', fecharModal);
    modalOverlay.addEventListener('click', (e) => { if(e.target.id === 'modal-overlay') fecharModal(); });
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) fecharModal(); });
    
    function fecharModal() {
        modalOverlay.classList.add('hidden');
        modalOverlay.setAttribute('aria-hidden', 'true');
        atualizarUrlParam('modal', null);
    }

    /* Utilitários de Compartilhamento Nativo e URL */
    function atualizarUrlParam(key, value) {
        const url = new URL(window.location.href);
        if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
        window.history.replaceState({}, '', url);
    }

    function abrirModalDaUrl() {
        const modalId = new URLSearchParams(window.location.search).get('modal');
        if (modalId && baseDeDados.length > 0) window.abrirModal(modalId);
    }

    window.compartilhar = async function(nome, id) {
        const urlFinal = `${window.location.origin}${window.location.pathname}?modal=${id}`;
        if (navigator.share) {
            try { await navigator.share({ title: `Conheça: ${nome}`, url: urlFinal }); } catch(err){}
        } else {
            navigator.clipboard.writeText(urlFinal).then(() => alert('Link estruturado copiado para a área de transferência.'));
        }
    };
});