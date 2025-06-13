// Google Maps APIを読み込む関数
function loadGoogleMapsAPI() {
    // APIキーを設定
    const API_KEY = 'AIzaSyDOmRfJwAHSgXSaGCjNm04Z_1URlRYHz_s';
    
    // Google Maps APIを動的に読み込む
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

// マップの初期化関数
function initMap() {
    // ここでマップの初期化処理を実装
    console.log('Google Maps API loaded successfully');
}

// APIを読み込む
loadGoogleMapsAPI();
