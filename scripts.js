var loginRequest;
var authKey;
var patientData;
var parsedPatientData;
var patientsDataStructureCreated;
var localStorageHash;
var administrationsToSend = [];

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
    // prn dosing administrations
    patient.this_cycle_items.forEach(function(item){
      if (item.dosing == "prn") {
        if (timeSlot["PRN"] == null) {
          timeSlot["PRN"] = {"TimeSlot": {color: "000000",id: 0,show_as: "PRN",time: "PRN"}, "Items": {}}
        }
        if (timeSlot["PRN"]["Items"][item.id] == null && item.end_date >= moment().format('YYYY-MM-DD')) {
          timeSlot["PRN"]["Items"][item.id]= {"id":item.id, "item_name":item.medication_name, "administrations": []}
        }
      }
    })
    patient.todays_administrations.forEach(function(ta){
      if (ta.slot_time == "PRN"){
        timeSlot["PRN"]["Items"][ta.item_id]["administrations"].push(ta)
      }
    })

    // standard dosing administrations
    patient.time_slots.forEach(function(ts){
      patient.todays_administrations.forEach(function(ta){
        if (timeSlot[ts.time] == null) {
          timeSlot[ts.time] = {"TimeSlot": ts, "Items": {}}
        }
        if (ts.time == ta.slot_time) {
          // timeSlot[ts.time]["TodaysAdministrations"].push(ta)
          if (timeSlot[ts.time]["Items"][ta.item_id] == null) {
            timeSlot[ts.time]["Items"][ta.item_id]= {"id":ta.item_id, "item_name":ta.medication_name, "administrations": []}
          }
          // timeSlot[ts.time]["TodaysAdministrations"].push(ta)
          timeSlot[ts.time]["Items"][ta.item_id]["administrations"].push(ta)
        }
      })
    })
    // patientDataStructure[patient.id] = timeSlot
    patientDataStructure[patient.id] = timeSlot
  })
  patientsDataStructureCreated = patientDataStructure
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
  Object.keys(patientsDataStructureCreated[parsedPatient.id]).forEach(function(key){
    items = patientsDataStructureCreated[parsedPatient.id][key].Items
    ts = patientsDataStructureCreated[parsedPatient.id][key].TimeSlot
    if (ts.time == "PRN") {
      content+="<div class='col-sm-12' margin:10px;'>"+"<span style='background-color:black;color:white;border-radius:75px;padding:0 10px 0 10px;width:52px;'>"+"PRN"+"</span>"+"</div>"
    } else if ($.isEmptyObject(items) != true) {
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
  patientInfo += "<div class='row'>"
  patientInfo += "<div class='col-sm-6' style='padding-right:0;'>"+"<button style='width:100%;padding: .375rem .75rem;background:#007bff;color:white;' onclick='retrievePatients()'>BACK</button>"+"</div>"
  patientInfo += "<div class='col-sm-6' style='padding-left:0;'>"+"<button style='width:100%;padding: .375rem .75rem;background:#007bff;color:white;' onclick='retrievePatients()'>SAVE</button>"+"</div>"
  patientInfo += "</div>"
  $('.container').html(patientInfo);
  retrievePatientImages();
  $('.container').append('<div id="patientMedsChecks"></div>')
  // console.log(patient)
}


function displayPatientTodayMedications(patient) {
  Object.keys(patientsDataStructureCreated[patient.id]).forEach(function(slotTime){
  objectItemsLength = Object.keys(patientsDataStructureCreated[patient.id][slotTime].Items).length
    timeslot = patientsDataStructureCreated[patient.id][slotTime].TimeSlot
    if (timeslot.time == "PRN"){
      counter = 0
      Object.keys(patientsDataStructureCreated[patient.id][slotTime].Items).forEach(function(item){
        thisCycleItem = patient.this_cycle_items.find(x => x.id === parseInt(item))
        if (objectItemsLength != 0 && thisCycleItem.checked_in_quantity > 0){
          if (counter === 0) {
            patientInfo+="<div style='background:black;color:white;padding:10px;'>"+"PRN"+"</div>"
            counter += 1
          }
        }
      })
      Object.keys(patientsDataStructureCreated[patient.id].PRN.Items).forEach(function(itemId){
        itemId = parseInt(itemId)
        thisCycleItem = patient.this_cycle_items.find(x => x.id === itemId)
        if (thisCycleItem.checked_in_quantity > 0) {
          patientInfo+="<div style='display:flex;justify-content:space-between;border-left: 5px solid black;padding-left:5px;border-bottom: 1px solid black;'>"+"<div>"+"<p style='margin:0;'>"+patientsDataStructureCreated[patient.id].PRN.Items[itemId].item_name+"</p>"
          patientInfo+="<p style='margin:0;'>"+"<i>"+patient.this_cycle_items.find(x => x.id === itemId).instructions+"</i>"+"</p>"
          displayPatientAdministrationNotes(patient, slotTime, itemId)
          patientInfo+="</div>"
          // patientInfo+="<div style='padding:12.5px 0 0 0;'>"+"<button onclick='medicationAdministration(patient, "+itemId+")'>"+"<i class='fas fa-check'></i>"+"</button>"+"</div>"+"</div>"
          patientInfo+="<div style='padding:12.5px 0 0 0;'>"+"<button onclick='medicationAdministration("+itemId+")'>"+"<i class='fas fa-check'></i>"+"</button>"+"</div>"+"</div>"
        }
      })
    } else {
      if (objectItemsLength != 0){
        patientInfo+="<div class='container'>"
        patientInfo+="<div class='row' style='background: #"+timeslot.color+";padding:10px;margin:-bottom:10px;'>"+"<div class='col-sm-11'>"+timeslot.show_as+"</div>"+"<span style='float:right;padding:0 25px 0 0;'>"+"Dose"+"</span>"+"</div>"
        patientInfo+="</div>"
      }
      Object.keys(patientsDataStructureCreated[patient.id][slotTime].Items).forEach(function(itemId){
        itemId = parseInt(itemId)
        patientInfo+="<div style='display:flex;border-left: 5px solid #"+timeslot.color+";border-bottom: 1px solid #"+timeslot.color+";padding-left:5px;align-items:center;'>"+"<div style='flex-grow:1;'>"+"<p style='margin:0;'>"+patientsDataStructureCreated[patient.id][slotTime].Items[itemId].item_name+"</p>"
        patientInfo+="<p style='margin:0;'>"+"<i>"+patient.this_cycle_items.find(x => x.id === itemId).instructions+"</i>"+"</p>"
        displayPatientAdministrationNotes(patient, slotTime, itemId);
        patientInfo+="</div>"
        // patientInfo+="<div id='dose-presc-"+itemId+"' style='padding-right:45px;'>"+patient.todays_administrations.find(x => x.item_id === itemId).dose_prescribed+"</div>"
        showSmileyFace(patient, slotTime, itemId);
        // patientInfo+="<div id='dose-presc-"+itemId+"' style='padding-right:45px;'>"+patientsDataStructureCreated[patient.id][slotTime].Items[itemId].administrations.find(x => x.item_id === itemId).dose_prescribed+"</div>"
        // patientInfo+="<div id='administer-"+itemId+"'>"+"<button onclick='medicationAdministration("+itemId+", \""+slotTime+"\")'>"+"<i class='fas fa-check'></i>"+"</button>"+"</div>"
        patientInfo+="</div>"
      })
    }
  })
}


function medicationAdministration(itemId, slotTime) {
  $('.modal-backdrop').remove();
  console.log(itemId, slotTime)
  administration = patient.todays_administrations.find(x => x.item_id === itemId && x.slot_time === slotTime) // checking for standard items in todays administration
  administrationPRN = patient.this_cycle_items.find(x => x.id === itemId) // checking for PRN items in this cycle items
  html = '<div class="modal" tabindex="-1" role="dialog">'
    html+= '<div class="modal-dialog modal-dialog-centered modal-lg" role="document">'
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
            checkDoseAdminAgainstDoseGiven(patient, administration.item_id, slotTime);
            findAdminItemInThisCycleItems = patient.this_cycle_items.find(x => x.id === administration.item_id)
            switch (findAdminItemInThisCycleItems.dosing == "standard") {
              case findAdminItemInThisCycleItems.is_insulin == true:
                // html += "Yes Insulin"
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administration.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+findAdminItemInThisCycleItems.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Drug Round"+"</p>"+"<p class='col-sm-6 flex-content'>"+administration.slot_time+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Prescribed"+"</p>"+"<p class='col-sm-6 flex-content'>"+administration.dose_prescribed+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+(administration.dose_given == null ? "<input id='dose-given-"+administration.item_id+"'>"+"</input>" : "<input id='dose-given-"+administration.item_id+"' value="+(parseFloat(administration.dose_prescribed) - doseGivenSum)+">"+"</input>")+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Previous Site"+"</p>"+"<p class='col-sm-6 flex-content'>"+(patient.last_insulin_site === null ? "No Previous Site Recorded" :  patient.last_insulin_site)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"New INS Site"+"</p>"+"<p class='col-sm-6 flex-content'>"+(patient.inr_test_date === null ? "No Previous Date" :  patient.inr_test_date)+"</p>"+"</div>"
                break;
              case findAdminItemInThisCycleItems.is_patch == true:
                // html += "I am patch"
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administration.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+findAdminItemInThisCycleItems.routes+"</p>"+"</div>"
                // html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Drug Round"+"</p>"+"<p class='col-sm-6'>"+administration.slot_time+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Drug Round"+"</p>"+"<p class='col-sm-6 flex-content'>"+slotTime+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Prescribed"+"</p>"+"<p class='col-sm-6 flex-content'>"+administration.dose_prescribed+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+(administration.dose_given == null ? "<input id='dose-given-"+administration.item_id+"'>"+"</input>" : "<input id='dose-given-"+administration.item_id+"' value="+(parseFloat(administration.dose_prescribed) - doseGivenSum)+">"+"</input>")+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Last Patch Location"+"</p>"+"<p class='col-sm-6 flex-content'>"+(findAdminItemInThisCycleItems.last_patch_location === null ? "No Location Recorded" : findAdminItemInThisCycleItems.last_patch_location)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"New Patch Location"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<select>"+selectTagsForNewPatchLocation()+"</select>"+"</p>"+"</div>"
                break;
              case findAdminItemInThisCycleItems.is_warfarin == true:
                // html += "I am warfarin"
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administration.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+findAdminItemInThisCycleItems.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Drug Round"+"</p>"+"<p class='col-sm-6 flex-content'>"+administration.slot_time+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"INR Reading"+"</p>"+"<p class='col-sm-6 flex-content'>"+(patient.inr_reading === null ? 0 : patient.inr_reading)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"INR Test Date"+"</p>"+"<p class='col-sm-6 flex-content'>"+(patient.inr_test_date === null ? "No Previous Date Recorded" : findAdminItemInThisCycleItems.last_patch_location)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Prescribed"+"</p>"+"<p class='col-sm-6 flex-content'>"+administration.dose_prescribed+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+0+"</p>"+"</div>"
                break;
              default:
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administration.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+patient.this_cycle_items.find(x => x.id === administration.item_id).routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Drug Round"+"</p>"+"<p class='col-sm-6 flex-content'>"+administration.slot_time+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Prescribed"+"</p>"+"<p class='col-sm-6 flex-content'>"+administration.dose_prescribed+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+(administration.dose_given == null ? "<input id='dose-given-"+administration.item_id+"'>"+"</input>" : "<input id='dose-given-"+administration.item_id+"' value="+(parseFloat(administration.dose_prescribed) - doseGivenSum)+">"+"</input>")+"</p>"+"</div>"
                break;
            }
          } else {
            console.log("administrationPRN"+administrationPRN)
            switch (administrationPRN.dosing == "prn") {
              case administrationPRN.is_insulin == true:
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administrationPRN.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+administrationPRN.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='dose-given-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Reason for Giving"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='reason-giving-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Previous Site"+"</p>"+"<p class='col-sm-6 flex-content'>"+(patient.last_insulin_site === null ? "No Previous Site Recorded" :  patient.last_insulin_site)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"New INS Site"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='ins-site-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                break;
              case administrationPRN.is_patch == true:
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administrationPRN.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+administrationPRN.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='dose-given-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Reason for Giving"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='reason-giving-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Last Patch Location"+"</p>"+"<p class='col-sm-6 flex-content'>"+(administrationPRN.last_patch_location === null ? "No Location Recorded" : administrationPRN.last_patch_location)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"New Patch Location"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<select>"+selectTagsForNewPatchLocation()+"</select>"+"</p>"+"</div>"
                break;
              case administrationPRN.is_warfarin == true:
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administrationPRN.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+administrationPRN.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"INR Reading"+"</p>"+"<p class='col-sm-6 flex-content'>"+(patient.inr_reading === null ? 0 : patient.inr_reading)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"INR Test Date"+"</p>"+"<p class='col-sm-6 flex-content'>"+(patient.inr_test_date === null ? "No Previous Date Recorded" : patient.inr_test_date)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='dose-given-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Reason for Giving"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='reason-giving-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                break;
              default:
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administrationPRN.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+administrationPRN.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='dose-given-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Reason for Giving"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='reason-giving-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                break;
            }
          }
        html+= '</div>'
        html+= '<div class="modal-footer">'
          if (administration) {
            // html+= "<button type='button' class='btn btn-primary' onclick='storePatientAdministrationDataLocally(patient, "+administration.item_id+")'>"+"CONFIRM"+"</button>"
            html+= "<button type='button' class='btn btn-primary' onclick='storePatientAdministrationDataLocally("+administration.item_id+", \""+slotTime+"\")'>"+"CONFIRM"+"</button>"
          } else {
            // html+= "<button type='button' class='btn btn-primary' onclick='storePatientAdministrationDataLocally(patient, "+administrationPRN.id+")'>"+"CONFIRM"+"</button>"
            html+= "<button type='button' class='btn btn-primary' onclick='storePatientAdministrationDataLocally("+administrationPRN.id+")'>"+"CONFIRM"+"</button>"
          }
          html+= '<button type="button" class="btn btn-secondary" data-dismiss="modal">CANCEL</button>'
        html+= '</div>'
        medicationInformation(itemId, slotTime);
      html+= '</div>'
    html+='</div>'
  html+='</div>'
  $('#patientMedsChecks').html(html);
  $('.modal').modal();
  retrievePatientImages();
}

function medicationInformation(itemId, slotTime) {
  item = patient.this_cycle_items.find(x => x.id === itemId)
  if (item.dosing == "prn") {
    administration = patientsDataStructureCreated[patient.id]["PRN"].Items[itemId].administrations.find(x => x.administered_at === item.last_administration)
  } else {
    administration = patientsDataStructureCreated[patient.id][slotTime].Items[itemId].administrations.find(x => x.administered_at === item.last_administration)
  }
  html+= '<div class="modal-content">'
  html+= '<div class="modal-body">'
    html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+"Medication Information"+"</h5>"
    html+= "<h6 class='modal-title' style='padding-bottom:10px;'>"+item.instructions+"</h6>"
    if (item.image_url == "") {
      html+= "<div class='row'>"+"<p class='col-sm-6' style='display:flex;justify-content:space-around;align-items:center;'>"+"No description or image available for this item"+"</p>"+"<p class='col-sm-6'>"+item.mandatory_instructions+"</p>"+"</div>"
    } else {
      html+= "<div class='row'>"+"<p class='col-sm-6' style='display:flex;justify-content:space-around;'>"+"<img src='http://localhost:3000"+item.image_url+"'>"+"</p>"+"<p class='col-sm-6' style='display:flex;align-items:center;'>"+item.mandatory_instructions+"</p>"+"</div>"
    }
    html+= '<button type="button" class="btn btn-info" style="margin-bottom:1rem;" data-dismiss="modal">PROTOCOLS</button>'
    html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Indications:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+item.indications+"</p>"+"</div>"
    html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Route:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+item.routes+"</p>"+"</div>"
    // html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Last Taken:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+"<b>"+"DOSE:"+"</b>"+administration.dose_given+"<b>"+" DATE:"+"</b>"+moment(item.last_administration).format('DD-MMM-YYYY')+"<b>"+" TIME:"+"</b>"+moment(item.last_administration).format('hh:mm:ss')+"<b>"+" USER:"+"</b>"+administration.user_fullname+"</p>"+"</div>"
    if (administration != undefined) {
      html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Last Taken:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+"DOSE:"+administration.dose_given+" DATE:"+moment(item.last_administration).format('DD-MMM-YYYY')+" TIME:"+moment(item.last_administration).format('hh:mm:ss')+" USER:"+administration.user_fullname+"</p>"+"</div>"
      html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Notes:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+administration.mar_notes+"</p>"+"</div>"
    }
    html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Item Id:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+item.id+"</p>"+"</div>"
  html+= '</div>'
  html+= '</div>'
}

function medicationProtocols(itemId, slotTime) {
  $('.modal-backdrop').remove();
  html = '<div class="modal medicationProtocolModal" tabindex="-1" role="dialog">'
    html+= '<div class="modal-dialog modal-dialog-centered" role="document">'
      html+= '<div class="modal-content">'
        html+= '<div class="modal-header">'
          html+= '<h5 class="modal-title">Modal title</h5>'
          html+= '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
            html+= '<span aria-hidden="true">&times;</span>'
          html+= '</button>'
        html+= '</div>'
        html+= '<div class="modal-body">'
          html+= '<p>Modal body text goes here.</p>'
        html+= '</div>'
        html+= '<div class="modal-footer">'
          html+= '<button type="button" class="btn btn-primary">Save changes</button>'
          html+= '<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>'
        html+= '</div>'
      html+= '</div>'
    html+= '</div>'
  html+= '</div>'
  $('#patientMedsChecks').html(html);
  $('.medicationProtocolModal').modal();
  $('.close').click(function(){
    medicationAdministration(itemId, slotTime)
  })
}

function stockOutWarning(){
  stockOutWarnHtml = '<div class="modal stockOutWarningModal" tabindex="-1" role="dialog">'
    stockOutWarnHtml+= '<div class="modal-dialog modal-dialog-centered" role="document">'
      stockOutWarnHtml+= '<div class="modal-content">'
        stockOutWarnHtml+= '<div class="modal-header">'
          stockOutWarnHtml+= '<h5 class="modal-title">Modal title</h5>'
          stockOutWarnHtml+= '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
            stockOutWarnHtml+= '<span aria-hidden="true">&times;</span>'
          stockOutWarnHtml+= '</button>'
        stockOutWarnHtml+= '</div>'
        stockOutWarnHtml+= '<div class="modal-body">'
          stockOutWarnHtml+= '<p>Modal body text goes here.</p>'
        stockOutWarnHtml+= '</div>'
        stockOutWarnHtml+= '<div class="modal-footer">'
          stockOutWarnHtml+= '<button type="button" class="btn btn-primary">Save changes</button>'
          stockOutWarnHtml+= '<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>'
        stockOutWarnHtml+= '</div>'
      stockOutWarnHtml+= '</div>'
    stockOutWarnHtml+= '</div>'
  stockOutWarnHtml+= '</div>'
  $('#patientMedsChecks').html(stockOutWarnHtml);
  $('.stockOutWarningModal').modal();
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

function storePatientAdministrationDataLocally(itemId, slotTime) {
  if (patient.this_cycle_items.find(x => x.id === itemId).dosing == "prn"){
    // Push PRN administered items into an array ready to be sent to the server for an items administration to be created //
    administrationsToSend.push({"item_id":itemId, "due_date":moment().format('YYYY-MM-DD'), "dose_prescribed":$('#dose-given-'+itemId).val(), "user_id":parsed.user.id,
                              "administered_at":moment().format('YYYY-MM-DD, hh:mm:ss'), "dose_given":$('#dose-given-'+itemId).val(), "mar_notes":$('#reason-giving-'+itemId).val(), "false_reason":""})
  } else {
    // Push Non-PRN administered items into an array ready to be sent to the server for an items administration to be created //
    // slotTime = patient.todays_administrations.find(x => x.item_id === itemId && x.slot_time === timeSlot).slot_time
    itemToAdminister = patientsDataStructureCreated[patient.id][slotTime].Items[itemId].administrations.find(x => x.item_id === itemId)
    // itemWithoutDoseGiven = patientsDataStructureCreated[patient.id][slotTime].Items[itemId].administrations.filter(x => x.item_id === itemId && x.dose_given == null)
    // itemWithoutDoseGiven = patientsDataStructureCreated[patient.id][slotTime].Items[itemId].administrations.find(x => x.item_id === itemId && x.dose_given == null)
    checkDoseAdminAgainstDoseGiven(patient, itemId, slotTime);
    if (itemToAdminister.dose_given == null) {
      if ($('#dose-given-'+itemId).val() <= itemToAdminister.dose_prescribed){
        administrationsToSend.push({"id":itemToAdminister.id, "user_id":parsed.user.id, "administered_at":moment().format('YYYY-MM-DD, hh:mm:ss'),
                                  "dose_given":$('#dose-given-'+itemId).val(), "mar_notes":$('#reason-giving-'+itemId).val(), "false_reason":""})
      } else {
        alert("You cannot give a higher dose than Prescribed!")
      }
    } else if (doseGivenSum != parseFloat(itemToAdminister.dose_prescribed)) {
      administrationsToSend.push({"item_id":itemId, "due_date":moment().format('YYYY-MM-DD'), "dose_prescribed":itemToAdminister.dose_prescribed, "user_id":parsed.user.id, "administered_at":moment().format('YYYY-MM-DD, hh:mm:ss'),
                                  "dose_given":$('#dose-given-'+itemId).val(), "mar_notes":$('#reason-giving-'+itemId).val(), "slot_time":slotTime, "false_reason":""})
    }
    else {
      alert("You cannot give anymore doses than Prescribed!")
    }
  }
  $('.modal').modal('hide')
}

function checkDoseAdminAgainstDoseGiven(patient, itemId, slotTime) {
  doseGivenArr = []
  // slotTime = patient.todays_administrations.find(x => x.item_id === itemId).slot_time
  itemsCurrentAdministrations = patientsDataStructureCreated[patient.id][slotTime].Items[itemId].administrations
  itemsCurrentAdministrations.forEach(function(item){
    doseGivenArr.push(item.dose_given)
  })

  if (doseGivenArr.length > 1) {
    doseGivenArr.map(function(dose){
      return parseFloat(dose)
    }).reduce(function(a,b){
      doseGivenSum = (a + b)
      return doseGivenSum
    })
  } else {
    doseGivenArr.map(function(dose){
      doseGivenSum = parseFloat(dose)
      return doseGivenSum
    })
  }
}

function updatePatientAdministrations(patient) {
  $.ajax({
    type: 'POST',
    url: "http://localhost:3000/api/patients/"+patient.id+"/administrations.json",
    headers: {
      "Authorization":  "Token token="+authKey
    },
    data: JSON.stringify(
      {"administrations": administrationsToSend}
    ),
    dataType: 'json',
    contentType: 'application/json',
    // data: patientAdministrationsStructure(patient),
    success: function(status){
      console.log("administration posted successfully")
      console.log(status.errors)
      retrieveUpdatedPatientData(patient)
      // displayPatientTodayMedications(patient)
      administrationsToSend = []
    },
    error: function(xhr, status, error) {
      console.log("error "+error)
      console.log("status "+status)
      console.log("xhr "+xhr)
      // $(".results").html(error + " " + status)
      // $(".canvas .col-sm").append("<p style='color:red;margin-top:10px;'>"+JSON.parse(loginRequest.responseText).errors[0].details+"</p>")
      // console.log(JSON.parse(loginRequest.responseText).errors[0].details)
    }
  })
}

function displayPatientAdministrationNotes(patient, time, itemId) {
  patientsDataStructureCreated[patient.id][time].Items[itemId].administrations.forEach(function(admin){
    if (admin.administered_at != null) {
      if (admin.slot_time != "PRN")
        patientInfo+="<b>"+moment(admin.administered_at).format('hh:mm')+" "+admin.user_fullname+" "+"DOSE:"+admin.dose_prescribed+" "+"TAKEN:"+admin.dose_given+"</b>"+"<br>"
      else {
        patientInfo+="<b>"+moment(admin.administered_at).format('hh:mm')+" "+admin.user_fullname+" "+"TAKEN:"+admin.dose_given+"</b>"+"<br>"
      }
    }
  })
}

function retrieveUpdatedPatientData(patient) {
  patientData = $.ajax({
    method: "GET",
     url: "http://localhost:3000/api/patients.json?include_detail=true",
     headers: {
      "Authorization":  "Token token="+authKey
     },
     success: function() {
      parsedPatientData = JSON.parse(patientData.responseText)
      createPatientDataStructure()
      showPatient(patient.id)
     },
     contentType: "application/json"
  })
}

function lowStockWarning(itemId) {
  item = patient.this_cycle_items.find(x => x.id === itemId)
  itemQuantityCheckTotal = item.available_quantity / item.checked_in_quantity * 100
  cpLowStockWarning = loginRequest.responseJSON.care_provider.emar_low_stock_warning
  if (itemQuantityCheckTotal <= cpLowStockWarning){
    patientInfo+='<a href="javascript:void(0)" data-toggle="popover" title="Stock Out" data-content="You have zero stock of this item">'+'<i class="fas fa-exclamation-triangle" style="color:red;"></i>'+'</a>'
  }
  $(document).ready(function(){
    $('[data-toggle="popover"]').popover({
      trigger: 'focus'
    });
  });
}

function showSmileyFace(patient, slotTime, itemId){
  patientsDataStructureCreated[patient.id][slotTime].Items[itemId].administrations.forEach(function(admin){
    if (admin.dose_given === admin.dose_prescribed){
      $('#dose-presc-'+itemId).hide()
      $('#administer-'+itemId).hide()
      patientInfo+="<i style='color:green;' class='far fa-smile fa-3x'></i>"
    }
    else {
      patientInfo+="<div id='dose-presc-"+itemId+"' style='padding:12.5px 25px 0 0;'>"
      lowStockWarning(itemId);
      patientInfo+=" "+patientsDataStructureCreated[patient.id][slotTime].Items[itemId].administrations[0].dose_prescribed+"</div>"
      patientInfo+="<div id='administer-"+itemId+"'>"+"<button onclick='medicationAdministration("+itemId+", \""+slotTime+"\")'>"+"<i class='fas fa-check'></i>"+"</button>"+"</div>"
      // patientInfo+="<div id='administer-"+itemId+"' style='padding:12.5px 0 0 0;'>"+"<button onclick='medicationAdministration(patient, "+itemId+")'>"+"<i class='fas fa-check'></i>"+"</button>"+"</div>"
      // patientInfo+="<div id='administer-"+itemId+"' style='padding:12.5px 0 0 0;'>"+"<button onclick='stockOutWarning()'>"+"<i class='fas fa-check'></i>"+"</button>"+"</div>"
    }
  })
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
