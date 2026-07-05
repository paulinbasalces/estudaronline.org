(function () {

    const CONSENT_KEY = "estudaronline_cookie_consent";

    function setConsent(granted) {

        localStorage.setItem(
            CONSENT_KEY,
            granted ? "granted" : "denied"
        );

        window.dataLayer = window.dataLayer || [];

        function gtag() {
            dataLayer.push(arguments);
        }

        gtag(
            "consent",
            "update",
            {
                ad_storage: granted ? "granted" : "denied",
                analytics_storage: granted ? "granted" : "denied",
                ad_user_data: granted ? "granted" : "denied",
                ad_personalization: granted ? "granted" : "denied"
            }
        );

        document
            .getElementById("cookie-banner")
            ?.remove();
    }

    if (localStorage.getItem(CONSENT_KEY))
        return;

    const banner = document.createElement("div");

    banner.id = "cookie-banner";

    banner.innerHTML = `
        <div class="cookie-card">
            <p>
                Utilizamos cookies e tecnologias similares para
                melhorar a experiência e exibir publicidade.
            </p>

            <div class="cookie-actions">

                <button
                    id="cookie-reject"
                    class="cookie-secondary">
                    Recusar
                </button>

                <button
                    id="cookie-accept"
                    class="cookie-primary">
                    Aceitar
                </button>

            </div>
        </div>
    `;

    document.body.appendChild(banner);

    document
        .getElementById("cookie-accept")
        .onclick = () => setConsent(true);

    document
        .getElementById("cookie-reject")
        .onclick = () => setConsent(false);

})();