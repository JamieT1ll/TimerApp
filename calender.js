let calendar;
var db, logDB; // IndexedDB database

function initDB() {
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

        // ✅ Load activity sessions after DB is ready
        loadActivitySessions();
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
        loadScheduleSessions();
        // ✅ Load activity sessions after DB is ready
    };

    requestlog.onerror = function (e) {
        console.error("Error opening scheduleDB:", e);
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
        console.log("ActivityLogDB opened successfully");
        loadDeadlineSessions();
        // ✅ Load activity sessions after DB is ready
    };

    requestlog.onerror = function (e) {
        console.error("Error opening ActivityLogDB:", e);
    };


    var request = indexedDB.open("ActivityLog", 3);

    request.onupgradeneeded = function (e) {
        activedb = e.target.result;
        if (!activedb.objectStoreNames.contains("activities")) {
            db.createObjectStore("activities", { keyPath: "name" });
        }
    };

    request.onsuccess = function (e) {
        activedb = e.target.result;
        console.log("Database opened successfully");
        loadActivities(); // Load activities after DB is ready
    };

    request.onerror = function (e) {
        console.error("Error opening IndexedDB:", e);
    };
}

function loadActivities() {
  var tx = activedb.transaction("activities", "readonly");
  var store = tx.objectStore("activities");
  var request = store.getAll();

  request.onsuccess = function () {
      console.log("Loaded activities:", request.result);

      var scheddropdown = document.getElementById("scheddropdown");
      var deaddropdown = document.getElementById("deaddropdown");

      // Reset options
      scheddropdown.innerHTML = '<option value="" disabled selected>Select an activity</option>';
      deaddropdown.innerHTML = '<option value="" disabled selected>Select an activity</option>';
      
      // Populate dropdowns with activities
      var activities = request.result;
      activities.forEach(activity => {
          var option1 = document.createElement("option");
          option1.value = activity.name;
          option1.textContent = activity.name;
          scheddropdown.appendChild(option1);

          var option2 = document.createElement("option");
          option2.value = activity.name;
          option2.textContent = activity.name;
          deaddropdown.appendChild(option2);
      });

      console.log("Dropdowns populated with activities:", activities);
  };

  request.onerror = function () {
      console.error("Failed to load activities.");
  };
}



function loadActivitySessions() {
    if (!logDB) {
        console.error("Database not initialized yet.");
        return;
    }
    var tx = logDB.transaction("activitySessions", "readonly");
    var store = tx.objectStore("activitySessions");
    var request = store.getAll();

    request.onsuccess = function () {
        var sessions = request.result;

        if (calendar) {
            var events = sessions.map(session => ({
                title: session.activityName,
                start: new Date(session.startTime),
                end: new Date(session.endTime),
                allDay: false,
                backgroundColor: 'green' // Customize color if needed
            }));

            calendar.addEventSource(events);
            console.log("yeagh");
        } else {
            console.error("Calendar is not initialized yet!");
        }
    };

    request.onerror = function () {
        console.error("Failed to load activity sessions from ActivityLogDB.");
    };
}

function loadScheduleSessions() {
  if (!scheduleDB) {
      console.error("Database not initialized yet.");
      return;
  }
  var tx = scheduleDB.transaction("schedules", "readonly");
  var store = tx.objectStore("schedules");
  var request = store.getAll();

  request.onsuccess = function () {
      var sessions = request.result;

      if (calendar) {
        var events = sessions.map(session => ({
          title: session.scheduleActivity,
          start: new Date(session.startDate),
          end: new Date(session.endDate),
          allDay: false,
          backgroundColor: 'blue'
        }));
        
        console.log(events)

          calendar.addEventSource(events);
          console.log("yeaghsched");
      } else {
          console.error("Schedules is not initialized yet!");
      }
  };

  request.onerror = function () {
      console.error("Failed to load activity sessions from ActivityLogDB.");
  };
}

