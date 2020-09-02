
const fs = require("fs");
const pathModule = require('path');
const firebase = require("firebase");

const app = require('electron').remote.app;
var resourcePath = pathModule.join(app.getPath("userData"));
var backupPath = pathModule.join(resourcePath, "backups");
if (!fs.existsSync(backupPath))
  fs.mkdirSync(backupPath);
var config;

/*
By default it writes logs to the following locations:

on Linux: ~/.config/<app name>/log.log
on macOS: ~/Library/Logs/<app name>/log.log
on Windows: %USERPROFILE%\AppData\Roaming\<app name>\log.log
*/
let dataAccess;
class DataAccess {

  initialize(onLoadedCallback) {
    console.log("Initalizing firebase")
    var data = fs.readFileSync(pathModule.join(resourcePath, "config.json"));
    data = JSON.parse(data);
    config = data;
    console.log(config)
    // Initialize Firebase
    if (firebase.apps.length === 0) {
      firebase.initializeApp(data.firebaseConfig);

    }
    if (onLoadedCallback) onLoadedCallback();

  };
  authenticate() {
    if (!config) return;
    //firebase.auth().currentUser !== null)
    console.log(firebase.auth().currentUser)
    if (firebase.auth().currentUser != null)
     console.log( firebase.auth().signInWithEmailAndPassword(config.firebaseUserPass.user, config.firebaseUserPass.pass).catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode, errorMessage)
      }));
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          console.log("User signed in, ", user)
        } else {
          console.log("No one signed in")
        }
      });
  };


  createBackup(object, key) {
    var obj = {
      added: Date.now(),
      data: object
    };
    var path = pathModule.join(backupPath, key + ".json");
    console.log("Creating backup")
    fs.readFile(path, function (err, data) {

      if (err) {
        fs.writeFile(path, JSON.stringify(obj), function (err) { if (err) console.log(err) });
        return;
      }
      data = JSON.parse(data);

      if (!sameDay(data.added, obj.added)) {
        fs.writeFile(path, JSON.stringify(obj), function (err) { console.log(err) });

        fs.writeFile(pathModule.join(backupPath, key) + data.added + ".json", JSON.stringify(data), function (err) { console.log(err) });
      }
    });

    function sameDay(d1, d2) {
      d1 = new Date(d1);
      d2 = new Date(d2);
      console.log(d1, d2)
      return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
    }
  }
  detach() {
    // console.log(firebase.database().ref('assets'))
    // firebase.database().ref('assets').off();
    // firebase.database().ref('users').off();
  }
  //Listeners
  subscribeToAssetList(callback) {
    this.authenticate();
    var parent = this;
    firebase.database().ref('assets').on('value', function (snapshot) {
      var value = snapshot.val();
      // usage example:
      callback(value);

      parent.createBackup(value, "assets");
    });
  }

  subscribeToUserList(callback){
    console.log("Attempting user list subscription");
    this.authenticate();
    var parent = this;
    firebase.database().ref('users').off();
    firebase.database().ref('users').on('value', function (snapshot) {
      var value = snapshot.val();
      callback(value);
      parent.createBackup(value, "users");
    });
  }

  saveAsset(name, type, nfcCode, description) {
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

  assignAsset(name, assetInfo, user, callback) {
    var postData = assetInfo;
    postData.assign_date = new Date().getTime();
    postData.assigned_to = user ? user : "";

    var updates = {};
    updates['/assets/' + name] = postData;
    firebase.database().ref().update(updates);
    this.writeToAssetLog(name, "Assigned " + user, currentUserName)
    if (callback) { callback() }
  }

  unassignAsset(name, assetInfo, user, callback) {
    var postData = assetInfo;
    var oldAssignee = postData.assigned_to;
    postData.assign_date = "";
    postData.assigned_to = "";
    var updates = {};
    updates['/assets/' + name] = postData;
    firebase.database().ref().update(updates);
    this.writeToAssetLog(name, "Unassigned " + oldAssignee, currentUserName)
    if (callback) { callback() }
  }

  deleteAsset(name) {
    if (!name) return;
    firebase.database().ref('assets/' + name).remove(function (error) {
      if (error) console.log(error)
    });
    firebase.database().ref('asset_history/' + name).remove(function (error) {
      if (error) console.log(error)
    });
  }


  saveUser(name, password, nfcCode, isadmin, callback) {
    console.log("Save user " + name)
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

  getUserByName(name, callback) {
    firebase.database().ref('/users/' + name).once('value').then(function (snapshot) {
      callback(snapshot.val(), name);
    });
  }

  getUserByNfcCode(code, callback) {
    var parent = this;
    firebase.database().ref('/users_codes/' + code).once('value').then(function (codeInfo) {
      if (codeInfo.val() == null) return callback(null);
      parent.getUserByName(codeInfo.val().name, callback)
    });
  }

  deleteUser(name, nfcCode) {
    if (name)
      firebase.database().ref('users/' + name).remove();
    if (nfcCode)
      firebase.database().ref('users_codes/' + nfcCode).remove();
  }

  writeToAssetLog(assetName, comment, responsibleUser) {
    firebase.database().ref('asset_history/' + assetName + "/" + new Date().getTime()).set({
      comment: comment,
      responsibleUser: responsibleUser
    }, function (error) {
      if (error) {
        console.log(error)
      }
    });
  }

  getAssetLog(assetName, callback) {
    var parent = this;
    firebase.database().ref('/asset_history/' + assetName).once('value').then(function (snapshot) {
      var value = snapshot.val()
      callback(value);
      parent.createBackup(value, "asset_history");
    });
  }

};


module.exports = dataAccess || (dataAccess = new DataAccess())