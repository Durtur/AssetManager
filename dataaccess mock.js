///Mock


window.addEventListener('online', alertOnlineStatus)
window.addEventListener('offline', alertOnlineStatus)
alertOnlineStatus();
console.log("Setup mock database")
function alertOnlineStatus() {

  var statusElements = document.getElementsByClassName("online_status_text");
  for (var i = 0; i < statusElements.length; i++) {
    navigator.onLine ? statusElements[i].classList.add("hidden") : statusElements[i].classList.remove("hidden");
  }

}

function authenticate() {
 
};

var assets = {
  renault: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "11" },
  mazda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  msazda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },

  madszda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazddsa: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazdsda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazdsda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  msdazda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazsdsda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  magsdszda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazggawgda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazawgwagwagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazaawfwgwagwagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazafwwgwagwagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazawfwgwagwagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazafwwgwagwagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazawfgawagwagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazawafgwagwagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazawgwagwagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazawaawgwagwagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazawgfawgwagwawfagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazawgfawgwagwawfagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazawgfaffaawgwagwagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazawgfahawgwagwagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazawgfahwgwagwagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazawgfawghlhwagwagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  mazawgwagwagda: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "22" },
  fiat: { type: "Cars", assigned_to: "simon", description: "Yoyo", nfc_code: "33" }
}
var user_codes = {
  fass: {name : "simon"},
  bass: {name : "siggi"},
  de04196a: {name : "kalli"},
  mass: {name : "sigridur festeinsson"}
}

var users = {
  simon: { nfc_code: "fass", isAdmin: true, password: "" },
  siggi: { nfc_code: "bass", isAdmin: false, password: "" },
  kalli: { nfc_code: "de04196a", isAdmin: false, password: "" },
  sigridurfesteinsson: { nfc_code: "skass", isAdmin: false, password: "" }
}


//Listeners
function subscribeToAssetList(callback) {

  callback(assets);
}

function subscribeToUserList(callback) {
  callback(users);
}


function saveAsset(name, type, nfcCode, description) {
  assets[name] = {
    type: type,
    nfc_code: nfcCode,
    description: description
  }
  if (loadAssetList) loadAssetList(assets);
}

function assignAsset(name, assetInfo, user, callback) {

  assets[name].assign_date = new Date().getTime();
  assets[name].assigned_to = user ? user : "";

  if (callback) { callback() }
  if (loadAssetList) loadAssetList(assets);
}

function unassignAsset(name, assetInfo, user, callback) {
  assets[name].assign_date = null;
  assets[name].assigned_to = "";

  if (callback) { callback() }
  if (loadAssetList) loadAssetList(assets);
}

function deleteAsset(name) {
  assets[name] = null;
  if (loadAssetList) loadAssetList(assets);
}


function saveUser(name, password, nfcCode, isadmin, callback) {

  users[name] = {
    password: password,
    nfc_code: nfcCode,
    isAdmin: isadmin
  }

  if (callback) callback();

  user_codes[nfc_code] = {name : name};

}

function getUserByName(name, callback) {
  callback(snapshot.val(), users[name]);
}

function getUserByNfcCode(code, callback) {
  if(user_codes[code]){
    callback(users[user_codes[code].name],user_codes[code].name)
  }else{
    callback(null, null);
  }
  
}

function deleteUser(name, nfcCode) {
  users[name] = null;
  user_codes[nfcCode] = null;
}

function writeToAssetLog(assetName, comment, responsibleUser) {
  
}

function getAssetLog(assetName, callback) {
  return {};
}