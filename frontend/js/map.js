/**
 * 地図の初期化とセットアップを行うメイン関数
 */
function initMap() {
    console.log("initMap: 現在地の取得を開始します...");
    // ユーザの現在地を取得
    googleApi.getCurrentLocation(
        // ---- 成功した場合の処理 ----
        (userLocation) => {
            console.log('現在地の取得に成功：', userLocation);
            //取得した現在地を使って地図を作成
            createMapAndStartApp(userLocation);
        },
        // ----失敗した場合の処理
        (error) => {
            console.warn("現在地の取得に失敗したため、デフォルトの場所で表示します。Error code:", error.code);
            let errorMessage = "現在地を取得できませんでした。";
            switch(error.code){
                case 1:
                    errorMessage += "\n位置情報の利用を許可してください。";
                    break;
                case 2:
                    errorMessage += "\n電波状況の良い場所で再度お試しください。";
                    break;
                case 3:
                    errorMessage += "\nタイムアウトしました。";
                    break;
            }
            alert(errorMessage);
            const tokyo = { lat: 35.6895, lng: 139.6917 };
            createMap(tokyo);
        }
    );
}


/**
 * 指定された場所を中心に地図を生成し、関連機能をセットアップする関数
 * @param {object} centerLocation - 地図の中心にする場所の{lat, lng} オブジェクト
 */
function createMaAndStartApp(centerLocation){
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: centerLocation,
    });

    new google.maps.Marker({
        position: centerLocation, 
        map: map,
        titel: "初期位置"
    });

    // 1. api.js の初期化処理を呼び出す
    googleApi.init(map);

    const searchInputId = 'search-input';
    googleApi.setupAutocomplete(searchInputId, (place) => {
        
    })
    if (!place.geometry || !place.geometry.location) {
        // ユーザーが候補を選択せずEnterを押した場合など
        console.log("無効な場所が選択されました。");
        window.alert("有効な場所を選択してください。");
        return;
    }
    // 選択された場所に地図を移動
    map.setCenter(place.geometry.location);
    map.setZoom(17);

    // 新しいマーカーを立てる
    new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        title: place.name
    });
    console.log(`「${place.name}」に地図を移動し、マーカーを設置しました。`);
    
    if(app){
        app.start(map, centerLocation);
    }else{
        console.error("SpotShareAppのインスタンス(app)が見つかりません");
    }
}