function loadDeadlineSessions() {
  if (!deadlineDB) {
    console.error("Database not initialized yet.");
    return;
  }

  const tx = deadlineDB.transaction("deadlines", "readonly");
  const store = tx.objectStore("deadlines");
  const request = store.getAll();

  request.onsuccess = function () {
    const deadlines = request.result;

    if (!deadlines || deadlines.length === 0) {
      console.error("No deadlines found!");
      return;
    }

    deadlines.forEach(deadline => {
      calculateDeadlineProgress(deadline, (totalHours) => {
        if (calendar) {
          const newEvent = {
            title: `${deadline.deadlineActivity}: ${totalHours} / ${deadline.deadlineHours} hours`,
            start: new Date(deadline.deadlineDate),
            allDay: true,
            backgroundColor: 'red'
          };

          calendar.addEvent(newEvent);
          console.log(`Added event for ${deadline.deadlineActivity} with progress.`);
        }
      });
    });
  };

  request.onerror = function () {
    console.error("Failed to load deadlines from DeadlineLogDB.");
  };
}

function calculateDeadlineProgress(deadline, callback) {
  if (!logDB) {
    console.error("ActivityLogDB not initialized.");
    return;
  }

  const tx = logDB.transaction("activitySessions", "readonly");
  const store = tx.objectStore("activitySessions");
  const request = store.getAll();

  request.onsuccess = function () {
    const logs = request.result;
    const creationDate = new Date(deadline.createdDate);
    const deadlineDate = new Date(deadline.deadlineDate);

    const matchingLogs = logs.filter(log =>
      log.activityName === deadline.deadlineActivity &&
      new Date(log.startTime) >= creationDate &&
      new Date(log.startTime) <= deadlineDate
    );

    const totalHours = matchingLogs.reduce((sum, log) => {
      const startTime = new Date(log.startTime);
      const endTime = new Date(log.endTime);
      const hoursSpent = (endTime - startTime) / (1000 * 60 * 60);
      return sum + hoursSpent;
    }, 0);

    console.log(`Progress for ${deadline.deadlineActivity}: ${totalHours} / ${deadline.deadlineHours} hours`);
    callback(totalHours);
  };

  request.onerror = function () {
    console.error("Failed to load activity sessions from ActivityLogDB.");
  };
} 

function addScheduleItem(scheduleActivity, startDate, endDate){
  if (!scheduleDB) {
      console.error("Database not initialized yet!");
      return;
  }

  if (!scheduleDB.objectStoreNames.contains("schedules")) {
      console.error("Object store 'schedules' not found2.");
      return;
  }

  const tx = scheduleDB.transaction("schedules", "readwrite");
  const store = tx.objectStore("schedules");

  // Create the goal object to add
  const schedules = {
    scheduleActivity: scheduleActivity,
    startDate: startDate, 
    endDate: endDate
  };

  const addRequest = store.add(schedules);

  addRequest.onsuccess = () => {
      console.log("Schedule added successfully!");
  };

  addRequest.onerror = (event) => console.error("Error adding goal:", event.target.error);
}

function addDeadlineItem(deadlineDate,deadlineName,deadlineActivity,deadlineHours){
    if (!deadlineDB) {
      console.error("Database not initialized yet!");
      return;
  }

  if (!deadlineDB.objectStoreNames.contains("deadlines")) {
      console.error("Object store 'deadlines' not found2.");
      return;
  }

  const tx = deadlineDB.transaction("deadlines", "readwrite");
  const store = tx.objectStore("deadlines");

  // Create the deadline object to add
  const deadlines = {
    deadlineName: deadlineName,
    deadlineDate: deadlineDate,
    deadlineActivity: deadlineActivity, 
    deadlineHours: deadlineHours,
    createdDate: Date.now()
  };

  const addRequest = store.add(deadlines);

  addRequest.onsuccess = () => {
      console.log("Schedule added successfully!");
  };

  addRequest.onerror = (event) => console.error("Error adding goal:", event.target.error);
}

function closeAllPopups() {
  document.getElementById("eventpopup").style.visibility = "hidden";
  document.getElementById("schedulepopup").style.visibility = "hidden";
  document.getElementById("deadlinepopup").style.visibility = "hidden";
};

