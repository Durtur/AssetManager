///Mock
const { ipcRenderer } = require('electron')

console.log("Setup mock database")


const dataAccess = function () {
  function authenticate() {
    console.log("Data access authenticate");
  };
  function initialize() {
    console.log("Data access initialize");

    ipcRenderer.send('data-access-initialized');
  }


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
    fass: { name: "simon" },
    bass: { name: "siggi" },
    de04196a: { name: "kalli" },
    mass: { name: "sigridur festeinsson" },
    trass: { name: "siggi2" },
    awawgawg: { name: "siggi3" },
    bass2525: { name: "siggi4" },
    hhrhr: { name: "siggi5" },
    awgawgawg: { name: "siggi6" },
    gegegaas: { name: "siggi7" },
    awgawgagawgaw: { name: "siggi8" },

  }

  var users = {
    simon: { nfc_code: "fass", isAdmin: true, password: "" },
    siggi: { nfc_code: "bass", isAdmin: false, password: "" },
    toki: { nfc_code: "sass", isAdmin: false, password: "" },
    siggi2: { nfc_code: "trass", isAdmin: false, password: "" },
    siggi3: { nfc_code: "awawgawg", isAdmin: false, password: "" },
    siggi4: { nfc_code: "bass2525", isAdmin: false, password: "" },
    siggi5: { nfc_code: "hhrhr", isAdmin: false, password: "" },
    siggi6: { nfc_code: "awgawgawg", isAdmin: false, password: "" },
    siggi7: { nfc_code: "gegegaas", isAdmin: false, password: "" },
    siggi8: { nfc_code: "awgawgagawgaw", isAdmin: false, password: "" },

    kalli: { nfc_code: "de04196a", isAdmin: false, password: "" },
    sigridurfesteinsson: { nfc_code: "skass", isAdmin: false, password: "" }
  }


  //Listeners
  function subscribeToAssetList(callback) {
    console.log("Asset list subscribed")
    callback(assets);
  }

  function subscribeToUserList(callback) {
    console.log("User list subscribed")
    callback(users);
  }


  function saveAsset(name, type, nfcCode, description) {
    console.log("Save asset " + name + "  " + type + "  " + nfcCode + "  " + description)
    assets[name] = {
      type: type,
      nfc_code: nfcCode,
      description: description
    }
    if (loadAssetList) loadAssetList(assets);
  }

  function assignAsset(name, assetInfo, user, callback) {
    console.log("assignAsset asset " + name + "  " + assetInfo + "  " + user )
    assets[name].assign_date = new Date().getTime();
    assets[name].assigned_to = user ? user : "";

    if (callback) { callback() }
    if (loadAssetList) loadAssetList(assets);
  }

  function unassignAsset(name, assetInfo, user, callback) {
    console.log("unassignAsset asset " + name + "  " + assetInfo + "  " + user )
    assets[name].assign_date = null;
    assets[name].assigned_to = "";

    if (callback) { callback() }
    if (loadAssetList) loadAssetList(assets);
  }

  function deleteAsset(name) {
    console.log("delete asset " + name);
    assets[name] = null;
    if (loadAssetList) loadAssetList(assets);
  }


  function saveUser(name, password, nfcCode, isadmin, callback) {
    console.log("Save user " + name + " code " + nfcCode)
    users[name] = {
      password: password,
      nfc_code: nfcCode,
      isAdmin: isadmin
    }

    if (callback) callback();

    user_codes[nfcCode] = { name: name };

  }

  function getUserByName(name, callback) {
    callback(name, users[name]);
  }

  function getUserByNfcCode(code, callback) {
    if (user_codes[code]) {
      callback(users[user_codes[code].name], user_codes[code].name)
    } else {
      callback(null, null);
    }

  }

  function deleteUser(name, nfcCode) {
    console.log("Delete user " + name + " code " + nfcCode)
    users[name] = null;
    user_codes[nfcCode] = null;
  }

  function writeToAssetLog(assetName, comment, responsibleUser) {

  }

  function getAssetLog(assetName, callback) {
    return {};
  }

  return {
    getAssetLog: getAssetLog,
    writeToAssetLog: writeToAssetLog,
    deleteUser: deleteUser,
    getUserByName: getUserByName,
    getUserByNfcCode: getUserByNfcCode,
    saveUser: saveUser,
    assignAsset: assignAsset,
    subscribeToAssetList: subscribeToAssetList,
    saveAsset: saveAsset,
    initialize: initialize,
    unassignAsset: unassignAsset,
    deleteAsset: deleteAsset,
    subscribeToUserList: subscribeToUserList,
    authenticate: authenticate

  }

}();


module.exports = dataAccess;