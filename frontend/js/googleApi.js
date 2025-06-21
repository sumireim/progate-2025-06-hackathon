const googleApi = {
    // 各サービスを格納するためのプロパティ
    map: null,
    placesService: null,
    directionsService: null,
    directionsRenderer: null,
    geocoder: null,

    /**
     * 各サービスを初期化する関数。
     * map.jsで地図が作成された直後に一度だけ呼び出してください。
     * @param {google.maps.Map} mapObject - 初期化済みの地図オブジェクト
     */
    init: function(mapObject) {
        this.map = mapObject;
        console.log("googleApi: 初期化を開始します。");

        // 各APIサービスをインスタンス化
        this.placesService = new google.maps.places.PlacesService(this.map);
        // DirectionsServiceは'routes'ライブラリに含まれます
        this.directionsService = new google.maps.DirectionsService();
        this.geocoder = new google.maps.Geocoder();

        // ルート検索結果を地図上に描画するためのレンダラーを作成
        this.directionsRenderer = new google.maps.DirectionsRenderer();
        this.directionsRenderer.setMap(this.map); // レンダラーと地図を紐付け

        console.log("googleApi: 初期化が完了しました。");
    },

    /**
     * [Places API] 検索バーにオートコンプリート機能を設定します。
     * @param {string} inputId - オートコンプリートを適用したいinput要素のID
     * @param {function} onPlaceChanged - 場所が選択されたときに実行されるコールバック関数
     */
    setupAutocomplete: function(inputId, onPlaceChanged) {
        const inputElement = document.getElementById(inputId);
        if (!inputElement) {
            console.error(`setupAutocomplete: ID '${inputId}' の要素が見つかりません。`);
            return;
        }

        const autocomplete = new google.maps.places.Autocomplete(inputElement, {
            fields: ["place_id", "name", "geometry"], // 取得する情報を限定
            types: ["establishment"] // 施設のみを検索対象にする
        });

        autocomplete.bindTo("bounds", this.map);

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (onPlaceChanged && typeof onPlaceChanged === 'function') {
                onPlaceChanged(place);
            }
        });
    },

    /**
     * [Geocoding API] 住所文字列から緯度経度を取得します。
     * @param {string} address - 検索したい住所
     * @param {function(object, string)} callback - 結果を受け取るコールバック関数 (results, status)
     */
    geocodeAddress: function(address, callback) {
        this.geocoder.geocode({ address: address }, callback);
    },

    /**
     * [Geolocation API] ユーザーの現在地を取得します。ブラウザの機能を使いやすくラップします。
     * @param {function(object)} onSuccess - 成功時のコールバック。引数は{lat, lng}オブジェクト。
     * @param {function(object)} onError - 失敗時のコールバック。引数はPositionError オブジェクト。
     */
    getCurrentLocation: function(onSuccess, onError){
        if(!navigator.geolocation){
            console.error("このブラウザはGeolocationをサポートしていません。");
            onError({code: -1, message: "Geolocation not supported." });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = { // userLocationに修正
                    lat: position.coords.latitude, 
                    lng: position.coords.longitude,
                };
                onSuccess(userLocation); // 正しい変数を渡す
            }, 
            (error) => {
                console.error("Geolocation error", error);
                onError(error);
            }
        );
    }
};
