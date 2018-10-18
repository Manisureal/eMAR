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
      // createPatientDataStructure();
      retrievePatientImages();
      $(".notice").html("You have Signed in Successfully!");
      setTimeout(function(){ $('.notice').hide() }, 5000);
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
        timeSlot["PRN"]["TodaysAdministrations"].push({administered_at: null,destroyed_quantity: null,dose_given: null,dose_prescribed: "",due_date: "",
                                                    false_reason: null,id: 0,item_id: item.id,mar_notes: null,mar_warnings: null,
                                                    medication_name: item.medication_name,self_administered: false,slot_time: "PRN",stopped: false,user_fullname: null,
                                                    user_username: null,wasted_quantity: null,witness_fullname: null,witness_id: null,witness_username: null});
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
  // console.log(patientDataStructure)

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
  createPatientDataStructure();
  // key = Time/PRN Name
  content += "<div class='row'>"
  Object.keys(patientDataStructureCreated[parsedPatient.id]).forEach(function(key){
    ts = patientDataStructureCreated[parsedPatient.id][key].TimeSlots
    if (ts.time == "PRN") {
      content+="<div class='col-sm-12' margin:10px;'>"+"<span style='background-color:black;color:white;border-radius:75px;padding:0 10px 0 10px;width:52px;'>"+"PRN"+"</span>"+"</div>"
    } else {
      content+="<div style='border:10px solid #"+ts.color+";border-radius:50px;margin:15px;'>"+"</div>"
    }
  })
  content += "</div>"
}

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


function displayPatientTodayMedications(patient) {
  id = patient.id
  Object.keys(patientDataStructureCreated[id]).forEach(function(key){
    timeslot = patientDataStructureCreated[id][key].TimeSlots
    if (timeslot.time == "PRN"){
      patientInfo+="<div style='background:black;color:white;padding:10px;'>"+"PRN"+"</div>"
      patientDataStructureCreated[id].PRN.TodaysAdministrations.forEach(function(todaysAdmins){
        patientInfo+="<div style='display:flex;justify-content:space-between;border-left: 5px solid black;padding-left:5px;border-bottom: 1px solid black;'>"+"<div>"+"<p style='margin:0;'>"+todaysAdmins.medication_name+"</p>"
        patientInfo+="<p style='margin:0;'>"+"<i>"+patient.this_cycle_items.find(x => x.id === todaysAdmins.item_id).instructions+"</i>"+"</p>"+"</div>"
        patientInfo+="<div style='padding:12.5px 0 0 0;'>"+"<button onclick='medicationAdministration(patient, "+todaysAdmins.item_id+")'>"+"<i class='fas fa-check'></i>"+"</button>"+"</div>"+"</div>"
      })
    } else {
      patientInfo+="<div class='container'>"
      patientInfo+="<div class='row' style='background: #"+timeslot.color+";padding:10px;margin:-bottom:10px;'>"+"<div class='col-sm-11'>"+timeslot.show_as+"</div>"+"<span style='float:right;padding:0 25px 0 0;'>"+"Dose"+"</span>"+"</div>"
      patientInfo+="</div>"
      patientDataStructureCreated[id][key].TodaysAdministrations.forEach(function(todaysAdmins){
        patientInfo+="<div style='display:flex;border-left: 5px solid #"+timeslot.color+";border-bottom: 1px solid #"+timeslot.color+";padding-left:5px;'>"+"<div style='flex-grow:1;'>"+"<p style='margin:0;'>"+todaysAdmins.medication_name+"</p>"
        patientInfo+="<p style='margin:0;'>"+"<i>"+patient.this_cycle_items.find(x => x.id === todaysAdmins.item_id).instructions+"</i>"+"</p>"+"</div>"
        patientInfo+="<div style='padding:12.5px 25px 0 0;'>"+todaysAdmins.dose_prescribed+"</div>"
        patientInfo+="<div style='padding:12.5px 0 0 0;'>"+"<button onclick='medicationAdministration(patient, "+todaysAdmins.id+")'>"+"<i class='fas fa-check'></i>"+"</button>"+"</div>"+"</div>"
      })
    }
  })
}


