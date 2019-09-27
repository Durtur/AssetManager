const { ipcRenderer } = require('electron');
const ipc = electron.ipcRenderer;
var adminAccess = false;
var currentUserName, currentUserInfo;
var currentlySelectedAssetElement;
var loginMode = 0; // 0 = nfc
var currentlyEditing = false;
var loggedOn = false;
var assetList, userList,userCodeList;

var sortFunctions = { sortDirectionAssetList: [1, 1, -1, 1] };
function openUsersWindow() {
    ipc.send("open-users-window", adminAccess);
}

ipcRenderer.on('update_available', () => {
    ipcRenderer.removeAllListeners('update_available');
    showNotification("Update available!")
  });
  ipcRenderer.on('update_downloaded', () => {
    ipcRenderer.removeAllListeners('update_downloaded');
    showNotification("Update will be installed after the app closes.")
  });
function firebaseLoadCompleted(){
    subscribeToUserList(function (value) {
        console.log("userlist susbsribed")
        userCodeList = [];
        userList = Object.keys(value);
        userInfo = Object.values(value);
        for (var i = 0; i < userList.length; i++) {
            if (userInfo[i].isAdmin) userList.splice(userList[i], 1);
            userCodeList.push(userInfo[i].nfc_code);
        }
        if (assetList) showAssetList(assetList);
    });

    nfcInterfaceCallback = nfcHandler;
    document.getElementById("login_password").focus();
    document.getElementById("login_password").onkeydown = loginOnEnter;
    document.getElementById("login_username").onkeydown = loginOnEnter;
    document.getElementById("asset_scan_input").onkeydown = addOrRemoveAssetOnEnter;
    document.getElementById("asset_list_searchbox").onkeyup = filterAssetList;
    document.getElementById("asset_name_input").onkeydown = addAssetOnEnter;

    document.getElementById("asset_nfc_input").onkeydown = addAssetOnEnter;
    document.getElementById("asset_description_input").onkeydown = addAssetOnEnter;
}


function nfcHandler(data){
    var code = data.uid; 
    if(!loggedOn){
        validateLoginCardCode(code);
    }else if(!adminAccess){
        processAddOrRemoveAsset(code);
    }else{
        if(document.activeElement.classList.contains("asset_nfc_input")){
            document.activeElement.value = code;
        }else{
            if (userCodeList.indexOf(code)>= 0) return logout();
        }
    }
}


function showNotification(text){
    var notificationWindow = document.querySelector(".notification_window");
    notificationWindow.getElementsByTagName("p")[0].innerHTML = text;
    notificationWindow.style.height = "80px";
    window.setTimeout(function(){
        notificationWindow.style.height = "0px";
    },8000)



}

function addAssetOnEnter(event) {
    if (event.keyCode == 13) addAsset();
}
function loginOnEnter(event) {
    if (event.keyCode == 13) login();
}
function sortAssetListBy(fieldName, columnIndex) {
    var sortGroup = document.querySelectorAll(".sortGroup1");
    sortGroup.forEach(function (ele) {
        ele.classList.remove("sorting_by_down")
        ele.classList.remove("sorting_by_up")
    })

    sortFunctions.sortDirectionAssetList[columnIndex] = -1 * sortFunctions.sortDirectionAssetList[columnIndex];
    if (sortFunctions.sortDirectionAssetList[columnIndex] == 1) {
        sortGroup[columnIndex].classList.add("sorting_by_down");
    } else {
        sortGroup[columnIndex].classList.add("sorting_by_up");
    }
    sortFunctions.assetList = function (a, b) {
        if (typeof a == "string") {
            if (a[fieldName].toLowerCase() < b[fieldName].toLowerCase()) return -1 * sortFunctions.sortDirectionAssetList[columnIndex];
            if (a[fieldName].toLowerCase() > b[fieldName].toLowerCase()) return sortFunctions.sortDirectionAssetList[columnIndex];
            return 0;
        } else {
            if (a[fieldName] < b[fieldName]) return -1 * sortFunctions.sortDirectionAssetList[columnIndex];
            if (a[fieldName] > b[fieldName]) return sortFunctions.sortDirectionAssetList[columnIndex];
            return 0;
        }


    }
    showAssetList(assetList)
}
function addOrRemoveAssetOnEnter(event) {
    if (event.keyCode != 13) return;

    var scannedValue = document.getElementById("asset_scan_input").value;
    processAddOrRemoveAsset(scannedValue);
}

