const electron = require("electron");
const { dialog } = require('electron').remote

const ipc = electron.ipcRenderer;
var hasAdminAccess = false;
var userList;

document.addEventListener("DOMContentLoaded", function () {
    ipc.send("request-admin-info");

});

var currentlyEditingUsername;
nfcInterfaceCallback = nfcHandler;
ipc.on("admin-access-sent", function (event, adminAccess) {
    console.log("admin:", adminAccess);
    hasAdminAccess = adminAccess;
    if (hasAdminAccess) document.getElementById("add_user_button").classList.remove("hidden");
    subscribeToUserList(loadData);
});

function nfcHandler(card){
   
    var cardCode = card.uid;
    if(cardCode == null) return;
    console.log(cardCode)
    if(!document.activeElement.classList.contains("user_nfc_input"))return;
    document.activeElement.value = cardCode;
    


}
function updateUserFieldsInput() {
    var names = document.getElementsByClassName("user_name_input")
    var passwords = document.getElementsByClassName("user_password_input")
    var admins = document.getElementsByClassName("user_admin_input")
    var nfc = document.getElementsByClassName("user_nfc_input")
    for (var i = 0; i < names.length; i++) {
        names[i].oninput = inputFilterUsers;
        passwords[i].oninput = inputFilterUsers;
        admins[i].oninput = inputFilterUsers;
        nfc[i].oninput = inputFilterUsers;
        nfc[i].onkeydown = saveUserOnEnter;
    }
}
function saveUserOnEnter(event) {
    if (event.keyCode == 13) {
        event.target.parentNode.getElementsByClassName("user_save_button")[0].click();
    }

}
function inputFilterUsers(event) {

    var value = event.target.value;
    if (value.indexOf("/") > -1)
        event.target.value = value.replace("/", "");
}

currentlyEditingUsername = "";
var numRowsOpen = 0;

function loadData(users) {
    if (!hasAdminAccess || users == null) return;
  
    var mainContainer = document.getElementById("users_section");

    //empty table
    var childAssets = document.querySelectorAll("#users_section>.user_list_row")
    childAssets.forEach(function (element) {
        mainContainer.removeChild(element);
    })

    var userNames = Object.keys(users);
    var userValues = Object.values(users);
    for (var i = 0; i < userNames.length; i++) {
        userValues[i].username = userNames[i];
    }
 
  //  userList.forEach(user => user.password = null)
    userList = userValues;
    userValues.forEach(function (row) {
        mainContainer.appendChild(createUserRow(row));
    });
    updateUserFieldsInput();
}

function createUserRow(userInfo) {
    var userRow = document.createElement("div");
    userRow.classList.add("row", "user_list_row");

    var nameInput = document.createElement("input");
    nameInput.setAttribute("type", "text");
    nameInput.classList.add("user_name_input")
    nameInput.value = userInfo.username;

    var passwordInput = document.createElement("input");
    passwordInput.setAttribute("type", "password");
    passwordInput.classList.add("user_password_input")
    passwordInput.value = userInfo.password;

    var nfcInput = document.createElement("input");
    nfcInput.setAttribute("type", "password");
    nfcInput.classList.add("wide");
    nfcInput.classList.add("user_nfc_input")
    nfcInput.value = userInfo.nfc_code;

    var checboxLabel = document.createElement("label");

    checboxLabel.classList.add("container_for_checkbox", "hidden");

    var checkbox = document.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    checkbox.classList.add("user_admin_input")
    checkbox.checked = userInfo.admin_access != null && userInfo.admin_access != "";

    var span = document.createElement("span");
    span.classList.add("checkmark");
    checboxLabel.appendChild(checkbox);
    checboxLabel.appendChild(span);

    var editButton = document.createElement("button");
    editButton.innerHTML = "Edit"
    editButton.classList.add("button_style", "user_edit_button");
    editButton.onclick = editUser;

    var deleteButton = document.createElement("button");
    deleteButton.innerHTML = "Delete"
    deleteButton.classList.add("button_style", "user_delete_button", "red");
    deleteButton.onclick = removeUser;

    var saveButton = document.createElement("button");
    saveButton.innerHTML = "Save"
    saveButton.classList.add("button_style", "hidden", "green", "user_save_button", "margin_right");
    saveButton.onclick = updateUser;

    var cancelButton = document.createElement("button");
    cancelButton.innerHTML = "Cancel"
    cancelButton.classList.add("button_style", "hidden", "user_cancel_button");
    cancelButton.onclick = cancelEditUser;

    nameInput.readOnly = true;
    passwordInput.readOnly = true;
    nfcInput.readOnly = true;

    userRow.appendChild(nameInput)
    userRow.appendChild(passwordInput)
    userRow.appendChild(nfcInput)
    userRow.appendChild(checboxLabel)
    userRow.appendChild(editButton)
    userRow.appendChild(deleteButton)
    userRow.appendChild(saveButton)
    userRow.appendChild(cancelButton)
    return userRow;
}