function medicationAdministration(patient, todaysAdministrationID) {
  administration = patient.todays_administrations.find(x => x.id === todaysAdministrationID) // checking for standard items in todays administration
  administrationPRN = patient.this_cycle_items.find(x => x.id === todaysAdministrationID) // checking for PRN items in this cycle items
  html = '<div class="modal" tabindex="-1" role="dialog">'
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
          if (administration){
            findAdminItemInThisCycleItems = patient.this_cycle_items.find(x => x.id === administration.item_id)
            switch (findAdminItemInThisCycleItems.dosing == "standard") {
              case findAdminItemInThisCycleItems.is_insulin == true:
                // html += "Yes Insulin"
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administration.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6'>"+findAdminItemInThisCycleItems.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Drug Round"+"</p>"+"<p class='col-sm-6'>"+administration.slot_time+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Prescribed"+"</p>"+"<p class='col-sm-6'>"+administration.dose_prescribed+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6'>"+0+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Previous Site"+"</p>"+"<p class='col-sm-6'>"+(patient.last_insulin_site === null ? "No Previous Site Recorded" :  patient.last_insulin_site)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"New INS Site"+"</p>"+"<p class='col-sm-6'>"+(patient.inr_test_date === null ? "No Previous Date" :  patient.inr_test_date)+"</p>"+"</div>"
                break;
              case findAdminItemInThisCycleItems.is_patch == true:
                // html += "I am patch"
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administration.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6'>"+findAdminItemInThisCycleItems.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Drug Round"+"</p>"+"<p class='col-sm-6'>"+administration.slot_time+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Prescribed"+"</p>"+"<p class='col-sm-6'>"+administration.dose_prescribed+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6'>"+0+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Last Patch Location"+"</p>"+"<p class='col-sm-6'>"+(findAdminItemInThisCycleItems.last_patch_location === null ? "No Location Recorded" : findAdminItemInThisCycleItems.last_patch_location)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"New Patch Location"+"</p>"+"<p class='col-sm-6'>"+"<select>"+selectTagsForNewPatchLocation()+"</select>"+"</p>"+"</div>"
                break;
              case findAdminItemInThisCycleItems.is_warfarin == true:
                // html += "I am warfarin"
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administration.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6'>"+findAdminItemInThisCycleItems.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Drug Round"+"</p>"+"<p class='col-sm-6'>"+administration.slot_time+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"INR Reading"+"</p>"+"<p class='col-sm-6'>"+(patient.inr_reading === null ? 0 : patient.inr_reading)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"INR Test Date"+"</p>"+"<p class='col-sm-6'>"+(patient.inr_test_date === null ? "No Previous Date Recorded" : findAdminItemInThisCycleItems.last_patch_location)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Prescribed"+"</p>"+"<p class='col-sm-6'>"+administration.dose_prescribed+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6'>"+0+"</p>"+"</div>"
                break;
              default:
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administration.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6'>"+patient.this_cycle_items.find(x => x.id === administration.item_id).routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Drug Round"+"</p>"+"<p class='col-sm-6'>"+administration.slot_time+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Prescribed"+"</p>"+"<p class='col-sm-6'>"+administration.dose_prescribed+"</p>"+"</div>"
                break;
            }
          } else {
            switch (administrationPRN.dosing == "prn") {
              case administrationPRN.is_insulin == true:
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administrationPRN.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6'>"+administrationPRN.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6'>"+"<input id='dose-given-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Reason for Giving"+"</p>"+"<p class='col-sm-6'>"+"<input id='reason-giving-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Previous Site"+"</p>"+"<p class='col-sm-6'>"+(patient.last_insulin_site === null ? "No Previous Site Recorded" :  patient.last_insulin_site)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"New INS Site"+"</p>"+"<p class='col-sm-6'>"+"<input id='ins-site-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                break;
              case administrationPRN.is_patch == true:
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administrationPRN.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6'>"+administrationPRN.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6'>"+"Add Input Box Here"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Reason for Giving"+"</p>"+"<p class='col-sm-6'>"+"Add Input Box Here"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Last Patch Location"+"</p>"+"<p class='col-sm-6'>"+(administrationPRN.last_patch_location === null ? "No Location Recorded" : administrationPRN.last_patch_location)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"New Patch Location"+"</p>"+"<p class='col-sm-6'>"+"<select>"+selectTagsForNewPatchLocation()+"</select>"+"</p>"+"</div>"
                break;
              case administrationPRN.is_warfarin == true:
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administrationPRN.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6'>"+administrationPRN.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"INR Reading"+"</p>"+"<p class='col-sm-6'>"+(patient.inr_reading === null ? 0 : patient.inr_reading)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"INR Test Date"+"</p>"+"<p class='col-sm-6'>"+(patient.inr_test_date === null ? "No Previous Date Recorded" : patient.inr_test_date)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6'>"+"Add Input Box Here"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Reason for Giving"+"</p>"+"<p class='col-sm-6'>"+"Add Input Box Here"+"</p>"+"</div>"
                break;
              default:
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administrationPRN.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6'>"+administrationPRN.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6'>"+"Add Input Box Here"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Reason for Giving"+"</p>"+"<p class='col-sm-6'>"+"Add Input Box Here"+"</p>"+"</div>"
                break;
            }
          }
        html+= '</div>'
        html+= '<div class="modal-footer">'
          if (administration) {
            html+= "<button type='button' class='btn btn-primary' onclick='storePatientAdministrationDataLocally(patient, "+administration.item_id+")'>"+"Save changes"+"</button>"
          } else {
            html+= "<button type='button' class='btn btn-primary' onclick='storePatientAdministrationDataLocally(patient, "+administrationPRN.id+")'>"+"Save changes"+"</button>"
          }
          html+= '<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>'
        html+= '</div>'
      html+= '</div>'
    html+='</div>'
  html+='</div>'
  $('#patientMedsChecks').html(html);
  $('.modal').modal();
  retrievePatientImages();
}

function selectTagsForNewPatchLocation() {
  optionsArray = ["Ear Behind Left", "Ear Behind Right", "Arm Left Upper", "Arm Right Upper", "Chest Left", "Chest Right", "Back Left Upper", "Back Right Upper",
                  "Back Left Lower", "Back Right Lower", "Knee Behind Left", "Knee Behind Right"]
  result = []
  optionsArray.forEach(function(option){
    result += "<option value='"+option+"'>"+option+"</option>"
  })
  return result
}

function storePatientAdministrationDataLocally(patient, administration) {
  // console.log("patient: "+patient.id)
  // console.log("administration: "+administration)
  localStorageHash = {}
  localStorageHash = patientDataStructureCreated
  prnAdmin = localStorageHash[patient.id].PRN.TodaysAdministrations.find(x => x.item_id === administration.id)
  prnAdmin.dose_given = $('#dose-given-'+administration.id)
  $('.modal').modal('hide')
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
