let map; // map変数をグローバルスコープに

function initMap() {
    const tokyo = { lat: 35.6895, lng: 139.6917 };
    
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: tokyo,
    });

    // 1. api.js の初期化処理を呼び出す
    googleApi.init(map);

    // 2. 検索バーにオートコンプリートを設定する
    const searchInputId = 'search-input';
    googleApi.setupAutocomplete(searchInputId, (place) => {
      console.log("場所が選択されました！", place);

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
    })
      

    ,document.addEventListener('DOMContentLoaded', () => {
      // ボタンのクリックイベントなどから呼び出す
      const someButton = document.getElementById('get-route-button');

      if (getRouteButton) {
        // 取得できたボタン要素に対して、クリックイベントリスナーを設定します。
        getRouteButton.addEventListener('click', () => {
            const origin = '東京駅'; // 出発地
            const destination = '渋谷駅'; // 目的地

            console.log(`${origin}から${destination}へのルートを検索します。`);
            
            googleApi.getDirections(origin, destination, (response, status) => {
                if (status === 'OK') {
                    console.log("ルート検索に成功しました。");
                    // 移動時間などを表示する処理
                    const duration = response.routes[0].legs[0].duration.text;
                    alert(`所要時間: 約${duration}`);
                } else {
                    console.error("ルート検索に失敗しました。Status: " + status);
                    alert("ルートが見つかりませんでした。");
                }
            });
        });
    }else {
        console.error("ID 'get-route-button' を持つボタンが見つかりませんでした。");
    }
  });
}