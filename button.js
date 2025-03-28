var startTime; 
var elapsedPausedTime = 0;
var stopwatchInterval = null; 
var currentActivity = "";
var isPaused = false;
var workMode = null;
let stepCount = 0;
let totalTime = 0; 
let pausestep = false; 

var goalDB; // IndexedDB database
var db, logDB, scheduleDB, deadlineDB;
var statedb;

function initDB() {
    var request = indexedDB.open("ButtonState", 1);

    request.onupgradeneeded = function (e) {
        statedb = e.target.result;
        if (!statedb.objectStoreNames.contains("activities")) {
            statedb.createObjectStore("state", { keyPath: "name" });
        }
    };

    request.onsuccess = function (e) {
        statedb = e.target.result;
        console.log("Database opened successfully");

        loadButtonState();
    };

    request.onerror = function (e) {
        console.error("Error opening StateDB:", e);
    };

    var requestlog = indexedDB.open("ActivityLogDB", 2);
    requestlog.onupgradeneeded = function (e) {
        logDB = e.target.result;
        if (!logDB.objectStoreNames.contains("activitySessions")) {
            logDB.createObjectStore("activitySessions", { keyPath: "id", autoIncrement: true });
        }
    };
    requestlog.onsuccess = function (e) {
        logDB = e.target.result;
        console.log("ActivityLogDB opened successfully");
    };
    requestlog.onerror = function (e) {
        console.error("Error opening ActivityLogDB:", e);
    };

    var request = indexedDB.open("ActivityLog", 3);

    request.onupgradeneeded = function (e) {
        db = e.target.result;
        if (!db.objectStoreNames.contains("activities")) {
            db.createObjectStore("activities", { keyPath: "name" });
        }
    };

    request.onsuccess = function (e) {
        db = e.target.result;
        console.log("Database opened successfully");

        const tx = db.transaction("activities", "readwrite");
        const store = tx.objectStore("activities");
        const getRequest = store.get("Walk");
        console.log
        getRequest.onsuccess = function() {
            if (!getRequest.result) {
               
                const addRequest = store.add({ 
                    name: "Walk",   
                    timeSpent: 0, 
                    mode: "Life"  
                });
    
                addRequest.onsuccess = () => {
                    console.log("Activity 'Walk' added successfully!");
                };
    
                addRequest.onerror = function(event) {
                    console.error("Error adding 'Walk' activity:", event.target.error);
                };
            } else {
                console.log("'Walk' activity already exists!");
            }
        };

        getRequest.onerror = function(event) {
            console.error("Error checking 'Walk' activity:", event.target.error);
        };
        loadActivities(); 
    };

    request.onerror = function (e) {
        console.error("Error opening IndexedDB:", e);
    };

    var requestlog = indexedDB.open("ActivityLogDB", 2);
    requestlog.onupgradeneeded = function (e) {
        logDB = e.target.result;
        if (!logDB.objectStoreNames.contains("activitySessions")) {
            logDB.createObjectStore("activitySessions", { keyPath: "id", autoIncrement: true });
        }
    };
    requestlog.onsuccess = function (e) {
        logDB = e.target.result;
        console.log("ActivityLogDB opened successfully");
    };
    requestlog.onerror = function (e) {
        console.error("Error opening ActivityLogDB:", e);
    };

    var requestlog = indexedDB.open("ScheduleLogDB", 1);

    requestlog.onupgradeneeded = function (e) {
        scheduleDB = e.target.result;
        if (!scheduleDB.objectStoreNames.contains("schedules")) {
          scheduleDB.createObjectStore("schedules", { keyPath: "id", autoIncrement: true });
        }
    };

    requestlog.onsuccess = function (e) {
      scheduleDB = e.target.result;
        console.log("scheduleDB opened successfully");
        schedcheck();
        
    };

    requestlog.onerror = function (e) {
        console.error("Error opening scheduleDB:", e);
    };

    var requestlog = indexedDB.open("GoalsLog", 3);

    requestlog.onupgradeneeded = function (e) {
        goalDB = e.target.result;
        if (!goalDB.objectStoreNames.contains("goals")) {
            goalDB.createObjectStore("goals", { keyPath: "id", autoIncrement: true });
        }
    };

    requestlog.onsuccess = function (e) {
        goalDB = e.target.result;
        console.log("goalDB opened successfully");
     
    };

    requestlog.onerror = function (e) {
        console.error("Error opening goals:", e);
    };

    var requestlog = indexedDB.open("DeadlineLogDB", 1);

    requestlog.onupgradeneeded = function (e) {
      deadlineDB = e.target.result;
        if (!deadlineDB.objectStoreNames.contains("deadlines")) {
          deadlineDB.createObjectStore("deadlines", { keyPath: "id", autoIncrement: true });
        }
    };

    requestlog.onsuccess = function (e) {
        deadlineDB = e.target.result;
        console.log("Deadline opened successfully");
        
       
    };

    requestlog.onerror = function (e) {
        console.error("Error opening ActivityLogDB:", e);
    };
}


