var loginRequest;
var authKey;
var patientData;
var parsedPatientData;

function attemptLogin() {
  loginRequest = $.ajax({
    type: 'POST',
    url: 'http://localhost:3000/api/users/sign_in',
    data: {
      user_login: {
        username : $('#user-name').val(),
        password : $('#user-pass').val()
      }
    },
    success: function(status){
      parseLoginResponse();
      retrievePatients();
    },
    error: function(xhr, status, error) {
      console.log("error"+error)
      console.log("error"+status)
      // $(".results").html(error + " " + status)
      $(".canvas .col-sm").append("<p style='color:red;margin-top:10px;'>"+JSON.parse(loginRequest.responseText).errors[0].details+"</p>")
      console.log(JSON.parse(loginRequest.responseText).errors[0].details)
    }
    // dataType: "application/json"
  })
}


function parseLoginResponse() {
  parsed = JSON.parse(loginRequest.responseText) // convert string into json readable format
  authKey = parsed.user.auth_token
}

function retrievePatients() {
  patientData = $.ajax({
     method: "GET",
     url: "http://localhost:3000/api/patients.json?include_detail=true",
     headers: {
      "Authorization":  "Token token="+authKey
     },
     success: function() {
      $(".notice").html("You have Signed in Successfully!");
      displayAllPatients();
      retrievePatientImages();
      setTimeout(function(){ $('.notice').hide() }, 5000);
      // $('.canvas').replaceWith(patientData.responseText);
      // $('.canvas').replaceWith(displayAllPatients());
     },
     contentType: "application/json"
  });
}

function displayAllPatients() {
  parsedPatientData = JSON.parse(patientData.responseText)
  content = ""
  parsedPatientData.patients.forEach(function(patient){
    "<a onclick"+showPatient(patient)+">"
    content+="<div class='row'>"+"<div class='col-sm' id="+patient.forenames+" style='display: flex;justify-content: space-between;align-items: center;border-bottom: 1px solid beige;padding-top: 5px;padding-bottom: 5px;'>"
    if (patient.avatar != null){
      content+="<img data-mime-type="+patient.avatar.mime_type+" id="+patient.avatar.uuid+" class='patient_image' width='100' style='border-radius:50px;'>";
    } else {
      content+="<img src='eMAR/no-avatar.png' width='100' style='border-radius:50px;'>";
    }
    content+=patient.title+" "
    content+=patient.forenames+" "
    content+=patient.surname
    content+=patient.room == "" ? "" : " - "+patient.room
    findTodayMedications(patient)
    // content+="<button onclick="+showPatient(patient)+">"+'Submit'+"</button>"
    content+="</div>"+"</div>"
    // PatientMedication(patient)
    // document.write(content)
    "</a>"
  })
  $('.container').html(content)
}

function showPatient(parsedPatient) {
  console.log("Logging :"+parsedPatient.forenames)
  $('#'+parsedPatient.forenames).on('click', function(){
    alert("hello");
    console.log(parsedPatient.forenames)
  })
}

function retrievePatientImages() {
  $('.patient_image').each(function(index) {
    var uuid = this.id;
    var imageTag = this;
    var retrievePatientImage = $.ajax({
      method: "GET",
      url: "http://localhost:3000/api/images/"+uuid,
      headers: {
        "Authorization":  "Token token="+authKey
      },
      mimeType: "text/plain; charset=x-user-defined",
      success: function(argument) {
        console.log("Image Retrieved")
        mimeType = $('#'+uuid).data("mime-type")
        $(imageTag).attr('src','data:'+mimeType+';base64,'+base64Encode(argument));
        // console.log(imageTag)
      }
    })
  })
}

// PASS AN ARGUMENT TO THIS METHOD SO IT CALCULATES FOR ONE PATIENT ONLY //
function findTodayMedications(parsedPatient){
  timeslotHash = {};
  parsedPatient.time_slots.forEach(function(timeSlot){
    timeslotHash[timeSlot.time] = timeSlot.color
  });

  parsedPatient.todays_administrations.forEach(function(todaysAdministration){
    $.each(timeslotHash, function(time, color){
      if (time == todaysAdministration.slot_time) {
        content+="<div style='border:10px solid #"+color+";border-radius:50px;'>"+"</div>"
      };
    });
  });
  // Check for medication in this cycle items and only display if it has dosing type PRN
  parsedPatient.this_cycle_items.forEach(function(thisCycleItem) {
    if (thisCycleItem.dosing == "prn") {
      content+="<div style='background-color:black;color:white;border-radius:75px;padding:0 10px 0 10px;'>"+"PRN"+"</div>"
    }
  });
}

// time_slots has the times
// todays_administrations show todays medication on the front screen

// item id in todays administrations refers to id in this_cycle_items for
// information only


// Convert the retrieved image from the api into a format so that it can be displayed
function base64Encode(str) {
  var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var out = "", i = 0, len = str.length, c1, c2, c3;
  while (i < len) {
      c1 = str.charCodeAt(i++) & 0xff;
      if (i == len) {
          out += CHARS.charAt(c1 >> 2);
          out += CHARS.charAt((c1 & 0x3) << 4);
          out += "==";
          break;
      }
      c2 = str.charCodeAt(i++);
      if (i == len) {
          out += CHARS.charAt(c1 >> 2);
          out += CHARS.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
          out += CHARS.charAt((c2 & 0xF) << 2);
          out += "=";
          break;
      }
      c3 = str.charCodeAt(i++);
      out += CHARS.charAt(c1 >> 2);
      out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
      out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
      out += CHARS.charAt(c3 & 0x3F);
  }
  return out;
}

// patient.retrieveImage(patient.avatar.uuid)

// var PatientImage = function retrieveImage(avatarUuid) {
//   this.avatarUuid = avatarUuid;
//   var retrievePatientImage = $.ajax({
//     method: "GET",
//     url: "http://localhost:3000/api/images/"+avatarUuid,
//     headers: {
//       "Authorization":  "Token token="+authKey
//     },
//     success: function(argument) {
//       console.log("Image Retrieved")
//       // console.log(argument)
//       // document.write(argument)
//     },
//     contentType: "application/json"
//   })
// }

  // obj.user.auth_token // Retrieves the auth token needed for login

  // obj.errors[0] // This will display any errors if there has been a failure with login credentials


// }).done(function(d) {
//   results = JSON.parse(d.responseText); // redundant as we are not checking for done state anymore