function openSchedulePopup() {
  closeAllPopups(); // Close all other popups
  document.getElementById("schedulepopup").style.visibility = "visible"; // Show schedule popup
}

function openDeadlinePopup() {
  closeAllPopups(); // Close all other popups
  document.getElementById("deadlinepopup").style.visibility = "visible"; // Show deadline popup
};

function openevent() {
  document.getElementById("eventpopup").style.visibility = "visible"; // Show event popup
}

function createScheduleEvent() {
    var scheduleDate = document.getElementById('scheduleDate').value;
    var scheduleActivity = document.getElementById('scheddropdown').value;
    var scheduleStart = document.getElementById('scheduleStart').value;
    var scheduleEnd = document.getElementById('scheduleEnd').value;
  
    if (scheduleDate && scheduleActivity && scheduleStart && scheduleEnd) {
      var startDate = new Date(scheduleDate + 'T' + scheduleStart);
      var endDate = new Date(scheduleDate + 'T' + scheduleEnd);
  
      if (calendar) {
        var newEvent = {
          title: scheduleActivity,
          start: startDate,
          end: endDate,
          allDay: false,
          backgroundColor: 'blue'
        };
  
        calendar.addEvent(newEvent); // ✅ Corrected
        addScheduleItem(scheduleActivity, startDate, endDate);
  
        closeAllPopups();
      } else {
        alert('Calendar is not initialized yet!');
      }
    } else {
      alert('Please fill in all fields.');
    }
  }

function createDeadline() {
    // Get values from the form inputs
  var deadlineDate = document.getElementById('deadlineDate').value;
  var deadlineName = document.getElementById('deadlineName').value;
  var deadlineActivity = document.getElementById('deaddropdown').value;
  var deadlineHours = document.getElementById('deadlineHours').value;

  // Validate inputs
  if (deadlineDate && deadlineName && deadlineActivity && deadlineHours) {
    // Convert deadlineDate to Date object
    if (deadlineHours <= 0) {
      alert('Deadline hours must be a positive number.');
      return;
    }

    var deadlineDateObj = new Date(deadlineDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight to ensure accurate comparison
    
    if (deadlineDateObj < today) {
      alert('You cannot set a deadline for a past date.');
      return;
    }
    // Add the deadline as an event to FullCalendar
    if (calendar) {
      var newDeadline = {
        title: `${deadlineName}: ${deadlineActivity} - ${deadlineHours} hr remain`,
        start: deadlineDateObj,
        allDay: true, // Deadlines are typically all-day events
        backgroundColor: 'red'
      };

      // Add the deadline event to the calendar
      calendar.addEventSource([newDeadline]);
      addDeadlineItem(deadlineDate,deadlineName,deadlineActivity,deadlineHours);
      // Close the deadline popup
      closeAllPopups();
    } else {
      alert('Calendar is not initialized yet!');
    }
  } else {
    alert('Please fill in all fields.');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');

  calendar = new FullCalendar.Calendar(calendarEl, {
    aspectRatio: 0.1,
    height:900,
    expandRows: true,
    handleWindowResize: false,
    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    initialDate: '2025-01-12',
    navLinks: true, // can click day/week names to navigate views
    selectable: false,
    selectMirror: true,
    select: function(arg) {
      eventpopup.style.visibility = "visible";
      eventpopup.setAttribute('data-start', arg.startStr);
      eventpopup.setAttribute('data-end', arg.endStr);
      calendar.unselect();
    },
    eventClick: function(arg) {
      const eventName = arg.event.title;
      const eventStart = arg.event.start ? arg.event.start.toLocaleString() : 'No Start Time';
      const eventEnd = arg.event.end ? arg.event.end.toLocaleString() : 'No End Time';
    
      const message = `Event: ${eventName}\nStart: ${eventStart}\nEnd: ${eventEnd}`;
      
      alert(message);
    },
    editable: true,
    dayMaxEvents: true, // allow "more" link when too many events
    
  });

  // Initialize the calendar
  calendar.render();
  
})

function Todayclick(){
  calendar.today();
};

window.onload = function () {
    initDB();
};
