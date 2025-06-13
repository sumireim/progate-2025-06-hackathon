// Google Maps APIを読み込む関数
async function loadGoogleMapsAPI() {
    try {
        // バックエンドからAPIキーを取得
        const response = await fetch('/api/maps-key');
        const data = await response.json();
        const API_KEY = data.apiKey;

        // Google Maps APIを動的に読み込む
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    } catch (error) {
        console.error('Failed to load Google Maps API:', error);
    }
}

// マップの初期化関数
function initMap() {
    // ここでマップの初期化処理を実装
    console.log('Google Maps API loaded successfully');
}

// APIを読み込む
loadGoogleMapsAPI();