function processAddOrRemoveAsset(scannedValue){
    
    var alreadyAssigned = false;
    var errorTextElement = document.getElementById("asset_scan_error");
    errorTextElement.innerHTML = "";

    if (userCodeList.indexOf(scannedValue)>= 0) return logout();
    if (assetList == null) return;
    for (var i = 0; i < assetList.length; i++) {
        console.log(assetList[i].nfc_code, scannedValue)
        if (assetList[i].nfc_code == scannedValue) {
            if (assetList[i].assigned_to == currentUserName) {
                alreadyAssigned = true;
            }
            alreadyAssigned ? unAssignMe(null, assetList[i].name) : assignToMe(null, assetList[i].name);
            document.getElementById("asset_scan_input").value = "";
            return;
        }
    }
    errorTextElement.innerHTML = "Asset not found";
    document.getElementById("asset_scan_input").value = "";
}
function initialize() {
    subscribeToAssetList(loadAssetList);

    if (adminAccess) {
        document.getElementById("users_tab").classList.remove("hidden");
        document.getElementById("add_asset_tab").classList.remove("hidden");
        document.getElementById("asset_list_section").classList.remove("hidden");
        document.getElementById("assigned_assetlist_container").classList.add("hidden");
        document.getElementById("nfc_assign_input").classList.add("hidden");
        
    } else {
        document.getElementById("asset_scan_input").focus();
        document.getElementById("header").classList.add("hidden");
        document.getElementById("asset_list_searchbox").classList.add("hidden");
        
    };
    document.body.classList.remove("no_scroll");
}
function showUserAndPasswordFields() {
    document.getElementById("login_error").innerHTML = "";
    document.getElementById("show_nfc_card_button").classList.remove("button_clear_toggled");
    document.getElementById("show_user_and_pass_button").classList.add("button_clear_toggled");
    document.getElementById("login_username").parentNode.classList.remove("hidden");
    document.getElementById("login_password").parentNode.getElementsByTagName("label")[0].innerHTML = "Password";
    document.getElementById("login_password").classList.remove("huge");
    loginMode = 1;
}

function showNfcCardField() {
    document.getElementById("login_error").innerHTML = "";
    document.getElementById("show_nfc_card_button").classList.add("button_clear_toggled");
    document.getElementById("show_user_and_pass_button").classList.remove("button_clear_toggled");
    loginMode = 0;
    document.getElementById("login_username").parentNode.classList.add("hidden");
    document.getElementById("login_password").parentNode.getElementsByTagName("label")[0].innerHTML = "Card code";
    document.getElementById("login_password").classList.add("huge");
}

function logout() {
    currentUserInfo = null;
    currentUserName = null;
    loggedOn = false;
    document.body.classList.add("background");
    loginMode = 0;
    currentlyEditing = false;
    adminAccess = false;
    document.getElementById("login_wrapper").classList.remove("hidden");
    document.getElementById("users_tab").classList.add("hidden");
    document.getElementById("add_asset_tab").classList.add("hidden");
    document.getElementById("asset_list_section").classList.add("hidden");
    document.getElementById("assigned_assetlist_container").classList.remove("hidden");
    document.getElementById("nfc_assign_input").classList.remove("hidden");
    document.getElementById("asset_scan_input").value = "";
    document.getElementById("login_password").focus();

    document.getElementById("header").classList.remove("hidden");
    document.getElementById("asset_list_searchbox").classList.remove("hidden");
    
    document.body.classList.add("no_scroll");
    stopAddingAssets();
}