function populateActivityOptions(activities) {
    var dropdown = document.getElementById("activityDropdown");
    dropdown.innerHTML = '<option value="" disabled selected>Select an activity</option>'; // Reset options

    activities.forEach(activity => {
        var option = document.createElement("option");
        option.value = activity.name;
        option.textContent = activity.name;
        dropdown.appendChild(option);
    });

    console.log("Dropdown populated with activities:", activities);
}


function stopwclick() {
    var popup = document.getElementById("myPopup");

    
    if (!stopwatchInterval && !isPaused) {
        // Show popup when starting a new activity
        popup.classList.add("show");
        recommendActivities();
        
    } else {
        // If timer is running, pause it and show popup again
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
        elapsedPausedTime = new Date().getTime() - startTime;
        endActivity();
        popup.classList.add("show");          

    console.log("Timer stopped");
        
    }
}


function startActivity() {
    var selectedActivity = document.getElementById("activityDropdown").value;

    if (!selectedActivity) {
        alert("Please select an activity!");
        return;
    }
    if (selectedActivity== "Walk"){
        requestPermission();
    }
        currentActivity = selectedActivity;
        document.getElementById("myActivity").innerText = `${currentActivity}`;
        document.getElementById("myPopup").classList.remove("show");
    
        startTime = new Date().getTime();
        elapsedPausedTime = 0;
        stopwatchInterval = setInterval(updateStopwatch, 1000);
        isPaused = false;
        const state = {
            name: "timerState",             
            currentActivity: currentActivity,  
            startTime: startTime,           
            isActive: true                 
        };

        saveButtonState(state);             

        console.log("Timer started for activity:", currentActivity);
}

function saveButtonState(state) {
    
    const transaction = statedb.transaction("state", "readwrite");

   
    const store = transaction.objectStore("state");

   
    const putRequest = store.put(state);  //'put' will insert or update the entry


    putRequest.onsuccess = function() {
        console.log("Button state saved successfully.");
    };

    putRequest.onerror = function() {
        console.error("Error saving button state.");
    };
}

function loadButtonState() {
    const transaction = statedb.transaction("state", "readonly");
    const store = transaction.objectStore("state");

    const getRequest = store.get("timerState");

    getRequest.onsuccess = function (e) {
        const state = e.target.result;
        if (state) {
         
            console.log("Loaded button state:", state);

           
            if (state.isActive) {
                currentActivity = state.currentActivity;
                startTime = state.startTime;
                elapsedPausedTime = 0;
                stopwatchInterval = setInterval(updateStopwatch, 1000);
                isPaused = false;
                document.getElementById("myActivity").innerText = `${currentActivity}`;
            } else {          
                console.log("Timer is not active");
            }
        } else {
            console.log("No saved state found, initializing default state.");
            saveButtonState({
                name: "timerState",
                currentActivity: "",
                startTime: null,
                isActive: false
            });
        }
    };

    getRequest.onerror = function () {
        console.error("Error loading button state");
    };
}

    function endActivity() {
        if (!currentActivity || !startTime) {
            alert("No activity is currently running.");
            return;
        }
    
        saveSessionToLogDB();
    
        currentActivity = "";  
        startTime = null;     
        elapsedPausedTime = 0;
        isPaused = false;     
    
        if (stopwatchInterval) {
            clearInterval(stopwatchInterval);
            stopwatchInterval = null;
        }
        document.getElementById("myActivity").innerText = "";  //Update activity display
        document.getElementById("time").innerText = "00:00:00";
        document.getElementById("pawsbutton").innerText = "Pause";  //Reset the pause/resume button
    
        const state = {
            name: "timerState",          
            currentActivity: "",       
            startTime: null,            
            isActive: false             
        };
    
        saveButtonState(state);  
        console.log("Activity ended and session saved.");
    }
    


