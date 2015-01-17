var MEMOLISTNAME = "memo-list"; // localforage で利用するキー
var ENDPOINT = "http://maps.googleapis.com/maps/api/geocode/json";

var DRIVERLIST = [
  window.localforage.INDEXEDDB,
  window.localforage.WEBSQL,
  window.localforage.LOCALSTORAGE
];

var ACTIVITIES = {
  PICK: {
    name : "pick",
    data: {
      type: "image/jpeg"
    }
  }
};

/*
 memo 作成画面で表示されるフォーム
*/
var memoInputElements = {
  title: document.querySelector("#memo-title"),
  place: document.querySelector("#memo-place"),
  details: document.querySelector("#memo-details"),
  picture: document.querySelector("#memo-picture"),
  button: {
    submit: document.querySelector("#memo-submit"),
    location: document.querySelector("#memo-location"),
    picture: document.querySelector("#memo-add-picture")
  }
};

var _gc = null;

/*
 様々な出力先
 */
var outputElements = {
  memoList: document.querySelector("#memo-list")
};

/*
 登録される全メモをいれたメモリスト
 */
var memos = [];

/*
 メモオブジェクトを作成する関数
 */
var createMemo = function(title, place, details, picture){
  return {
    title: title,
    place: place,
    details: details,
    picture: picture,
    timestamp: new Date()
  };
};

/*
 メモの写真部分をHTMLにする関数
*/
var createMemoPictureElement = function(memo){
  var img = document.createElement("img");
  img.src = memo.picture;
  img.classList.add("memo-picture");
  return img;
};

/*
 メモオブジェクトのタイトル部分を HTML にする関数
 */
var createMemoTitleElement = function(memo){
  var div = document.createElement("div");
  div.textContent = memo.title;
  div.classList.add("memo-title");
  return div;
};

/*
 メモオブジェクトの場所部分を HTML にする関数
 */
var createMemoPlaceElement = function(memo){
  var div = document.createElement("div");
  div.textContent = memo.place;
  div.setAttribute("class", "memo-place");
  return div;
};

/*
 メモオブジェクトの詳細部分を HTML にする関数
 */
var createMemoDetailsElement = function(memo){
  var div = document.createElement("div");
  div.textContent = memo.details;
  div.setAttribute("class", "memo-details");
  return div;
};

/*
 タイムスタンプの書式を整える関数
*/
var formatTimestamp = function(date){
  return date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate() + " " +
    date.getHours() + ":" + date.getMinutes();
};

/*
 メモオブジェクトの日付部分を HTML にする関数
 */
var createMemoTimestampElement = function(memo){
  var div = document.createElement("div");
  div.textContent = formatTimestamp(memo.timestamp);
  div.setAttribute("class", "memo-timestamp");
  return div;
};

/*
 メモリストを保存する関数
 */
var saveMemoList = function(){
  window.localforage.setItem(MEMOLISTNAME, memos);
};

/*
 メモを削除する関数。メモリストからも HTML からも削除される。
 */
var removeMemo = function(memo, element){
  if(element != null && element.parentNode != null){
    element.parentNode.removeChild(element);
  }
  var index = memos.indexOf(memo);
  if(index >= 0){
    memos.splice(index, 1);
    saveMemoList();
  }
};

/*
 メモオブジェクトを HTML にする関数
 */
var createMemoElement = function(memo){
  var li = document.createElement("li");
  li.appendChild(createMemoPictureElement(memo));
  var div = document.createElement("div");
  div.classList.add("memo-description");
  div.appendChild(createMemoTitleElement(memo));
  div.appendChild(createMemoDetailsElement(memo));
  div.appendChild(createMemoPlaceElement(memo));
  div.appendChild(createMemoTimestampElement(memo));
  li.appendChild(div);
  li.setAttribute("class", "memo");

  // スワイプされたらメモを削除する
  li.addEventListener("swipeLeft", function(){
    removeMemo(memo, li);
  });
  li.addEventListener("swipeRight", function(){
    removeMemo(memo, li);
  });
  
  return li;
};


/*
 メモオブジェクトを HTML として表示する関数
 */
var displayMemo = function(memo){
  outputElements.memoList.appendChild(createMemoElement(memo));
};

/*
 メモ入力画面の各フォームの入力値をからにする関数
 */
var clearMemoInput = function(){
  memoInputElements.title.value = "";
  memoInputElements.place.value = "";
  memoInputElements.details.value = "";
  
  var context = gc();
  context.fillStyle = "white";
  context.fillRect(0, 0,
                   memoInputElements.picture.width,
                   memoInputElements.picture.height);
};

/*
 メモを追加する関数。メモ入力画面のコントローラ
 */
var addMemo = function(){
  var newMemo = createMemo(memoInputElements.title.value,
                           memoInputElements.place.value,
                           memoInputElements.details.value,
                           memoInputElements.picture.toDataURL("image/jpeg"));
  memos.push(newMemo);
  displayMemo(newMemo);
  saveMemoList();
  clearMemoInput();
  
  document.location = "#home";
};

var showGeolocationError = function(){
};

var showCurrentPosition = function(response){
  console.log(response);
  if(response.status == "OK"){
    memoInputElements.place.value = response.results[0].formatted_address;
  }
};

var buildInvertGeocodingQuery = function(position){
  var latlng = position.coords.latitude + "," + position.coords.longitude;
  return ENDPOINT + "?sensor=true&latlng=" + latlng;
};

var invertGeocode = function(position){
  console.log(position);
  var query = buildInvertGeocodingQuery(position);
  console.log("send invert geocoding query as "  + query);
  $.getJSON(query, showCurrentPosition);
};

var estimateCurrentLocation = function(){
  navigator.geolocation.getCurrentPosition(invertGeocode, showGeolocationError);
};

var gc  = function(){
  if(_gc == null){
    _gc = memoInputElements.picture.getContext("2d");
  }
  return _gc;
};

var converter = function(){
  return memoInputElements.picture;
};

var displayPicture = function(){
  var canvas = converter();
  var context = gc();
  var img =  this;
  var width, height, offsetX, offsetY;
  if(img.width < img.height){
    width = img.width;
    height = img.width;
    offsetX = 0;
    offsetY = (img.height - height) / 2;
  }else{
    width = img.height;
    height = img.height;
    offsetX = (img.width - width) / 2;
    offsetY = 0;
  }
  context.drawImage(img, offsetX, offsetY, width, height,
                    0, 0, canvas.width, canvas.height);
};

var loadPicture = function(){
  var img = new window.Image();
  img.onload = displayPicture;
  img.src = window.URL.createObjectURL(this.result.blob);
};

var addPicture = function(){
  var pick = new window.MozActivity(ACTIVITIES.PICK);
  pick.onsuccess = loadPicture;
};

/*
 保存されていたデータからメモリストと、画面表示を復元する関数。
 localforage.getItem のコールバック関数
 */
var restoreMemoList = function(list){
  memos = list;
  if(memos == null){
    memos = [];
  }
  var i = 0;
  while(i < memos.length){
    displayMemo(memos[i]);
    i = i + 1;
  }
};

/*
 アプリの初期化を行う関数
 */
var initApp = function(){
  memoInputElements.button.submit.addEventListener("click", addMemo);
  memoInputElements.button.location.addEventListener("click", estimateCurrentLocation);
  memoInputElements.button.picture.addEventListener("click", addPicture);
  window.localforage.setDriver(DRIVERLIST);
  window.localforage.getItem(MEMOLISTNAME, restoreMemoList);
};

initApp();
