let currentDate = new Date();


    let db;
    let logsDB;

    const activityList = document.querySelector(".activitylist");

    initDB();

    function initDB(){
    const request = indexedDB.open("ActivityLog", 3);

    request.onupgradeneeded = function (e) {
        db = e.target.result;
        console.log("Running onupgradeneeded");

        if (!db.objectStoreNames.contains("activities")) {
            db.createObjectStore("activities", { keyPath: "name" }); 
            store.createIndex("timeSpent", "timeSpent", { unique: false }); // Index for timeSpent
            // Store only name
        }
    };

    request.onsuccess = function (e) {
        console.log("Running onsuccess");
        db = e.target.result;
        loadActivities(); // Load previous activities
    };

    request.onerror = function (e) {
        console.error("onerror! Database error:", e.target.error);
    };

    var requestlog = indexedDB.open("ActivityLogDB", 2);
    
        requestlog.onupgradeneeded = function (e) {
            logsDB = e.target.result;
            if (!logsDB.objectStoreNames.contains("activitySessions")) {
                logsDB.createObjectStore("activitySessions", { keyPath: "id", autoIncrement: true });
            }
        };
    
        requestlog.onsuccess = function (e) {
            logsDB = e.target.result;
            console.log("ActivityLogDB opened successfully");
        };
    
        requestlog.onerror = function (e) {
            console.error("Error opening ActivityLogDB:", e);
        };
    }

    function addItem(activityName,modeName) {
        if (!db) {
            console.error("Database not initialized yet!");
            return;
        }

        if (!activityName) {
            console.error("No activity name provided!");
            return;
        }

        const tx = db.transaction("activities", "readonly");
        const store = tx.objectStore("activities");
        const getRequest = store.get(activityName); // Check if activity already exists

        getRequest.onsuccess = function () {
            if (getRequest.result) {
                alert("Activity already exists!");
                return;
            }

            // Proceed to add if activity does not exist
            const writeTx = db.transaction("activities", "readwrite");
            const writeStore = writeTx.objectStore("activities");
            const addRequest = writeStore.add({ name: activityName, timeSpent: 0, mode: modeName});

            addRequest.onsuccess = () => {
                console.log("Activity added successfully!");
                loadActivities(); // Refresh the list
            };

            addRequest.onerror = (event) => console.error("Error adding activity:", event.target.error);
        };

        getRequest.onerror = (event) => console.error("Error checking activity:", event.target.error);
    }

    function loadActivities() {
        if (!db) return;
    
        const tx = db.transaction("activities", "readonly");
        const store = tx.objectStore("activities");
        const request = store.getAll();
    
        // Initialize counters for work and life time
        let totalWorkTime = 0;
        let totalLifeTime = 0;
    
        request.onsuccess = function (e) {
            activityList.innerHTML = ""; // Clear the list before adding new items
    
            // Insert the total time tally as the first (top) item
            const tallyDiv = document.createElement("div");
            tallyDiv.classList.add("activity-item", "tally-item"); // Add a specific class for styling
            tallyDiv.innerHTML = "No Activities Created!"; // Placeholder while tally is being calculated
            activityList.appendChild(tallyDiv); // Insert it at the top
    
            const activities = e.target.result;
    
            activities.forEach(activity => {
                const div = document.createElement("div");
                div.classList.add("activity-item");
    
                // Fetch logs for the current activity
                getActivityLogs(activity.name, function (totalTime) {
                    const formattedTime = formatTime(totalTime);
                    div.textContent = `${activity.name} (${activity.mode}) - Time Spent: ${formattedTime}`;
    
                    // Tally time based on activity mode
                    if (activity.mode === "Work") {
                        totalWorkTime += totalTime; // Add to work time
                    } else if (activity.mode === "Life") {
                        totalLifeTime += totalTime; // Add to life time
                    }
    
                    // Add delete button
                    const deleteBtn = document.createElement("button");
                    deleteBtn.textContent = "Delete";
                    deleteBtn.classList.add("delete"); // Add class to the button
                    deleteBtn.onclick = () => {
                        // Show confirmation dialog
                        const isConfirmed = confirm(`Are you sure you want to delete the activity "${activity.name}"?`);
                        if (isConfirmed) {
                            removeActivity(activity.name); // Proceed to remove activity if confirmed
                        }
                    };
                    div.appendChild(deleteBtn);
    
                    activityList.appendChild(div);
    
                    // Once all activities are processed, update the tally
                    updateTally(tallyDiv, totalWorkTime, totalLifeTime);
                });
            });
        };
    
        request.onerror = function (e) {
            console.error("Error loading activities:", e.target.error);
        };
    }
    
    // Function to update the tally at the top of the activity list
    function updateTally(tallyDiv, totalWorkTime, totalLifeTime) {
        // Calculate formatted time for work and life
        const formattedWorkTime = formatTime(totalWorkTime);
        const formattedLifeTime = formatTime(totalLifeTime);
    
        // Display the tally
        tallyDiv.innerHTML = `
            <strong>Total Time</strong> <br>
            <span>Total Work Time: ${formattedWorkTime}</span><br>
            <span>Total Life Time: ${formattedLifeTime}</span>
        `;
    }

    function formatTime(milliseconds) {
        let totalSeconds = Math.floor(milliseconds / 1000);
        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        let seconds = totalSeconds % 60;

        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    function pad(number) {
        return number < 10 ? "0" + number : number;
    }

    function removeActivity(activityName) {
        const tx = db.transaction("activities", "readwrite");
        const store = tx.objectStore("activities");
        const deleteRequest = store.delete(activityName);

        deleteRequest.onsuccess = () => {
            console.log("Activity deleted successfully!");
            loadActivities(); // Refresh the list
        };

        deleteRequest.onerror = (event) => console.error("Error deleting activity:", event.target.error);
    }

    function getActivityLogs(activityName, callback) {
        const tx = logsDB.transaction("activitySessions", "readonly");
        const store = tx.objectStore("activitySessions");
        const request = store.getAll(); // Get all logs
       

        request.onsuccess = function (e) {
            const logs = e.target.result;
            const focusDate = currentDate.toDateString();
            let totalTime = 0;

            // Loop through the logs and calculate total time for the matching activity on the current date
            logs.forEach(log => {
                if (log.activityName === activityName) {
                    const logDate = new Date(log.startTime).toDateString();
                    if (logDate === focusDate) {
                        totalTime += log.endTime - log.startTime;
                    }
                }
            });

            callback(totalTime);
        };

        request.onerror = function (e) {
            console.error("Error fetching activity logs:", e.target.error);
            callback(0); // Default to 0 if an error occurs
        };
    }

    
    

    function StartActivity() {
        const newActivity = document.getElementById('goalname').value;
        const modeElements = document.getElementsByName('Mode');
        let selectedMode = "";
    
        // Get selected radio button value
        for (let i = 0; i < modeElements.length; i++) {
          if (modeElements[i].checked) {
            selectedMode = modeElements[i].value;
            break;
          }
        }
    
        if (!newActivity) {
          alert("Please enter a goal name.");
          return;
        }
        if (!selectedMode) {
          alert("Please select a mode.");
          return;
        }
    
        addItem(newActivity, selectedMode);
        closeAllPopups();
    }

    updateDateDisplay();

    function updateDateDisplay() {
        const today = new Date();
    
    // Compare dates using toDateString() to ensure accurate comparison
        if (currentDate.toDateString() === today.toDateString()) {
        document.getElementById("date").textContent = "Today" ;
        } else {
        document.getElementById("date").textContent = currentDate.toDateString();
        }
    }

    function decrementDate() {
        currentDate.setDate(currentDate.getDate() - 1);
        console.log(currentDate)
        loadActivities();
        updateDateDisplay();
    }

    function incrementDate() {
        currentDate.setDate(currentDate.getDate() + 1);
        console.log(currentDate)
        loadActivities();
        updateDateDisplay();
        showNotification('Hello!', 'This is a sample notification.');
    }

    requestNotificationPermission();
    function requestNotificationPermission() {
        if (Notification.permission === "default") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    console.log("Notification permission granted!");
                    showNotification('Hello!', 'This is a sample notification.');
                } else if (permission === "denied") {
                    console.log("Notifications are not permitted.");
                }
            });
        } else {
            console.log(`Notification permission is already ${Notification.permission}`);
        }
    }
    

    
    function showNotification(title, body) {
        if (Notification.permission === 'granted') {
            const options = {
                body: body,
                icon: 'logo.png' // Use your app icon
            };
            new Notification(title, options);
        } else if (Notification.permission === "denied") {
            console.log("Notifications are not permitted.");
        } else {
            console.log("Notification permission is not determined.");
        }
    }
    

    // Expose functions globally for button clicks
    window.incrementDate = incrementDate;
    window.decrementDate = decrementDate;
    window.StartActivity = StartActivity;


function revealpopup(){
    document.getElementById("activepopup").style.visibility = "visible";
}

function closeAllPopups() {
    document.getElementById("activepopup").style.visibility = "hidden";
};