function updateStopwatch() {
    var currentTime = new Date().getTime();
    var elapsedTime = currentTime - startTime;
    var seconds = Math.floor(elapsedTime / 1000) % 60;
    var minutes = Math.floor(elapsedTime / 1000 / 60) % 60;
    var hours = Math.floor(elapsedTime / 1000 / 60 / 60);

    document.getElementById("time").innerHTML = pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
}

var permitted;
function requestPermission() {
    if (window.DeviceMotionEvent) {
      console.log('DeviceMotionEvent is supported');

    } else {
      console.error('DeviceMotionEvent not supported on this device');
      
      return;
    }
  
    if (permitted !== 'granted'){
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then((response) => {
          if (response === 'granted') {
            console.log('Permission granted');
            startMotionTracking();
            permitted='granted'
    
          } else {
            console.error('Permission denied');
            
          }
        })
        .catch((error) => {
          console.error('Permission request error:', error);
        
        });
    } else {
      console.log('requestPermission not required or supported on this browser');


      startMotionTracking();
    }
}
  }
  
  function startMotionTracking() {
    console.log('Starting motion tracking...');
    document.getElementById("stepcount").style.visibility = "visible";

    window.addEventListener('devicemotion', (event) => {
      const { acceleration } = event;
  
      if (acceleration) {
        const magnitude = Math.sqrt(
          Math.pow(acceleration.x || 0, 2) +
          Math.pow(acceleration.y || 0, 2) +
          Math.pow(acceleration.z || 0, 2)
        );
  
        
        if (magnitude > 8 && !pausestep) {
            stepCount++;
            pausestep = true;      
            setTimeout(() => {
              document.getElementById("stepview").innerText = `Steps: ${stepCount}`;
                pausestep = false;
            }, 500);
        }
        
          
      }
    });
  
    console.log('Motion tracking started');
  }

  
function saveSessionToLogDB() {
    if (!currentActivity || !startTime) return;
    var endTime = new Date().getTime();
    var sessionData = {
        activityName: currentActivity,
        startTime: startTime,
        endTime: endTime
    };

    var tx = logDB.transaction("activitySessions", "readwrite");
    var store = tx.objectStore("activitySessions");
    store.add(sessionData);
}

function pad(number) {
    return (number < 10 ? "0" : "") + number;
}

function loadActivities() {
    var tx = db.transaction("activities", "readonly");
    var store = tx.objectStore("activities");
    var request = store.getAll();

    request.onsuccess = function () {
        console.log("Loaded activities:", request.result); 
        populateActivityOptions(request.result); 
    };

    request.onerror = function () {
        console.error("Failed to load activities.");
    };
}

function schedcheck() {
    const currentTime = new Date();
    const tx = scheduleDB.transaction("schedules", "readonly");
    const store = tx.objectStore("schedules");
    const request = store.getAll();

    request.onsuccess = function () {
        const schedules = request.result;
        const matchingSchedule = schedules.find(schedule =>
            new Date(schedule.startDate) <= currentTime &&
            new Date(schedule.endDate) >= currentTime
        );

        if (matchingSchedule) {
            console.log("Matching schedule found!");

            let startTime = new Date(matchingSchedule.startDate);
            let endTime = new Date(matchingSchedule.endDate);

            let formattedStartTime = startTime.getHours() + ":" + 
                (startTime.getMinutes() < 10 ? "0" : "") + startTime.getMinutes();
            let formattedEndTime = endTime.getHours() + ":" + 
                (endTime.getMinutes() < 10 ? "0" : "") + endTime.getMinutes();

            document.getElementById("alert").innerText = matchingSchedule.scheduleActivity;
            document.getElementById("schedulealert").style.visibility = "visible";
            document.getElementById("stime").innerText = `${formattedStartTime} to ${formattedEndTime}`;
        } else {
            console.log("No matching schedule found.");
        }
    };
}