function login() {
    var username, cardCode, password;
    //Username and pass
    console.log("Requesting user info...")
    if (loginMode == 1) {
        username = document.getElementById("login_username").value;
        password = document.getElementById("login_password").value;
        getUserByName(username, function (result, username) {

            if (result == null || result.password != password || result.password == null || result.password == "") {
                document.getElementById("login_password").value = "";
                document.getElementById("login_username").value = "";
                document.getElementById("login_error").innerHTML = "Invalid username or password";
                loggedOn = false;
                return;
            }
            loginSuccessful(username, result)
        });
    } else {
       
        cardCode = document.getElementById("login_password").value;
        validateLoginCardCode(cardCode);
       
    }
   
}

function validateLoginCardCode(cardCode){
    console.log("Login:" + cardCode)
    getUserByNfcCode(cardCode, function (result, username) {
        console.log(result)
        if (result == null) {
            document.getElementById("login_password").value = "";
            document.getElementById("login_error").innerHTML = "Invalid username or password";
            return;
        }
        loginSuccessful(username, result)
    });
}

function loginSuccessful(username, userInfo) {
    console.log(username, userInfo)
    currentUserName = username;
    currentUserInfo = userInfo;
    adminAccess = userInfo.isAdmin;
    document.body.classList.remove("no_scroll");
    document.body.classList.remove("background");
    document.getElementById("login_password").value = "";
    document.getElementById("login_username").value = "";
    document.getElementById("login_wrapper").classList.add("hidden");
    loggedOn = true;
    initialize();
}

function startAddingAssets() {
    document.getElementById("add_asset_section").classList.remove("hidden")
}
function stopAddingAssets() {
    document.getElementById("add_asset_section").classList.add("hidden");
    clearAddAssetFields();
    currentlyEditing = false;
}
function loadTypeList() {
    // select distinct 'first_name' from customers
    var listArray = [];
    assetList.forEach(function (x) {
        if (listArray.indexOf(x.type.trim()) < 0) listArray.push(x.type.trim())
    })
    new Awesomplete(document.getElementById("asset_type_input"), { list: listArray, autoFirst: true });


}

function addAsset() {
    var newAssetName = document.getElementById("asset_name_input").value;

    var newAssetType = document.getElementById("asset_type_input").value;
    newAssetType = newAssetType.substring(0, 1).toUpperCase() + newAssetType.substring(1).toLowerCase();
    var newAssetNfc = document.getElementById("asset_nfc_input").value;
    if (newAssetName == "") {
        window.alert("Name required");
        return;
    } else if (newAssetType == "") {
        window.alert("Type required");
        return;
    } else if (newAssetNfc == "") {
        window.alert("NFC code required");
        return;
    }

    var newAssetDescription = document.getElementById("asset_description_input").value;
    if (!currentlyEditing && assetList != null) {
        for (var i = 0; i < assetList.length; i++) {
            if (assetList[i].name == newAssetName) {
                dialog.showMessageBox(null, { type: "question", message: "Asset " + newAssetName + " already exists. Do you wish to overwrite?", title: "Overwrite asset", buttons: ["Ok", "Cancel"] }, function (response) {
                    if (response == 1) return;
                });
            };
        }
    }

    saveAsset(newAssetName, newAssetType, newAssetNfc, newAssetDescription);
    currentlyEditing = false;
    clearAddAssetFields();
    document.getElementById("asset_name_input").focus();
}
function clearAddAssetFields() {
    document.getElementById("asset_name_input").value = "";
    document.getElementById("asset_type_input").value = "";
    document.getElementById("asset_nfc_input").value = "";
    document.getElementById("asset_description_input").value = "";
}

function loadAssetList(queryResult) {
    if (queryResult == null) return;
    var assetNames = Object.keys(queryResult);
    var assetValues = Object.values(queryResult);
    for (var i = 0; i < assetNames.length; i++) {
        assetValues[i].name = assetNames[i];
    }
    assetList = assetValues;
    adminAccess ? showAssetList(assetList) : showAssignedAssetList(assetList);
}

