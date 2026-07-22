export function register() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('✅ PWA registered');
                    setInterval(() => registration.update(), 60000);
                })
                .catch((error) => {
                    console.log('❌ PWA registration failed:', error);
                });
        });
    }
}