function pausetimer() {

    if (!currentActivity || !startTime) {
        requestPermission();
    }
    else{
    if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
        elapsedPausedTime = new Date().getTime() - startTime;
        document.getElementById("pawsbutton").innerText = "Resume";
        isPaused = true;
    } else if (isPaused) {
        startTime = new Date().getTime() - elapsedPausedTime;
        stopwatchInterval = setInterval(updateStopwatch, 1000);
        document.getElementById("pawsbutton").innerText = "Pause";
        isPaused = false;
    }
}
}



function recommendActivities() {
    const activitiesPromise = new Promise((resolve, reject) => {
        const tx = db.transaction("activities", "readonly");
        const store = tx.objectStore("activities");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to load activities.");
    });

    const deadlinesPromise = new Promise((resolve, reject) => {
        const tx = deadlineDB.transaction("deadlines", "readonly");
        const store = tx.objectStore("deadlines");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to load deadlines.");
    });

    const goalsPromise = new Promise((resolve, reject) => {
        const tx = goalDB.transaction("goals", "readonly");
        const store = tx.objectStore("goals");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to load goals.");
    });

    Promise.all([activitiesPromise, deadlinesPromise, goalsPromise])
        .then(([activities, deadlines, goals]) => {
            const recommendations = activities.map(activity => {
                const activityDeadlines = deadlines.filter(d => d.deadlineActivity === activity.name);
                const activityGoals = goals.filter(g => g.activity === activity.name);
                const currentDate = new Date();

                let totalurgencyScore = 0;
                let totalGoalScore = 0;

                //Calculate urgency score for all deadlines of the activity
                activityDeadlines.forEach(deadline => {
                    const deadlineDate = new Date(deadline.deadlineDate);

                    if (deadlineDate >= currentDate) { //Check for future or today's deadline

                    const deadlineHours = Number(deadline.deadlineHours);
                    const timeRemaining = Number((new Date(deadline.deadlineDate) - Date.now()) / (1000 * 60 * 60)); // Ensure numeric timeRemaining

                    const urgencyScore = Number(Math.max(0, deadlineHours - timeRemaining) + deadlineHours);
                    //Urgency score based on the remaining time and total required hours
                    console.log("Urgency Score for deadline:", urgencyScore); //Debugging log
                    totalurgencyScore += urgencyScore;


}

                });

                //Calculate goal completion score for all goals
                activityGoals.forEach(goal => {
                    const frequency = goal.frequency;

                    //Calculate a weight for the goal based on how soon it is due (shorter time = higher weight)
                    let goalWeight = 1; //weight for yearly
                    if (frequency == "daily") {
                        goalWeight = 5; //less than 1 day remaining
                    } else if (frequency == "weekly") {
                        goalWeight = 2; //less than 1 week remaining
                    } 

                    const goalScore = Math.max(0, goal.hours) * goalWeight; // Goal score multiplied by weight
                    totalGoalScore += goalScore; // Sum the goal scores
                    console.log("Goal Score for goal:", goalScore); // Debugging
                });

                //Combine the urgency score and goal score
                const totalScore = totalurgencyScore + totalGoalScore;

                return {
                    activity: activity.name,
                    score: totalScore,
                    mode: activity.mode,
                };
            });

           
            recommendations.sort((a, b) => b.score - a.score);

            const recommendationsContainer = document.getElementById("Recommended");
            
            //Clear any previous recommendations
            recommendationsContainer.innerHTML = "";

            // Show the top 3 recommended activities
            recommendations.slice(0, 3).forEach(rec => {
                const activityDiv = document.createElement("div");
                activityDiv.className = "recommended-activity";
                const modeLabel = rec.mode === "Work" ? "Work" : "Life";
                activityDiv.innerHTML = `<p><strong>${rec.activity}</strong> - <span>${modeLabel}</span></p>`;
                recommendationsContainer.appendChild(activityDiv);
            });

            console.log("Top 3 recommendations based on urgency and goals:", recommendations.slice(0, 3));
        })
        .catch(error => console.error(error));
}


function Closepopup() {
    document.getElementById("myPopup").classList.remove("show");
    document.getElementById("stepcount").style.visibility = "hidden";
    document.getElementById("schedulealert").style.visibility = "hidden";
}

window.onload = function () {
    initDB(); 
    setInterval(schedcheck, 60000);
};