function showAssignedAssetList(assetList) {
    document.getElementById("username_text").innerHTML = currentUserName;
    var assetContainer = document.querySelector("#assigned_assetlist");
    var childAssets = document.querySelectorAll("#assigned_assetlist>.asset_list_item_variant:not(:first-child)")
    childAssets.forEach(function (element) {
        assetContainer.removeChild(element);
    });
    var myAssets = [];
    assetList.forEach(element => {
        if (element.assigned_to == currentUserName) myAssets.push(element)
    });
    if (myAssets.length == 0) {
        document.getElementById("no_assets_assigned_text").innerHTML = "Nothing assigned";
    } else {
        document.getElementById("no_assets_assigned_text").innerHTML = "Assigned assets";
    }
    myAssets.forEach(element => {

        var rowElement = document.createElement("div");
        rowElement.classList.add("row");


        var newAsset = document.createElement("div");
        newAsset.classList.add("asset_list_item_variant");

        var assetNameElement = document.createElement("h4");
        assetNameElement.innerHTML = element.name;
        assetNameElement.classList.add("asset_name");

        var descriptionElement = document.createElement("p");
        descriptionElement.innerHTML = element.description ? element.description : "";
        descriptionElement.classList.add("asset_description");

        var assetTypeElement = createAssetTypeElement(element.type)
        var assignDateElement = createAssetDateElement(element.assign_date);



        rowElement.appendChild(assetNameElement);
        rowElement.appendChild(descriptionElement);
        rowElement.appendChild(assetTypeElement);
        rowElement.appendChild(assignDateElement);

        newAsset.appendChild(rowElement);
        assetContainer.appendChild(newAsset)
    });
}

function createAssetTypeElement(type) {
    var ele = document.createElement("p");
    ele.innerHTML = type;
    ele.classList.add("asset_type");
    return ele;
}

function createAssetDateElement(date) {
    var assignDateElement = document.createElement("p");
    assignDateElement.classList.add("asset_assigned_date");
    assignDateElement.innerHTML = date ? getPrettyDate(date) : "";
    return assignDateElement;
}

function showAssetList(assetList) {
    var assetContainer = document.querySelector("#asset_list_section");
    var childAssets = document.querySelectorAll("#asset_list_section>.asset_list_item:not(:first-child)")
    childAssets.forEach(function (element) {
        assetContainer.removeChild(element);
    })
    if (sortFunctions.assetList) assetList.sort(sortFunctions.assetList);
    var currentlyAssigned;
    assetList.forEach(element => {
        var columnElement = document.createElement("div");
        columnElement.classList.add("column");

        var rowElement = document.createElement("div");
        rowElement.classList.add("row");
        columnElement.appendChild(rowElement);

        currentlyAssigned = currentUserName == element.assigned_to || (adminAccess && element.assigned_to != "" && element.assigned_to != null);
        var newAsset = document.createElement("div");
        newAsset.classList.add("asset_list_item");

        var assetNameElement = document.createElement("h4");
        assetNameElement.innerHTML = element.name;
        assetNameElement.classList.add("asset_name");
        if (element.description) {
            assetNameElement.classList.add("tooltipped", "clickable");
            assetNameElement.setAttribute("data-tooltip", element.description);
        }
        assetNameElement.onmousedown = assetNameClickHandler;
        var assetTypeElement = createAssetTypeElement(element.type)
        assetTypeElement.classList.add("asset_type");

        var assetAssigneeElement = document.createElement("p");
        assetAssigneeElement.innerHTML = element.assigned_to ? element.assigned_to : "";
        assetAssigneeElement.classList.add("asset_assignee");

        var assignDateElement = createAssetDateElement(element.assign_date);
        assignDateElement.classList.add("asset_assign_date");

        if (currentlyAssigned) {
            var assignElement = document.createElement("button");
            assignElement.onclick = unAssignMe;
            assignElement.classList.add("button_style");
            assignElement.innerHTML = "Unassign";
        } else {
            var assignElement = createDropDownAssignUserList();
        }
        var assignInputElement = document.createElement("input");
        assignInputElement.classList.add("assign_user_dropdown", "hidden");
        assignElement.classList.add("assign_user_button");

        var historyLogElement = document.createElement("div");
        historyLogElement.classList.add("asset_history", "collapsed");
        columnElement.appendChild(historyLogElement);

        rowElement.appendChild(assetNameElement)
        rowElement.appendChild(assetTypeElement);
        rowElement.appendChild(assetAssigneeElement);
        rowElement.appendChild(assignDateElement);
        rowElement.appendChild(assignElement);
        rowElement.appendChild(assignInputElement);
        newAsset.appendChild(columnElement);
        assetContainer.appendChild(newAsset)
    });
    filterAssetList();
    loadTypeList();
}

