// この関数は、Google Maps APIのスクリプトが読み込まれた後に呼び出される
function initMap() {
  // 地図の初期位置を設定
  const initialLocation = { lat: 35.6895, lng: 139.6917 }; // 例: 東京

  // 地図を作成して、HTMLの 'map' というidを持つ要素に表示
    const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: initialLocation,
    });
}