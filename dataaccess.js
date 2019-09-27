
var firebase = require("firebase");
var fs = require('fs');
var pathModule = require('path');
const remote = require('electron').remote;
const app = remote.app;
const electron = require("electron");
const {shell} = require('electron');

const { dialog } = require('electron').remote
const resourcePath = pathModule.join(app.getPath("userData"));
/*
By default it writes logs to the following locations:

on Linux: ~/.config/<app name>/log.log
on macOS: ~/Library/Logs/<app name>/log.log
on Windows: %USERPROFILE%\AppData\Roaming\<app name>\log.log
*/
var logger = require('electron-log');
var config;
window.setInterval(function () {
  authenticate();
  console.log("authenticating..")
}, 15000);


function initialize() {
  logger.catchErrors(options = {});
  fs.readFile(pathModule.join(resourcePath,"config.json"), function (err, data) {
    if (err) {
      console.log(err);
      dialog.showErrorBox("Config file is missing","Please place a config file into " + resourcePath);
      shell.showItemInFolder(resourcePath);

    } 

    data = JSON.parse(data);
    console.log(data)
    config = data;
    // Initialize Firebase
    firebase.initializeApp(data.firebaseConfig);
    authenticate();
    firebaseLoadCompleted();
  })
}
initialize();

window.addEventListener('online', alertOnlineStatus)
window.addEventListener('offline', alertOnlineStatus)
alertOnlineStatus();

function alertOnlineStatus() {

  var statusElements = document.getElementsByClassName("online_status_text");
  for (var i = 0; i < statusElements.length; i++) {
    navigator.onLine ? statusElements[i].classList.add("hidden") : statusElements[i].classList.remove("hidden");
  }

}

function authenticate() {
  firebase.auth().signInWithEmailAndPassword(config.firebaseUserPass.user, config.firebaseUserPass.pass).catch(function (error) {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorCode, errorMessage)
  });
};




//Listeners
function subscribeToAssetList(callback) {
  firebase.database().ref('assets').on('value', function (snapshot) {
    callback(snapshot.val());
  });
}

function subscribeToUserList(callback) {
  firebase.database().ref('users').on('value', function (snapshot) {
    callback(snapshot.val());
  });
}


function saveAsset(name, type, nfcCode, description) {
  firebase.database().ref('assets/' + name).set({
    type: type,
    nfc_code: nfcCode,
    description: description
  }, function (error) {
    if (error) {
      console.log(error)
    }
  }
  );
}

function assignAsset(name, assetInfo, user, callback) {
  var postData = assetInfo;
  postData.assign_date = new Date().getTime();
  postData.assigned_to = user ? user : "";

  var updates = {};
  updates['/assets/' + name] = postData;
  firebase.database().ref().update(updates);
  writeToAssetLog(name, "Assigned " + user, currentUserName)
  if (callback) { callback() }
}

function unassignAsset(name, assetInfo, user, callback) {
  var postData = assetInfo;
  var oldAssignee = postData.assigned_to;
  postData.assign_date = "";
  postData.assigned_to = "";
  var updates = {};
  updates['/assets/' + name] = postData;
  firebase.database().ref().update(updates);
  writeToAssetLog(name, "Unassigned " + oldAssignee, currentUserName)
  if (callback) { callback() }
}

function deleteAsset(name) {
  firebase.database().ref('assets/' + name).remove(function (error) {
    if (error) console.log(error)
  });
  firebase.database().ref('asset_history/' + name).remove(function (error) {
    if (error) console.log(error)
  });
}


function saveUser(name, password, nfcCode, isadmin, callback) {

  firebase.database().ref('users/' + name).set({
    password: password,
    nfc_code: nfcCode,
    isAdmin: isadmin
  }, function (error) {
    if (error) {
      console.log(error)
    }

    if (callback) callback();
  });

  firebase.database().ref('users_codes/' + nfcCode).set({
    name: name
  }, function (error) {
    if (error) {
      console.log(error)
    }
  });
}

function getUserByName(name, callback) {
  firebase.database().ref('/users/' + name).once('value').then(function (snapshot) {
    callback(snapshot.val(), name);
  });
}

function getUserByNfcCode(code, callback) {
  firebase.database().ref('/users_codes/' + code).once('value').then(function (codeInfo) {
    if (codeInfo.val() == null) return callback(null);
    getUserByName(codeInfo.val().name, callback)
  });
}

function deleteUser(name, nfcCode) {
  firebase.database().ref('users/' + name).remove();
  firebase.database().ref('users_codes/' + nfcCode).remove();
}

function writeToAssetLog(assetName, comment, responsibleUser) {
  firebase.database().ref('asset_history/' + assetName + "/" + new Date().getTime()).set({
    comment: comment,
    responsibleUser: responsibleUser
  }, function (error) {
    if (error) {
      console.log(error)
    }
  });
}

function getAssetLog(assetName, callback) {
  firebase.database().ref('/asset_history/' + assetName).once('value').then(function (snapshot) {
    callback(snapshot.val());
  });
}