let currentDate = new Date();
currentDate.setHours(0, 0, 0, 0); // Set currentDate to the start of the current day

    let goalsDB;
    let activityDB;
    let logsDB;

    const goalsList = document.querySelector(".goallist");

    initGoalsDB(); 

    function initGoalsDB() {
        console.log("yeah it woz run");
            console.log("yeah it woz run");
            var requestlog = indexedDB.open("GoalsLog", 3);
        requestlog.onupgradeneeded = function (e) {
            goalsDB = e.target.result;
            if (!goalsDB.objectStoreNames.contains("goals")) {
                goalsDB.createObjectStore("goals", { keyPath: "id", autoIncrement: true });
            }
        };
    
        requestlog.onsuccess = function (e) {
            goalsDB = e.target.result;
            console.log("goalsDB opened successfully");
            loadgoals();
        };
    
        requestlog.onerror = function (e) {
            console.error("Error opening ActivityLogDB:", e);
        };
    };


    initDB();

    function initDB() {
        var request = indexedDB.open("ActivityLog", 3);
    
        request.onupgradeneeded = function (e) {
            activityDB = e.target.result;
            if (!db.objectStoreNames.contains("activities")) {
                activityDB.createObjectStore("activities", { keyPath: "name" });
            }
        };
        request.onsuccess = function (e) {
            activityDB = e.target.result; 
            console.log("Activity DB opened successfully");
    
            const tx = activityDB.transaction("activities", "readonly");
            const store = tx.objectStore("activities");
            const getAllRequest = store.getAll();
    
            getAllRequest.onsuccess = function (event) {
                const activities = event.target.result; 
                if (Array.isArray(activities)) { 
                    populateActivityOptions(activities);
                } else {
                    console.error("Retrieved activities is not an array:", activities);
                }
            };
            getAllRequest.onerror = function (event) {
                console.error("Error fetching activities:", event.target.error);
            };
        };
        request.onerror = function (e) {
            console.error("Error opening ActivityLog:", e);
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
    

    function addItem(goalName, frequency, activity, hours) {
        console.error(hours)
        if (!goalsDB) {
            console.error("Database not initialized yet!");
            return;
        }
    
        if (!goalsDB.objectStoreNames.contains("goals")) {
            console.error("Object store 'goals' not found2.");
            return;
        }
        const tx = goalsDB.transaction("goals", "readwrite");
        const store = tx.objectStore("goals");
    
      
        const goal = {
            name: goalName,
            activity: activity,
            frequency: frequency, 
            hours: hours, 
            timeSpent: 0
        };
    
        const addRequest = store.add(goal);
        addRequest.onsuccess = () => {
            console.log("Goal added successfully!");
            loadgoals();
        };
    
        addRequest.onerror = (event) => console.error("Error adding goal:", event.target.error);
    }
    
    

    function loadgoals() {
        if (!goalsDB) {
            console.error("Database not initialized.");
            return;
        }
    
        if (!goalsDB.objectStoreNames.contains("goals")) {
            console.error("Object store 'goals' not found.");
            return;
        }
    
        const tx = goalsDB.transaction("goals", "readonly");
        const store = tx.objectStore("goals");
        const request = store.getAll();
        request.onsuccess = function (e) {
            goalsList.innerHTML = ""; 
            const goals = e.target.result;
    
            goals.forEach(goal => {
                const div = document.createElement("div");
                div.classList.add("goals-item");
   
                div.innerHTML = `
                    <strong>${goal.name} (${goal.activity})</strong>
                    <p><em>Type: ${goal.frequency}</em></p> <!-- Display goal frequency here -->
                    <p id="goal-status-${goal.id}">Checking progress...</p> 
                `;
    
                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "Delete";
                deleteBtn.classList.add("delete"); //Delete class for styling
                deleteBtn.onclick = () => removegoals(goal.id);
                div.appendChild(deleteBtn);
             
                goalsList.appendChild(div);
                checkGoalStatus(goal); 
            });
        };
    }
    
    function removegoals(goalId) {
        if (!goalsDB) {
            console.error("Database not initialized. Cannot delete goal.");
            return;
        }
    
        if (!goalsDB.objectStoreNames.contains("goals")) {
            console.error("Object store 'goals' not found4.");
            return;
        }
        const tx = goalsDB.transaction("goals", "readwrite");
        const store = tx.objectStore("goals");
        const deleteRequest = store.delete(goalId);
    
        deleteRequest.onsuccess = () => {
            console.log(`Goal ${goalId} deleted successfully!`);
            loadgoals();
        };
    
        deleteRequest.onerror = (event) => {
            console.error("Error deleting goal:", event.target.error);
        };
    }
    

    

    function startgoals() {
        const goalName = document.getElementById("goalname").value;
        const activity = document.getElementById("activityDropdown").value;
        const hours = parseFloat(document.getElementById("hours").value);

        let frequency;
        const frequencyOptions = document.getElementsByName("Frequency");
        for (const option of frequencyOptions) {
            if (option.checked) {
                frequency = option.value;
                break;
            }
        }

        if (!goalName || !activity || !frequency || !hours) {
            alert("Please fill in all fields before submitting.");
            return;
        }
        const maxHours = {
            "Daily": 24,
            "Weekly": 168,
            "Yearly": 8760
        };

        if (hours > maxHours[frequency]) {
            alert(`The maximum allowed hours for ${frequency} goals is ${maxHours[frequency]} hours.`);
            return;
        }
        addItem(goalName, frequency, activity, hours);
    
        clearInputs();
        closeAllPopups();
    }
    
    function checkGoalStatus(goal) {
        let startDate, endDate;
        const focusDate = currentDate.toDateString();
        const focusDateObj = new Date(focusDate);
    
        //Determine time range based on goal frequency
        if (goal.frequency === "Weekly") {
            let dayOfWeek = currentDate.getDay(); //0 = Sunday, 1 = Monday, ..., 6 = Saturday
            startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - dayOfWeek + 1); // Monday of this week
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6); //Sunday of this week
            startDate.setHours(0, 0, 0, 0); //Start at midnight
            endDate.setHours(23, 59, 59, 999);
        } else if (goal.frequency === "Daily") {
            startDate = new Date(currentDate);
            endDate = new Date(currentDate);
            endDate.setHours(23, 59, 59, 999); 
        } else if (goal.frequency === "Yearly") {
            startDate = new Date(currentDate.getFullYear(), 0, 1); //Jan 1st of the current year
            endDate = new Date(currentDate.getFullYear(), 11, 31); //Dec 31st of the current year
            startDate.setHours(0, 0, 0, 0); //Start at midnight
            endDate.setHours(23, 59, 59, 999);
        } else {
            console.warn(`Unknown goal mode: ${goal.mode}`);//debugging log
            return;
        }
    
        let request = indexedDB.open("ActivityLogDB", 2);
    
        request.onsuccess = function (event) {
            let logDB = event.target.result;
            let trans = logDB.transaction(["activitySessions"], "readonly");
            let store = trans.objectStore("activitySessions");
            let cursorRequest = store.openCursor();
            let totalLoggedHours = 0;
    
            cursorRequest.onsuccess = function (e) {
                let cursor = e.target.result;
                if (cursor) {
                    
                    let log = cursor.value;
                    let logStartTime = new Date(log.startTime);  //Convert startTime to Date object
                    let logEndTime = new Date(log.endTime);      //Convert endTime to Date object
    
                    console.log(`Checking log for activity: ${log.activityName} against goal: ${goal.activity}`);
                    console.log("Log start time:", logStartTime, "End time:", logEndTime);
                    console.log("Log date range: ", logStartTime, logEndTime);
                    console.log("Goal date range: ", startDate, endDate);
    
                    //Check if the log is for the correct activity and within the timeframe
                    if (log.activityName === goal.activity && (
                        (logStartTime >= startDate && logEndTime <= endDate) ||
                        (logStartTime.toDateString() === focusDate) ||
                        (logEndTime.toDateString() === focusDate) ||
                        (logStartTime < focusDateObj && logEndTime > focusDateObj)
                    )) {
                        console.log("Log matched activity and date range:", logStartTime, logEndTime);
    
                        const actualStart = logStartTime < startDate ? startDate : logStartTime;
                        const actualEnd = logEndTime > endDate ? endDate : logEndTime;
    
                        // Convert the time to hours
                        let loggedHours = (actualEnd - actualStart) / (1000 * 60 * 60);  // Convert milliseconds to hours
    
                        console.log("Logged hours for this session: ", loggedHours);
    
                        // Add logged hours to the total
                        totalLoggedHours += loggedHours;
    
                        console.log("Total logged hours so far: " + totalLoggedHours);
                        console.log("testttttt!"+totalLoggedHours)
    
                        let hours = Math.floor(totalLoggedHours); 
                        let minutes = Math.round((totalLoggedHours - hours) * 60); 
    
                        let formattedLoggedTime = `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
                        console.log("Formatted logged time:", formattedLoggedTime);
                    }
    
                    cursor.continue();
                } else {
                    let statusText = totalLoggedHours >= goal.hours 
                        ? `Achieved ✅ (${totalLoggedHours.toFixed(2)} / ${goal.hours} hrs)` //Emoji display does not work on chrome browser but works on iOS
                        : `In Progress ⏳ (${totalLoggedHours.toFixed(2)} / ${goal.hours} hrs)`;
    
                    const statusElement = document.getElementById(`goal-status-${goal.id}`);
                    if (statusElement) {
                        statusElement.textContent = statusText;
                    } else {
                        console.warn(`No status element found for goal ${goal.id}`);
                    }
    
                    console.log("Final status:", statusText);
                }
            };
    
            cursorRequest.onerror = function () {
                console.error("Error opening cursor for activity logs");
            };
        };
    
        request.onerror = function () {
            console.error("Error opening ActivityLogDB for logs");
        };
    }
    
    


    function populateActivityOptions(activities) {
        var dropdown = document.getElementById("activityDropdown");
        if (!dropdown) {
            console.error("Dropdown element not found!");
            return;
        }
        
        dropdown.innerHTML = '<option value="" disabled selected>Select an activity</option>'; // Reset options

        activities.forEach(activity => {
            var option = document.createElement("option");
            option.value = activity.name;
            option.textContent = activity.name;
            dropdown.appendChild(option);
        });

        console.log("Dropdown populated with activities:", activities);
    }



    function decrementDate() {
        currentDate.setDate(currentDate.getDate() - 1);
        console.log(currentDate)
        loadgoals();
        updateDateDisplay();
    }

    function incrementDate() {
        currentDate.setDate(currentDate.getDate() + 1);
        console.log(currentDate)
        loadgoals();
        updateDateDisplay();
    }
    window.startgoals = startgoals;
    window.incrementDate = incrementDate;
    window.decrementDate = decrementDate;


function revealpopup(){
    document.getElementById("goalpopup").style.visibility = "visible";
}

function closeAllPopups() {
    document.getElementById("goalpopup").style.visibility = "hidden";
};

function clearInputs() {
    document.getElementById("goalname").value = "";
    document.getElementById("hours").value = "";
    document.getElementById("activityDropdown").selectedIndex = 0; 
    const frequencyOptions = document.getElementsByName("Frequency");
    for (const option of frequencyOptions) {
        option.checked = false; 
    }
}

const maxFontSize = 70; 
const minFontSize = 30; 

function incrementText() {

    const currentSize = parseInt(window.getComputedStyle(goalsList).fontSize);
    if (currentSize < maxFontSize) {
        goalsList.style.fontSize = (currentSize + 10) + "px";
    }

}
function decrementText() {
    const currentSize = parseInt(window.getComputedStyle(goalsList).fontSize);
    if (currentSize > minFontSize) {
        goalsList.style.fontSize = (currentSize - 10) + "px";
    }
}