function createDropDownAssignUserList() {
    var btn = document.createElement("button");
    btn.classList.add("dropbtn", "button_style");
    btn.innerHTML = "Assign"
    btn.addEventListener("click", function (e) {
        var button =  e.target;
        var assignInputElement =  button.parentNode.getElementsByClassName("assign_user_dropdown")[0]
        hideAllDropdownsAndShowAllButtons();
        assignInputElement.classList.remove("hidden");
        document.onkeydown =  function(evt){
            if(evt.keyCode == 27){
                document.onkeydown = null;
                hideAllDropdownsAndShowAllButtons();
            }   
        }
        button.classList.add("hidden");

        if(userList){
            new Awesomplete(assignInputElement, { list: userList , autoFirst: true, minChars:0 });
        }else{
            subscribeToUserList(function(list){
                new Awesomplete(assignInputElement, { list: list , autoFirst: true, minChars: 0 });
            })
        }
        assignInputElement.addEventListener('awesomplete-selectcomplete', function (e) {
            var userName = e.target.value;
            if(userName == "")return;
            assignUserHandler(userName)
        });
    })

    return btn;
}
function hideAllDropdownsAndShowAllButtons(){
    var buttons = document.getElementsByClassName("assign_user_button");
    var inputs = document.getElementsByClassName("assign_user_dropdown");
    for(var i = 0 ; i < inputs.length ; i++){
        inputs[i].classList.add("hidden");
        buttons[i].classList.remove("hidden");
    }
}

function filterAssetList() {
    var searchString = document.getElementById("asset_list_searchbox").value.toLowerCase();

    var nameElements = document.querySelectorAll(".asset_name")
    var assigneeElements = document.querySelectorAll(".asset_assignee")
    var typeElements = document.querySelectorAll(".asset_type")
    var dateElements = document.querySelectorAll(".asset_assign_date")

    for (var i = 0; i < nameElements.length; i++) {
        var found =
            nameElements[i].innerHTML.toLowerCase().indexOf(searchString) > -1 ||
            assigneeElements[i].innerHTML.toLowerCase().indexOf(searchString) > -1 ||
            typeElements[i].innerHTML.toLowerCase().indexOf(searchString) > -1 ||
            dateElements[i].innerHTML.toLowerCase().indexOf(searchString) > -1;

        if (found) {
            nameElements[i].parentNode.parentNode.parentNode.classList.remove("hidden");
        } else {
            nameElements[i].parentNode.parentNode.parentNode.classList.add("hidden");
        }
    }
}
function showTooltip(e) {

    if (!e.button == 2) return;

    var tooltip = document.getElementById("asset_row_tooltip")
    tooltip.classList.remove("hidden");

    tooltip.style.left = e.pageX + "px";
    tooltip.style.top = e.pageY + "px";

    window.onclick = function (evet) {
        var tooltip = document.getElementById("asset_row_tooltip")
        if (tooltip.classList.contains("hidden")) return;
        tooltip.classList.add("hidden");
        window.oncontextmenu = null;
    }

}

