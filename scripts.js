var loginRequest;
var authKey;
var patientData;
var parsedPatientData;
var patientDataStructureCreated;

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
      addLogOut();
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

function addLogOut() {
  $('.custom-navbar').append("<button class='btn btn-danger' onclick='location.reload();'>"+"<i class='fas fa-sign-out-alt'></i>"+"</button>");
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
      displayAllPatients();
      retrievePatientImages();
      $(".notice").html("You have Signed in Successfully!");
      setTimeout(function(){ $('.notice').hide() }, 5000);
      createPatientDataStructure();
      // $('.canvas').replaceWith(patientData.responseText);
      // $('.canvas').replaceWith(displayAllPatients());
     },
     contentType: "application/json"
  });
}

function createPatientDataStructure() {
  patientDataStructure = {}
  parsedPatientData.patients.forEach(function(patient){
    timeSlot = {}
    todaysAdministrations = {}
    patient.this_cycle_items.forEach(function(item){
      if (item.dosing == "prn") {
        if (timeSlot["PRN"] == null) {
          timeSlot["PRN"] = {"TimeSlots": {color: "000000",id: 0,show_as: "PRN",time: "PRN"}, "TodaysAdministrations": []}
        }
        timeSlot["PRN"]["TodaysAdministrations"].push({administered_at: null,
                                                    destroyed_quantity: null,
                                                    dose_given: null,
                                                    dose_prescribed: "",
                                                    due_date: "",
                                                    false_reason: null,
                                                    id: 0,
                                                    item_id: item.id,
                                                    mar_notes: null,
                                                    mar_warnings: null,
                                                    medication_name: item.medication_name,
                                                    self_administered: false,
                                                    slot_time: "PRN",
                                                    stopped: false,
                                                    user_fullname: null,
                                                    user_username: null,
                                                    wasted_quantity: null,
                                                    witness_fullname: null,
                                                    witness_id: null,
                                                    witness_username: null});
      }
    })
    patient.time_slots.forEach(function(ts){
      patient.todays_administrations.forEach(function(ta){
        if (timeSlot[ts.time] == null) {
          timeSlot[ts.time] = {"TimeSlots": ts, "TodaysAdministrations": []}
        }
        if (ts.time == ta.slot_time) {
          timeSlot[ts.time]["TodaysAdministrations"].push(ta)
        }
      })
    })
    patientDataStructure[patient.id] = timeSlot
  })
  patientDataStructureCreated = patientDataStructure
  console.log(patientDataStructure)

  // patientDataStructure = {}
  // findPatient = parsedPatientData.patients.find(x => x.id === 10)
  // patientDataStructure[findPatient.id] = [findPatient.time_slots, findPatient.this_cycle_items, findPatient.todays_administrations]
}

function displayAllPatients() {
  parsedPatientData = JSON.parse(patientData.responseText)
  content = ""
  parsedPatientData.patients.forEach(function(patient){
    // The following commented code to be used with global click event handler in index script tags //
    // onclick='showPatient(patient)'
    // "<a href="+"javascript:void(0);"+" class='showPatientLink' data-id="+patient.id+">"
    content+="<a href="+"javascript:void(0);"+" onclick='showPatient("+patient.id+");'>"+"<div class='row'>"+"<div class='col-sm' style='display: flex;justify-content: space-between;align-items: center;border-bottom: 1px solid beige;padding-top: 5px;padding-bottom: 5px;'>"
    if (patient.avatar != null){
      content+="<img data-mime-type="+patient.avatar.mime_type+" id="+patient.avatar.uuid+" class='patient_image' width='100' style='border-radius:50px;'>";
    } else {
      content+="<img src='eMAR/no-avatar.png' width='100' style='border-radius:50px;'>";
    }
    content+="<div class='col-sm'>"
    content+="<div style='margin-bottom:10px;'>"+patient.title+" "+patient.forenames+" "+patient.surname
    content+=patient.room == "" ? "" : " - "+patient.room
    content+="</div>"
    findTodayMedications(patient)
    content+="</div>"+"</div>"+"</div>"+"</a>"
    // PatientMedication(patient)
    // document.write(content)
  })
  $('.container').html(content)
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
  content += "<div style='display:flex;'>"
  parsedPatient.todays_administrations.forEach(function(todaysAdministration){
    $.each(timeslotHash, function(time, color){
      if (time == todaysAdministration.slot_time) {
        content+="<div style='border:10px solid #"+color+";border-radius:50px;margin:0px 10px 10px 0px;'>"+"</div>"
      };
    });
  });
  content += "</div>"
  // Check for medication in this cycle items and only display if it has dosing type PRN
  parsedPatient.this_cycle_items.forEach(function(thisCycleItem) {
    if (thisCycleItem.dosing == "prn") {
      content+="<div class='col-sm' style='background-color:black;color:white;border-radius:75px;padding:0 10px 0 10px;width:52px;'>"+"PRN"+"</div>"
    }
  });
}