function editUser(event) {
    numRowsOpen++;
    event.target.classList.add("hidden");
    var row = event.target.parentNode;
    document.getElementById("admin_header_text").classList.remove("hidden");
    var adminCheckBox = row.getElementsByClassName("container_for_checkbox")[0];

    adminCheckBox.classList.remove("hidden");

    var saveButton = row.getElementsByClassName("user_save_button")[0];
    saveButton.classList.remove("hidden");

    var deleteButton = row.getElementsByClassName("user_delete_button")[0];
    deleteButton.classList.add("hidden");

    var cancelButton = row.getElementsByClassName("user_cancel_button")[0];
    cancelButton.classList.remove("hidden");

    row.getElementsByClassName("user_name_input")[0].readOnly = false;
    row.getElementsByClassName("user_password_input")[0].readOnly = false;
    row.getElementsByClassName("user_nfc_input")[0].readOnly = false;

    currentlyEditingUsername = row.getElementsByClassName("user_name_input")[0].value;
 
    row.getElementsByClassName("user_admin_input")[0].checked = getUserAdminRights(currentlyEditingUsername);

}

function getUserAdminRights(username) {
    for (var i = 0; i < userList.length; i++) {
        if (userList[i].username == username) return userList[i].isAdmin;
    }
}

function updateUser(event) {
    var row = event.target.parentNode;
    var username = row.getElementsByClassName("user_name_input")[0].value;
    var password = row.getElementsByClassName("user_password_input")[0].value;
    var admin = row.getElementsByClassName("user_admin_input")[0].checked;
    var nfcCode = row.getElementsByClassName("user_nfc_input")[0].value;
    if (username == "") {
        dialog.showMessageBox(null, { type: "warning", message: "Username required", title: "Unable to save user" })
        return;
    }

    if (nfcCode == "") {
        dialog.showMessageBox(null, { type: "warning", message: "NFC code required", title: "Unable to save user" })
        return;
    }


    if (currentlyEditingUsername != username) {
        getUserByName(username, function (value, name) {
            if (value != null) {
                dialog.showMessageBox(null, { type: "question", message: "User " + name + " already exists. Overwrite?", title: "Delete asset", buttons: ["Ok", "Cancel"] }, function (response) {
                    if (response == 1) return;
                    saveUser(username, password, nfcCode, admin, function () {
                        row.getElementsByClassName("user_cancel_button")[0].click();
                        currentlyEditingUsername = "";
                    });
                })
            } else {
                if (currentlyEditingUsername != "") {
                    deleteUser(currentlyEditingUsername, getNFCCode(currentlyEditingUsername));
                }
                saveUser(username, password, nfcCode, admin, function () {
                    row.getElementsByClassName("user_cancel_button")[0].click();
                    currentlyEditingUsername = "";
                });
            }
        });
    } else {
        saveUser(username, password, nfcCode, admin, function () {
            row.getElementsByClassName("user_cancel_button")[0].click();
            currentlyEditingUsername = "";
        });
    }
}
function getNFCCode(username) {
    for (var i = 0; i < userList.length; i++) {
        if (userList[i].username == username) return userList[i].nfc_code;
    }

}
function cancelEditUser(event) {
    numRowsOpen--;
    var row = event.target.parentNode;

    event.target.classList.add("hidden");
    var row = event.target.parentNode;
    if (numRowsOpen < 1) document.getElementById("admin_header_text").classList.add("hidden");
    var adminCheckBox = row.getElementsByClassName("container_for_checkbox")[0];

    adminCheckBox.classList.add("hidden");

    var saveButton = row.getElementsByClassName("user_save_button")[0];
    saveButton.classList.add("hidden");


    var editButton = row.getElementsByClassName("user_edit_button")[0];
    editButton.classList.remove("hidden");

    var deleteButton = row.getElementsByClassName("user_delete_button")[0];
    deleteButton.classList.remove("hidden");

    row.getElementsByClassName("user_name_input")[0].readOnly = true;
    row.getElementsByClassName("user_password_input")[0].readOnly = true;
    row.getElementsByClassName("user_nfc_input")[0].readOnly = true;
}

function removeUser(event) {
    var row = event.target.parentNode;
    var username = row.getElementsByClassName("user_name_input")[0].value;
    dialog.showMessageBox(null, { type: "question", message: "Delete user " + username + "?", title: "Delete user", buttons: ["Ok", "Cancel"] }, function (response) {
        if (response == 1) return;
        deleteUser(username, getNFCCode(username));
    })
}

function addUser() {
    var mainContainer = document.getElementById("users_section");
    var newRow = createUserRow({ username: "", password: "", admin_access: false, nfc_code: "" });
    mainContainer.appendChild(newRow);
    newRow.getElementsByClassName("user_edit_button")[0].click();
    updateUserFieldsInput()
}