// map.js - 地図の初期化と、アプリ本体(app.js)への処理の引き渡しを担当します

let app;

/**
 * Google Maps APIの準備完了後に呼び出される、すべてが始まる関数
 */
function initMap() {
    console.log("map.js: initMap() - Google API準備完了。");

    app = new SpotShareApp();
    console.log("map.js: appインスタンスを生成しました。");

    console.log("map.js: 現在地の取得を開始します...");
    
    // googleApi.jsのヘルパー関数を使って現在地を取得
    googleApi.getCurrentLocation(
        // --- 成功時のコールバック ---
        (userLocation) => {
            console.log("map.js: 現在地の取得に成功:", userLocation);
            // 取得した現在地を使って地図を生成し、アプリを起動
            createMapAndStartApp(userLocation); 
        },
        // --- 失敗時のコールバック ---
        (error) => {
            console.warn("map.js: 現在地の取得に失敗したため、デフォルトの場所で表示します。");
            // 代替の場所として東京駅を設定
            const tokyoStation = { lat: 35.6812, lng: 139.7671 };
            alert("現在地を取得できませんでした。\nデフォルトの場所（東京駅）で地図を表示します。");
            // デフォルトの場所で地図を生成し、アプリを起動
            createMapAndStartApp(tokyoStation);
        }
    );
}

/**
 * 地図を生成し、各種設定を行い、最後にapp.jsの司令塔を起動する関数
 * @param {object} centerLocation - 地図の中心にする場所の {lat, lng} オブジェクト
 */
function createMapAndStartApp(centerLocation) {
    console.log("map.js: createMapAndStartApp() - 地図の生成を開始します...");

    // 1. 地図オブジェクトを生成
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: centerLocation,
        clickableIcons: true, //デフォルトの吹き出しは無効化
        disableDefaultUI: true, // デフォルトUIを無効化して見た目をスッキリさせる（任意）
        zoomControl: true,
    });

    // 2. 初期位置にマーカーを設置
    new google.maps.Marker({
        position: centerLocation,
        map: map,
        title: "初期位置"
    });

    // 3. Google Maps APIの各種サービスを初期化
    googleApi.init(map);
    
    // 4. 検索バーにオートコンプリート機能を設定
    googleApi.setupAutocomplete('search-input', (place) => {
        // 場所が選択されたときの処理
        if (!place.geometry || !place.geometry.location) { return; }
        map.setCenter(place.geometry.location);
        map.setZoom(17);
        new google.maps.Marker({ map: map, position: place.geometry.location });
    });


    /**
         * @param {google.maps.MapMouseEvent} event - Googoe Maps APIから渡されるクリックイベントオブジェクト
         */
        
    map.addListener('click', (event) => {
        if (event.placeId) {
            event.stop();
            app.showCustomInfoWindowForPlace(event.placeId, event.latLng);
        } else {
            app.showCustomInfoWindowForLocation(event.latLng);
        }
    });

    // すべての地図の準備が完了したら、app.jsが作ったappインスタンスのstartメソッドを呼び出す
        app.start(map, centerLocation);
}