// time_slots has the times
// todays_administrations show todays medication on the front screen

// item id in todays administrations refers to id in this_cycle_items for
// information only

// The following commented code to be used with global click event handler in index script tags //
// function showPatient(parsedPatientID) {
//     patient = parsedPatientData.patients.find(x => x.id === parsedPatientID)
//     alert("hello "+patient.forenames);
// }

function showPatient(parsedPatientID) {
  patient = parsedPatientData.patients.find(x => x.id === parsedPatientID)
  patientInfo = ""
  patientInfo += "<div class='patient-details'>"
  // Patient Image
  patientInfo += "<div style='padding-right:10px;'>"
  if (patient.avatar != null){
    patientInfo+="<img data-mime-type="+patient.avatar.mime_type+" id="+patient.avatar.uuid+" class='patient_image' width='100' style='border-radius:50px;'>";
  } else {
    patientInfo+="<img src='eMAR/no-avatar.png' width='100' style='border-radius:50px;'>";
  }
  patientInfo += "</div>"
  // Patient Details
  patientInfo += "<div style='padding-right:10px;'>"+"<b>"+"Name: "+"</b>"+patient.title+" "+patient.forenames+" "+patient.surname+"<br>"
  patientInfo += "<b>"+"GP Name: "+"</b>"+patient.gp_name+"<br>"+"</div>"
  patientInfo += "<div style='padding-right:10px;'>"+"<b>"+"DOB: "+"</b>"+patient.dob+"<br>"+"<b>"+"Room: "+"</b>"+patient.room+"<br>"+"</div>"
  patientInfo += "<div style='padding-right:10px;'>"+"<b>"+"Allergies: "+"</b>"+patient.allergies+"<br>"+"<b>"+"Notes: "+"</b>"+patient.additional_information+"</div>"
  // patient.notes.forEach(function(note){
  //   patientInfo += note.ni"Notes: "+note
  // })
  patientInfo += "</div>"
  displayPatientTodayMedications(patient);
  patientInfo += "<div>"+"<button class='btn btn-success' style='float:right;' onclick='retrievePatients()'>Back</button>"+"</div>"
  $('.container').html(patientInfo)
  retrievePatientImages();
  $('.container').append('<div id="patientMedsChecks"></div>')
  // console.log(patient)
}


function medicationAdministration(patient, todaysAdministrationID) {
  administration = patient.todays_administrations.find(x => x.id === todaysAdministrationID)
  var html = '<div class="modal" tabindex="-1" role="dialog">'
    html+= '<div class="modal-dialog modal-dialog-centered" role="document">'
      html+= '<div class="modal-content">'
        html+= '<div class="modal-header">'
          html += "<div style='padding-right:10px;'>"
            if (patient.avatar != null){
              html+="<img data-mime-type="+patient.avatar.mime_type+" id="+patient.avatar.uuid+" class='patient_image' width='100' style='border-radius:50px;'>";
            } else {
              html+="<img src='eMAR/no-avatar.png' width='100' style='border-radius:50px;'>";
            }
          html += "</div>"
          html+= "<h5 class='modal-title' style='padding-top:8%;'>"+patient.forenames+" "+patient.surname+"</h5>"
          html+=  '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
            html+= '<span aria-hidden="true">&times;</span>'
          html+= '</button>'
        html+= '</div>'
        html+= '<div class="modal-body">'
          html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administration.medication_name+"</h5>"
          html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6'>"+patient.this_cycle_items.find(x => x.id === administration.item_id).routes+"</p>"+"</div>"
          html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Drug Round"+"</p>"+"<p class='col-sm-6'>"+administration.slot_time+"</p>"+"</div>"
          html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Prescribed"+"</p>"+"<p class='col-sm-6'>"+administration.dose_prescribed+"</p>"+"</div>"
        html+= '</div>'
        html+= '<div class="modal-footer">'
          html+= '<button type="button" class="btn btn-primary">Save changes</button>'
          html+= '<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>'
        html+= '</div>'
      html+= '</div>'
    html+='</div>'
  html+='</div>'
  $('#patientMedsChecks').html(html);
  $('.modal').modal();
  retrievePatientImages();
}

// Image Encoder Method //
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
