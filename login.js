let logindb;

const request = indexedDB.open("UsersDB", 1);


request.onupgradeneeded = function(event) {
    logindb = event.target.result;
    if (!logindb.objectStoreNames.contains('user')) {
        logindb.createObjectStore('user', { keyPath: 'id', autoIncrement: true });
    }
};

request.onsuccess = function(event) {
    logindb = event.target.result;
    checkForUser();
};

request.onerror = function(event) {
    console.error("IndexedDB error:", event.target.errorCode);
};


function checkForUser() {
    const transaction = logindb.transaction(["user"], "readonly");
    const store = transaction.objectStore("user");
    const request = store.getAll();
    request.onsuccess = function() {
        if (request.result.length > 0) {
            document.getElementById("login").style.visibility = "visible";
            document.getElementById("createlogin").style.visibility = "hidden";
        } else {
            document.getElementById("createlogin").style.visibility = "visible";
            document.getElementById("login").style.visibility = "hidden";
        }
    };

    request.onerror = function() {
        console.error("Error checking for users:", request.error);
    };
}


function AttemptLogin() {
    const logpassword = document.getElementById('loginpassword').value; //Get username from input
    if (!logpassword) {
        alert("Please enter password and confirm it.login");
        return;
    }

    const transaction = logindb.transaction(["user"], "readonly");
    const store = transaction.objectStore("user");
    console.log(store)
    const request = store.get(1);
    console.log(request)

    request.onsuccess = function() {
        const user = request.result;
        if (user.password === logpassword) {
            alert("Login successful!");
            window.location.href = 'button.html';
        } else {
            alert("Invalid username or password.");
        }
    };

    request.onerror = function() {
        console.error("Error during login.");
    };
}


function CreateAccount() {
    const inputpassword = document.getElementById('idpassword').value;
    const confirmpassword = document.getElementById('conpasswordfirm').value;

    if (!inputpassword || !confirmpassword) {
        alert("Please enter a password and confirm it.");
        return;
    }
    if (inputpassword !== confirmpassword) {
        alert("Passwords do not match. Please try again.");
        return;
    }
    const transaction = logindb.transaction(["user"], "readwrite");
    const store = transaction.objectStore("user");

    const request = store.add({ password: inputpassword });

    request.onsuccess = function() {
        alert("Account created successfully!");
        window.location.href = 'button.html';
    };
    request.onerror = function() {
        alert("Error creating account. Please try again.");
    };

}