function assetNameClickHandler(e) {
    currentlySelectedAssetElement = e.target;
    if (e.button == 2) return showTooltip(e);
    if (e.button == 0) return showHistory();

}
function editAsset() {
    document.getElementById("asset_row_tooltip").classList.add("hidden");
    var assetName = currentlySelectedAssetElement.innerHTML
    var assetInfo = getAssetInfo(assetName);
    startAddingAssets();
    document.getElementById("asset_name_input").value = assetName;
    document.getElementById("asset_type_input").value = assetInfo.type;
    document.getElementById("asset_nfc_input").value = assetInfo.nfc_code;
    document.getElementById("asset_description_input").value = assetInfo.description ? assetInfo.description : "";
    currentlyEditing = true;

}
function removeAsset() {
    var rowColumn = currentlySelectedAssetElement.parentNode.parentNode;
    var tooltip = document.getElementById("asset_row_tooltip")
    var assetname = currentlySelectedAssetElement.innerHTML

    tooltip.classList.add("hidden");
    dialog.showMessageBox(null, { type: "question", message: "Delete asset " + assetname + "?", title: "Delete asset", buttons: ["Ok", "Cancel"] }, function (response) {
        if (response == 1) return;

        deleteAsset(assetname);

    })
}
function showHistory() {
    var rowColumn = currentlySelectedAssetElement.parentNode.parentNode;
    var tooltip = document.getElementById("asset_row_tooltip")
    tooltip.classList.add("hidden");
    if (!rowColumn.getElementsByClassName("asset_history")[0].classList.contains("collapsed")) return closeHistory(rowColumn);
    getAssetLog(currentlySelectedAssetElement.innerHTML, function (list) {
        if (list == null || list.length == 0) return;
        var elementList = [];
        var dates = Object.keys(list);
        var otherValues = Object.values(list);
        var currentEl;
        var table = document.createElement("table");
        var currentRow, date, user, comment;
        for (var i = 0; i < dates.length; i++) {
            currentEl = otherValues[i];
            currentEl.action_date = dates[i];
            elementList.push(currentEl);
        }
        elementList.sort(function (a, b) {
            return b.action_date - a.action_date
        })
        var historyString = "";
        elementList.forEach(function (element) {
            currentRow = document.createElement("tr");
            date = document.createElement("td");
            user = document.createElement("td");
            comment = document.createElement("td");
            date.innerHTML = getPrettyDate(element.action_date);
            user.innerHTML = element.responsibleUser;
            comment.innerHTML = element.comment;

            currentRow.appendChild(date);
            currentRow.appendChild(user);
            currentRow.appendChild(comment);
            table.appendChild(currentRow);
        });

        rowColumn.getElementsByClassName("asset_history")[0].appendChild(table);
        rowColumn.getElementsByClassName("asset_history")[0].classList.remove("collapsed");
    });
}
function closeHistory(rowElement) {
    var historyElement = rowElement.getElementsByClassName("asset_history")[0]
    historyElement.innerHTML = "";
    historyElement.classList.add("collapsed");
}
function assignUserHandler(userName) {
    var assetName = event.target.parentNode.parentNode.parentNode.getElementsByClassName("asset_name")[0].innerHTML;
    assignAsset(assetName, getAssetInfo(assetName), userName, null)
}
function assignToMe(event, assetName) {
    assignHelper(event, assetName, true)
}

function unAssignMe(event, assetName) {
    assignHelper(event, assetName, false)

}
function assignHelper(event, assetName, assign) {
    if (assetName == null) {
        var src = event.target;
        assetName = src.parentNode.getElementsByClassName("asset_name")[0].innerHTML;
    }
    var assetInfo = getAssetInfo(assetName);
    assign ? assignAsset(assetName, assetInfo, currentUserName, null) :
        unassignAsset(assetName, assetInfo, currentUserName, null);
}

function getAssetInfo(assetName) {
    for (var i = 0; i < assetList.length; i++) {
        if (assetList[i].name == assetName) return assetList[i];
    }
}
const monthNames = ["jan", "feb", "mar", "apr", "may", "june",
    "july", "aug", "sept", "oct", "nov", "dec"
];

function getPrettyDate(dateTime) {
    var date = new Date();
    date.setTime(dateTime);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var dayNumber = date.getDate();
    if (hours < 10) hours = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;
    if (dayNumber < 10) dayNumber = "0" + dayNumber;
    return hours + ":" + minutes + " " + dayNumber + ". " + monthNames[date.getMonth()] + " " + date.getFullYear()
}
