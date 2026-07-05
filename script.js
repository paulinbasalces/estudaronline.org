document.addEventListener('DOMContentLoaded', () => {

    let baseDeDados = [];
    let configTags = {};
    let categoriaAtiva = 'Todas';

    const htmlElement = document.documentElement;
    const CONSENT_KEY = 'estudaronline_cookie_consent';

    let debounceBusca;
    let ultimoElementoFocado = null;

    /* =====================================================
       UTILIDADES
    ===================================================== */

    const normalizarTexto = (texto = '') =>
        texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    const escaparHTML = (str = '') =>
        str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    function atualizarUrlParam(key, value) {
        const url = new URL(window.location.href);

        if (value)
            url.searchParams.set(key, value);
        else
            url.searchParams.delete(key);

        window.history.replaceState({}, '', url);
    }

    function dispararEventoGTM(evento, payload = {}) {

        window.dataLayer = window.dataLayer || [];

        window.dataLayer.push({
            event: evento,
            ...payload
        });
    }

    /* =====================================================
       CONSENT MODE
    ===================================================== */

    function atualizarConsentimentoGoogle(granted) {

        window.dataLayer = window.dataLayer || [];

        function gtag() {
            dataLayer.push(arguments);
        }

        gtag(
            'consent',
            'update',
            {
                ad_storage: granted ? 'granted' : 'denied',
                analytics_storage: granted ? 'granted' : 'denied',
                ad_user_data: granted ? 'granted' : 'denied',
                ad_personalization: granted ? 'granted' : 'denied'
            }
        );
    }

    const consentimentoAtual =
        localStorage.getItem(CONSENT_KEY);

    if (consentimentoAtual) {
        atualizarConsentimentoGoogle(
            consentimentoAtual === 'granted'
        );
    }

    /* =====================================================
       ACESSIBILIDADE
    ===================================================== */

    if (localStorage.getItem('tema') === 'dark') {
        htmlElement.setAttribute(
            'data-theme',
            'dark'
        );
    }

    document
        .getElementById('btn-tema')
        .addEventListener('click', () => {

            const isDark =
                htmlElement.getAttribute(
                    'data-theme'
                ) === 'dark';

            if (isDark)
                htmlElement.removeAttribute(
                    'data-theme'
                );
            else
                htmlElement.setAttribute(
                    'data-theme',
                    'dark'
                );

            localStorage.setItem(
                'tema',
                isDark ? 'light' : 'dark'
            );
        });

    let fontScale =
        parseInt(
            localStorage.getItem('fontScale'),
            10
        ) || 100;

    function atualizarFonte() {

        htmlElement.style.fontSize =
            `${fontScale}%`;

        localStorage.setItem(
            'fontScale',
            fontScale
        );
    }

    atualizarFonte();

    document
        .getElementById('btn-fonte-mais')
        .addEventListener('click', () => {

            if (fontScale < 130) {
                fontScale += 10;
                atualizarFonte();
            }
        });

    document
        .getElementById('btn-fonte-menos')
        .addEventListener('click', () => {

            if (fontScale > 90) {
                fontScale -= 10;
                atualizarFonte();
            }
        });

    /* =====================================================
       CARREGAMENTO
    ===================================================== */

    carregarInfraestrutura();

    async function carregarInfraestrutura() {

        try {

            const [
                dados,
                parceiros,
                tags
            ] = await Promise.all([
                fetch('dados.json')
                    .then(r => r.json())
                    .catch(() => []),

                fetch('parceiros.json')
                    .then(r => r.json())
                    .catch(() => []),

                fetch('tags.json')
                    .then(r => r.json())
                    .catch(() => ({}))
            ]);

            baseDeDados = dados;
            configTags = tags;

            document
                .getElementById(
                    'total-ferramentas'
                )
                .textContent =
                baseDeDados.length;

            document
                .getElementById(
                    'total-categorias'
                )
                .textContent =
                new Set(
                    baseDeDados.map(
                        i => i.categoria
                    )
                ).size;

            renderizarParceiros(
                parceiros
            );

            renderizarFiltros();

            renderizarInterface();

            abrirModalDaUrl();

        } catch (erro) {

            console.error(
                'Erro carregando dados',
                erro
            );

            document
                .getElementById(
                    'status-resultados'
                )
                .textContent =
                'Erro ao carregar dados.';
        }
    }
    /* =====================================================
       PARCEIROS
    ===================================================== */

    function renderizarParceiros(data) {

        const container =
            document.getElementById(
                'grid-parceiros-container'
            );

        if (
            !container ||
            !data ||
            !data.length
        ) return;

        container.innerHTML =
            data.map(p => `
                <a
                    href="${escaparHTML(p.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="card-parceiro glass-effect">

                    <span class="parceiro-tag">
                        ${escaparHTML(p.categoria)}
                    </span>

                    <strong>
                        ${escaparHTML(p.nome)}
                    </strong>

                    <small>
                        ${escaparHTML(p.descricao)}
                    </small>

                </a>
            `).join('');
    }

    /* =====================================================
       BUSCA
    ===================================================== */

    const campoBusca =
        document.getElementById(
            'campo-busca'
        );

    const btnLimpar =
        document.getElementById(
            'btn-limpar-busca'
        );

    const btnGoogleBusca =
        document.getElementById(
            'btn-google-busca'
        );

    campoBusca.addEventListener(
        'input',
        () => {

            clearTimeout(
                debounceBusca
            );

            debounceBusca =
                setTimeout(() => {

                    atualizarUrlParam(
                        'q',
                        campoBusca.value
                    );

                    renderizarInterface();

                }, 300);
        }
    );

    btnLimpar.addEventListener(
        'click',
        () => {

            campoBusca.value = '';

            categoriaAtiva =
                'Todas';

            atualizarUrlParam(
                'q',
                null
            );

            renderizarFiltros();

            renderizarInterface();
        }
    );

    btnGoogleBusca
        ?.addEventListener(
            'click',
            () => {

                const query =
                    campoBusca
                        .value
                        .trim();

                if (!query) {
                    campoBusca.focus();
                    return;
                }

                dispararEventoGTM(
                    'busca_google',
                    {
                        termo: query
                    }
                );

                const url =
                    `https://www.google.com/search?q=${encodeURIComponent(
                        query +
                        ' cursos gratuitos online'
                    )}`;

                window.open(
                    url,
                    '_blank'
                );
            }
        );

    /* =====================================================
       FILTROS BENTO
    ===================================================== */

    function renderizarFiltros() {

        const container =
            document.getElementById(
                'bento-menu'
            );

        const categorias = [
    'Todas',
    ...new Set(
        baseDeDados.map(
            i => (
                i.categoria &&
                i.categoria.trim()
            )
                ? i.categoria.trim()
                : 'Outros'
        )
    )
];

        const mapaEmojis = {};

        categorias.forEach(cat => {

            const match =
                baseDeDados.find(
                    i =>
                    i.categoria ===
                    cat
                );

            mapaEmojis[cat] =
                match
                ? match.emoji
                : '🔎';
        });

        container.innerHTML =
            categorias
            .map(cat => {

                const ativo =
                    categoriaAtiva ===
                    cat;

                const total =
                    cat === 'Todas'
                    ? baseDeDados.length
                    : baseDeDados.filter(
                        i =>
                        i.categoria ===
                        cat
                    ).length;

                const emoji =
                    cat === 'Todas'
                    ? '🎯'
                    : mapaEmojis[cat];

                return `
                    <button
                        type="button"
                        class="bento-card glass-btn"
                        data-cat="${escaparHTML(cat)}"
                        aria-pressed="${ativo}">

                        <span
                            class="bento-card-emoji"
                            aria-hidden="true">

                            ${emoji}

                        </span>

                        <span>
                            ${escaparHTML(cat)}
                        </span>

                        <strong>
                            (${total})
                        </strong>

                    </button>
                `;
            })
            .join('');

        container
            .querySelectorAll(
                '.bento-card'
            )
            .forEach(btn => {

                btn.addEventListener(
                    'click',
                    () => {

                        categoriaAtiva =
                            btn.dataset.cat;

                        renderizarFiltros();

                        renderizarInterface();

                        dispararEventoGTM(
                            'categoria_filtrada',
                            {
                                categoria:
                                    categoriaAtiva
                            }
                        );
                    }
                );
            });
    }

    /* =====================================================
       RENDERIZAÇÃO
    ===================================================== */

    function renderizarInterface() {

        const termo =
            normalizarTexto(
                campoBusca.value
            );

        const filtradas =
            baseDeDados.filter(
                item => {

                    const texto =
                        normalizarTexto(
                            `${item.nome}
                             ${item.dor_resolvida}
                             ${item.descricao}`
                        );

                    const matchTexto =
                        !termo ||
                        texto.includes(
                            termo
                        );

                    const matchCategoria =
                        categoriaAtiva ===
                        'Todas'
                        ||
                        item.categoria ===
                        categoriaAtiva;

                    return (
                        matchTexto &&
                        matchCategoria
                    );
                }
            );

        document
            .getElementById(
                'status-resultados'
            )
            .textContent =
            `${filtradas.length}
             recursos encontrados`;

        const container =
            document
                .getElementById(
                    'lista-ferramentas'
                );

        if (!filtradas.length) {

            container.innerHTML =
                `
                <p
                  style="
                  text-align:center;
                  padding:40px;
                  color:var(--text-muted);">

                    Nenhum recurso
                    encontrado.

                </p>
                `;

            return;
        }

        const grupos =
    filtradas.reduce(
        (acc, obj) => {

            const categoria =
                (
                    obj.categoria &&
                    obj.categoria.trim()
                )
                    ? obj.categoria.trim()
                    : 'Outros';

            if (!acc[categoria]) {
                acc[categoria] = [];
            }

            acc[categoria].push(obj);

            return acc;

        },
        {}
    );
        container.innerHTML =
            Object.keys(grupos)
            .map((cat, idx, arr) => {

                const cards =
                    grupos[cat]
                    .map(item => {

                        let tituloLimpo =
                            item.nome;

                        let htmlTags =
                            '';

                        const regexTag =
                            /\[(.*?)\]/g;

                        let match;

                        while (
                            (
                                match =
                                regexTag.exec(
                                    item.nome
                                )
                            ) !== null
                        ) {

                            const nomeTag =
                                match[1];

                            tituloLimpo =
                                tituloLimpo
                                .replace(
                                    match[0],
                                    ''
                                )
                                .trim();

                            if (
                                configTags &&
                                configTags[
                                    nomeTag
                                ]
                            ) {

                                const tag =
                                    configTags[
                                        nomeTag
                                    ];

                                htmlTags += `
                                    <span
                                        class="card-alert-tag"
                                        style="
                                            color:${tag.color};
                                            background:${tag.bg};
                                            border-color:${tag.border};
                                        ">
                                        ${escaparHTML(
                                            tag.label
                                        )}
                                    </span>
                                `;

                            } else {

                                htmlTags += `
                                    <span class="card-alert-tag">
                                        ${escaparHTML(
                                            nomeTag
                                        )}
                                    </span>
                                `;
                            }
                        }

                        const tagsArea =
                            htmlTags
                            ? `
                                <div class="tags-container">
                                    ${htmlTags}
                                </div>
                              `
                            : `
                                <div
                                  class="tags-container"
                                  style="min-height:28px">
                                </div>
                              `;

                        return `

                        <article
                            class="card glass-effect">

                            <div class="card-topo">

                                <span
                                    class="card-emoji glass-effect"
                                    aria-hidden="true">

                                    ${item.emoji}

                                </span>

                                <span class="card-tag">

                                    ${escaparHTML(
                                        item.categoria
                                    )}

                                </span>

                            </div>

                            <h3>
                                ${escaparHTML(
                                    tituloLimpo
                                )}
                            </h3>

                            <p class="card-desc">

                                ${escaparHTML(
                                    item.dor_resolvida
                                )}

                            </p>

                            <p class="card-editorial">

                                ${escaparHTML(
                                    item.descricao
                                )}

                            </p>

                            ${tagsArea}

                            <div class="card-footer">

                                <button
                                    class="btn-card-abrir glass-btn"
                                    onclick="abrirModal('${item.id}')"
                                    aria-label="Analisar ${escaparHTML(
                                        tituloLimpo
                                    )}">

                                    Ver Detalhes

                                </button>

                                <a
                                    class="link-card-oficial"
                                    href="${item.url}"
                                    target="_blank"
                                    rel="noopener noreferrer">

                                    Acessar Oficial ➔

                                </a>

                            </div>

                        </article>
                        `;
                    })
                    .join('');

                const areaAds =
                    idx < arr.length - 1
                    ? `
                    <div
                        class="area-adsense glass-effect">

                        <p class="ads-label">
                            Apoio Estratégico
                        </p>

                        <ins
                            class="adsbygoogle"
                            style="display:block"
                            data-ad-client="ca-pub-6821135120244573"
                            data-ad-format="auto"
                            data-full-width-responsive="true">
                        </ins>

                    </div>
                    `
                    : '';

                return `
                    <section
                        class="sessao-categoria">

                        <h2
                            class="sessao-titulo">

                            ${escaparHTML(
                                cat
                            )}

                        </h2>

                        <div
                            class="grid-cards">

                            ${cards}

                        </div>

                    </section>

                    ${areaAds}
                `;
            })
            .join('');

        if (
            localStorage.getItem(
                CONSENT_KEY
            ) === 'granted'
        ) {

            document
                .querySelectorAll(
                    '.adsbygoogle'
                )
                .forEach(() => {

                    try {

                        (
                            adsbygoogle =
                            window
                            .adsbygoogle ||
                            []
                        ).push({});

                    } catch(e){}
                });
        }
    }

    /* =====================================================
       MODAL
    ===================================================== */

    window.abrirModal =
        function(id) {

            const item =
                baseDeDados.find(
                    i =>
                    String(i.id) ===
                    String(id)
                );

            if (!item)
                return;

            ultimoElementoFocado =
                document
                    .activeElement;

            dispararEventoGTM(
                'curso_aberto',
                {
                    id:item.id,
                    nome:item.nome,
                    categoria:
                        item.categoria
                }
            );

            const titulo =
                item.nome
                    .replace(
                        /\[(.*?)\]/g,
                        ''
                    )
                    .trim();

            document
                .getElementById(
                    'artigo-emoji'
                )
                .textContent =
                item.emoji;

            document
                .getElementById(
                    'artigo-titulo'
                )
                .textContent =
                titulo;

            document
                .getElementById(
                    'artigo-categoria'
                )
                .textContent =
                item.categoria;

            document
                .getElementById(
                    'artigo-dor'
                )
                .textContent =
                item.dor_resolvida;

            document
                .getElementById(
                    'artigo-descricao'
                )
                .textContent =
                item.descricao;

            document
                .getElementById(
                    'artigo-melhor-para'
                )
                .textContent =
                'Profissionais e autodidatas';

            document
                .getElementById(
                    'artigo-cuidado'
                )
                .textContent =
                'Avalie cuidadosamente a grade curricular.';

            const btn =
                document
                    .getElementById(
                        'artigo-link'
                    );

            btn.href =
                item.url;

            document
                .getElementById(
                    'botoes-compartilhamento'
                )
                .innerHTML = `
                    <button
                        class="btn-share glass-btn"
                        onclick="compartilhar(
                            '${escaparHTML(
                                titulo
                            )}',
                            '${item.id}'
                        )">

                        Copiar Link

                    </button>
                `;

            const modal =
                document
                    .getElementById(
                        'modal-overlay'
                    );

            modal.classList
                .remove(
                    'hidden'
                );

            modal.setAttribute(
                'aria-hidden',
                'false'
            );

            atualizarUrlParam(
                'modal',
                item.id
            );

            document
                .getElementById(
                    'fechar-modal'
                )
                .focus();
        };
    /* =====================================================
       MODAL
    ===================================================== */

    const modalOverlay =
        document.getElementById(
            'modal-overlay'
        );

    const btnFechar =
        document.getElementById(
            'fechar-modal'
        );

    btnFechar.addEventListener(
        'click',
        fecharModal
    );

    modalOverlay.addEventListener(
        'click',
        (e) => {

            if (
                e.target.id ===
                'modal-overlay'
            ) {
                fecharModal();
            }
        }
    );

    document.addEventListener(
        'keydown',
        (e) => {

            if (
                e.key === 'Escape' &&
                !modalOverlay
                    .classList
                    .contains(
                        'hidden'
                    )
            ) {
                fecharModal();
            }
        }
    );

    function fecharModal() {

        modalOverlay
            .classList
            .add(
                'hidden'
            );

        modalOverlay
            .setAttribute(
                'aria-hidden',
                'true'
            );

        atualizarUrlParam(
            'modal',
            null
        );

        if (
            ultimoElementoFocado
        ) {

            ultimoElementoFocado
                .focus();
        }
    }

    /* =====================================================
       FOCUS TRAP
    ===================================================== */

    modalOverlay.addEventListener(
        'keydown',
        (e) => {

            if (
                e.key !==
                'Tab'
            ) return;

            const elementos =
                modalOverlay
                    .querySelectorAll(
                        'button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])'
                    );

            if (
                !elementos.length
            ) return;

            const primeiro =
                elementos[0];

            const ultimo =
                elementos[
                    elementos
                    .length - 1
                ];

            if (
                e.shiftKey &&
                document
                    .activeElement ===
                primeiro
            ) {

                e.preventDefault();

                ultimo.focus();
            }

            else if (
                !e.shiftKey &&
                document
                    .activeElement ===
                ultimo
            ) {

                e.preventDefault();

                primeiro.focus();
            }
        }
    );

    /* =====================================================
       HISTORY API
    ===================================================== */

    function abrirModalDaUrl() {

        const modalId =
            new URLSearchParams(
                window.location
                    .search
            ).get(
                'modal'
            );

        if (
            modalId &&
            baseDeDados.length
        ) {

            window
                .abrirModal(
                    modalId
                );
        }
    }

    window.addEventListener(
        'popstate',
        () => {

            const modalId =
                new URLSearchParams(
                    window.location
                        .search
                ).get(
                    'modal'
                );

            if (
                modalId
            ) {

                window
                    .abrirModal(
                        modalId
                    );
            }

            else {

                fecharModal();
            }
        }
    );

    /* =====================================================
       COMPARTILHAMENTO
    ===================================================== */

    window.compartilhar =
        async function(
            nome,
            id
        ) {

            const urlFinal =
                `${window.location.origin}${window.location.pathname}?modal=${id}`;

            dispararEventoGTM(
                'compartilhar',
                {
                    nome,
                    id
                }
            );

            if (
                navigator.share
            ) {

                try {

                    await navigator
                        .share({

                            title:
                                `Conheça: ${nome}`,

                            url:
                                urlFinal
                        });

                } catch (
                    err
                ) {}
            }

            else {

                try {

                    await navigator
                        .clipboard
                        .writeText(
                            urlFinal
                        );

                    alert(
                        'Link copiado para a área de transferência.'
                    );

                } catch (
                    erro
                ) {

                    console.error(
                        erro
                    );
                }
            }
        };

    /* =====================================================
       TRATAMENTO DE ERROS
    ===================================================== */

    window.addEventListener(
        'error',
        event => {

            console.error(
                'Erro JS:',
                event.error
            );

            dispararEventoGTM(
                'erro_js',
                {
                    mensagem:
                        event.message
                }
            );
        }
    );

    window.addEventListener(
        'unhandledrejection',
        event => {

            console.error(
                'Promise:',
                event.reason
            );

            dispararEventoGTM(
                'erro_promise',
                {
                    erro:
                        String(
                            event.reason
                        )
                }
            );
        }
    );

    /* =====================================================
       PERFORMANCE
    ===================================================== */

    if (
        'requestIdleCallback'
        in window
    ) {

        requestIdleCallback(
            () => {

                dispararEventoGTM(
                    'site_pronto'
                );
            }
        );
    }

    else {

        setTimeout(
            () => {

                dispararEventoGTM(
                    'site_pronto'
                );

            }, 500
        );
    }

});
