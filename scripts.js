var loginRequest;
var authKey;
var patientData;
var parsedPatientData;
var patientsDataStructureCreated;
var localStorageHash;
var administrationsToSend = [];
var measurementsToSend = {};
var itemWasteStock = [];
var itemDestroyStock = [];

// $(document).on('click', '.medication-info', function(event) {
//   console.log($(this).data("item-id"))
//   itemId = $(this).data("item-id")
//   medicationAdministration(itemId, null, false)
// });

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
      content+="<img data-mime-type="+patient.avatar.mime_type+" id="+patient.avatar.uuid+" class='patient_image' width='100' style='border-radius:15px;'>";
    } else {
      content+="<img src='eMAR/no-avatar.png' width='100' style='border-radius:15px;'>";
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
    patientInfo+="<img data-mime-type="+patient.avatar.mime_type+" id="+patient.avatar.uuid+" class='patient_image' width='100' style='border-radius:10px;'>";
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
  patientInfo += "<div class='col-sm-6' style='padding-left:0;'>"+"<button style='width:100%;padding: .375rem .75rem;background:#007bff;color:white;' onclick='checkBeforeUpdatingPatientAdministrations()'>SAVE</button>"+"</div>"
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
          // patientInfo+='<a href="javascript:void(0)" class="medication-info medication-info-'+itemId+'" data-item-id="'+itemId+'" onclick="medicationAdministration('+itemId+', \''+slotTime+'\', false)">'
          patientInfo+='<a href="javascript:void(0)" class="medication-info medication-info-'+itemId+'" data-item-id="'+itemId+'" onclick="medicationAdministrationInformation('+itemId+', \''+slotTime+'\')">'
            patientInfo+="<div style='display:flex;justify-content:space-between;border-left: 5px solid black;padding-left:5px;border-bottom: 1px solid black;'>"+"<div>"+"<p style='margin:0;'>"+patientsDataStructureCreated[patient.id].PRN.Items[itemId].item_name+"</p>"
              patientInfo+="<p style='margin:0;'>"+"<i>"+patient.this_cycle_items.find(x => x.id === itemId).instructions+"</i>"+"</p>"
              displayPatientAdministrationNotes(patient, slotTime, itemId)
            patientInfo+="</div>"
          patientInfo+="</a>"
          // patientInfo+="<div style='padding:12.5px 0 0 0;'>"+"<button onclick='medicationAdministration(patient, "+itemId+")'>"+"<i class='fas fa-check'></i>"+"</button>"+"</div>"+"</div>"
          patientInfo+="<div id='prn-admin-"+itemId+"' style='padding:12.5px 0;display:flex;align-items:center;'>"+"<span style='padding-right:12.5px;' >"
          lowStockWarning(itemId)
          patientInfo+="</span>"
          patientInfo+="<span id='dose-"+itemId+"' style='color:#2cc74f;display:none;padding-right:25px;'></span>"
          if (thisCycleItem.available_quantity != 0){
            if (thisCycleItem.is_insulin){
              patientInfo+="<i style='padding-right:15px;' onclick='bloodSugarConfirm("+itemId+",\""+slotTime+"\")' class='fas fa-check fa-lg' id='item-"+itemId+"'></i>"
              patientInfo+="<i onclick='medicationRefusalAdministration("+itemId+")' class='fas fa-times fa-lg'></i>"+"</div>"+"</div>"
            } else {
              patientInfo+="<i style='padding-right:15px;' onclick='medicationAdministration("+itemId+", \""+slotTime+"\")' class='fas fa-check fa-lg' id='item-"+itemId+"'></i>"
              patientInfo+="<i onclick='medicationRefusalAdministration("+itemId+")' class='fas fa-times fa-lg'></i>"+"</div>"+"</div>"
            }
          } else {
            patientInfo+="<i style='padding-right:15px;' onclick='stockOutWarning()' class='fas fa-check fa-lg' id='item-"+itemId+"'></i>"
            patientInfo+="<i onclick='medicationRefusalAdministration("+itemId+")' class='fas fa-times fa-lg'></i>"+"</div>"+"</div>"
          }
          // patientInfo+="<div style='padding:12.5px 0 0 0;'>"+"<button onclick='medicationAdministration("+itemId+")'>"+"<i class='fas fa-check'></i>"+"</button>"+"</div>"+"</div>"
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
        item = patient.this_cycle_items.find(x => x.id === itemId)
        patientInfo+="<div style='display:flex;border-left: 5px solid #"+timeslot.color+";border-bottom: 1px solid #"+timeslot.color+";padding-left:5px;align-items:center;'>"+"<div style='flex-grow:1;'>"
          patientInfo+='<a href="javascript:void(0)" class="medication-info" onclick="medicationAdministrationInformation('+itemId+', \''+slotTime+'\', false)">'
            patientInfo+="<p style='margin:0;'>"+patientsDataStructureCreated[patient.id][slotTime].Items[itemId].item_name+"</p>"
            patientInfo+="<p style='margin:0;'>"+"<i>"+item.instructions+"</i>"+"</p>"
            patientInfo+="<p style='margin:0;'>"+(item.packaging === "original" ? "**NOT IN BLISTER**" : "")+" "+(item.is_fridge_item === true ? "**FRIDGE ITEM**" : "")+"</p>"
            displayPatientAdministrationNotes(patient, slotTime, itemId);
          patientInfo+="</a>"
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
  $('.modal').modal('hide');
  console.log(itemId, slotTime)
  administration = patient.todays_administrations.find(x => x.item_id === itemId && x.slot_time === slotTime && x.slot_time != "PRN") // checking for standard items in todays administration
  administrationPRN = patient.this_cycle_items.find(x => x.id === itemId) // checking for PRN items in this cycle items
  html = '<div class="modal medicationAdministrationModal" tabindex="-1" role="dialog">'
    html+= '<div class="modal-dialog modal-dialog-centered modal-lg" role="document">'
      // if (dosing) {
      html+= '<div class="modal-content">'
        html+= '<div class="modal-header">'
          html+= '<div class="col-6 col-sm-6" style="display:flex;align-items:center;">'
            html += "<div style='padding-right:10px;'>"
              if (patient.avatar != null){
                html+="<img data-mime-type="+patient.avatar.mime_type+" id="+patient.avatar.uuid+" class='patient_image' width='100' style='border-radius:12.5px;'>";
              } else {
                html+="<img src='eMAR/no-avatar.png' width='100' style='border-radius:12.5px;'>";
              }
            html += "</div>"
            html+= "<h5 class='modal-title'>"+patient.forenames+" "+patient.surname+"</h5>"
            html+= '</div>'
            html+= '<div class="col-6 col-sm-6 flex-content">'
              if (administrationPRN.image_url != "") {
                html+= "<img src='http://localhost:3000"+administrationPRN.image_url+"', width=100px, height=100px>"
                // html+= "<p id='missing-med-img'>"+"No description or image available for this item"+"</p>"
              }
            html+= '</div>'
        html+= '</div>'
        html+= '<div class="modal-body">'
          if (administration){
            checkDoseAdminAgainstDoseGiven(patient, administration.item_id, slotTime);
            findAdminItemInThisCycleItems = patient.this_cycle_items.find(x => x.id === administration.item_id)
            switch (findAdminItemInThisCycleItems.dosing == "standard") {
              case findAdminItemInThisCycleItems.is_insulin == true:
                // html += "Yes Insulin"
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administration.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<i>"+"Instructions:"+"</i>"+"</p>"+"<p class='col-6 col-sm-6 flex-content'>"+"<i>"+findAdminItemInThisCycleItems.instructions+"</i>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+findAdminItemInThisCycleItems.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Drug Round"+"</p>"+"<p class='col-sm-6 flex-content'>"+administration.slot_time+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Prescribed"+"</p>"+"<p class='col-sm-6 flex-content'>"+administration.dose_prescribed+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+(administration.dose_given == null ? "<input id='dose-given-"+administration.item_id+"' value='"+administration.dose_prescribed+"'>"+"</input>" : "<input id='dose-given-"+administration.item_id+"' value="+(parseFloat(administration.dose_prescribed) - doseGivenSum).toFixed(2)+">"+"</input>")+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Previous Site"+"</p>"+"<p class='col-sm-6 flex-content'>"+(patient.last_insulin_site === null ? "No Previous Site Recorded" :  patient.last_insulin_site)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"New INS Site"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='ins-site-"+administration.item_id+"'>"+"</input>"+"</p>"+"</div>"
                break;
              case findAdminItemInThisCycleItems.is_patch == true:
                // html += "I am patch"
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administration.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<i>"+"Instructions:"+"</i>"+"</p>"+"<p class='col-6 col-sm-6 flex-content'>"+"<i>"+findAdminItemInThisCycleItems.instructions+"</i>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+findAdminItemInThisCycleItems.routes+"</p>"+"</div>"
                // html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Drug Round"+"</p>"+"<p class='col-sm-6'>"+administration.slot_time+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Drug Round"+"</p>"+"<p class='col-sm-6 flex-content'>"+slotTime+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Prescribed"+"</p>"+"<p class='col-sm-6 flex-content'>"+administration.dose_prescribed+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+(administration.dose_given == null ? "<input id='dose-given-"+administration.item_id+"' value='"+administration.dose_prescribed+"'>"+"</input>" : "<input id='dose-given-"+administration.item_id+"' value="+(parseFloat(administration.dose_prescribed) - doseGivenSum).toFixed(2)+">"+"</input>")+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Last Patch Location"+"</p>"+"<p class='col-sm-6 flex-content'>"+(findAdminItemInThisCycleItems.last_patch_location === null ? "No Location Recorded" : findAdminItemInThisCycleItems.last_patch_location)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"New Patch Location"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<select id='measurement-val-"+itemId+"'>"+selectTagsForNewPatchLocation()+"</select>"+"</p>"+"</div>"
                break;
              case findAdminItemInThisCycleItems.is_warfarin == true:
                // html += "I am warfarin"
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administration.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<i>"+"Instructions:"+"</i>"+"</p>"+"<p class='col-6 col-sm-6 flex-content'>"+"<i>"+findAdminItemInThisCycleItems.instructions+"</i>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+findAdminItemInThisCycleItems.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Drug Round"+"</p>"+"<p class='col-sm-6 flex-content'>"+administration.slot_time+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"INR Reading"+"</p>"+"<p class='col-sm-6 flex-content'>"+(patient.inr_reading === null ? "Not yet recorded" : patient.inr_reading)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"INR Test Date"+"</p>"+"<p class='col-sm-6 flex-content'>"+(patient.inr_test_date === null ? "Not yet recorded" : patient.inr_test_date)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Prescribed"+"</p>"+"<p class='col-sm-6 flex-content'>"+administration.dose_prescribed+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+(administration.dose_given == null ? "<input id='dose-given-"+administration.item_id+"' value='"+administration.dose_prescribed+"'>"+"</input>" : "<input id='dose-given-"+administration.item_id+"' value="+(parseFloat(administration.dose_prescribed) - doseGivenSum).toFixed(2)+">"+"</input>")+"</p>"+"</div>"
                break;
              default:
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administration.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<i>"+"Instructions:"+"</i>"+"</p>"+"<p class='col-6 col-sm-6 flex-content'>"+"<i>"+findAdminItemInThisCycleItems.instructions+"</i>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+patient.this_cycle_items.find(x => x.id === administration.item_id).routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Drug Round"+"</p>"+"<p class='col-sm-6 flex-content'>"+administration.slot_time+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Prescribed"+"</p>"+"<p class='col-sm-6 flex-content'>"+administration.dose_prescribed+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+(administration.dose_given == null ? "<input id='dose-given-"+administration.item_id+"' value='"+administration.dose_prescribed+"'>"+"</input>" : "<input id='dose-given-"+administration.item_id+"' value="+(parseFloat(administration.dose_prescribed) - doseGivenSum).toFixed(2)+">"+"</input>")+"</p>"+"</div>"
                break;
            }
          } else {
            console.log("administrationPRN"+administrationPRN)
            switch (administrationPRN.dosing == "prn") {
              case administrationPRN.is_insulin == true:
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administrationPRN.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<i>"+"Instructions:"+"</i>"+"</p>"+"<p class='col-6 col-sm-6 flex-content'>"+"<i>"+administrationPRN.instructions+"</i>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+administrationPRN.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='dose-given-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Reason for Giving"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='reason-giving-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Previous Site"+"</p>"+"<p class='col-sm-6 flex-content'>"+(patient.last_insulin_site === null ? "No Previous Site Recorded" :  patient.last_insulin_site)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"New INS Site"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='ins-site-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                break;
              case administrationPRN.is_patch == true:
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administrationPRN.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<i>"+"Instructions:"+"</i>"+"</p>"+"<p class='col-6 col-sm-6 flex-content'>"+"<i>"+administrationPRN.instructions+"</i>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+administrationPRN.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='dose-given-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Reason for Giving"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='reason-giving-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Last Patch Location"+"</p>"+"<p class='col-sm-6 flex-content'>"+(administrationPRN.last_patch_location === null ? "No Location Recorded" : administrationPRN.last_patch_location)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"New Patch Location"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<select id='measurement-val-"+administrationPRN.id+"'>"+selectTagsForNewPatchLocation()+"</select>"+"</p>"+"</div>"
                break;
              case administrationPRN.is_warfarin == true:
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administrationPRN.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<i>"+"Instructions:"+"</i>"+"</p>"+"<p class='col-6 col-sm-6 flex-content'>"+"<i>"+administrationPRN.instructions+"</i>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+administrationPRN.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"INR Reading"+"</p>"+"<p class='col-sm-6 flex-content'>"+(patient.inr_reading === null ? "Not yet recorded" : patient.inr_reading)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"INR Test Date"+"</p>"+"<p class='col-sm-6 flex-content'>"+(patient.inr_test_date === null ? "Not yet recorded" : patient.inr_test_date)+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='dose-given-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Reason for Giving"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='reason-giving-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                break;
              default:
                html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+administrationPRN.medication_name+"</h5>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<i>"+"Instructions:"+"</i>"+"</p>"+"<p class='col-6 col-sm-6 flex-content'>"+"<i>"+administrationPRN.instructions+"</i>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Route"+"</p>"+"<p class='col-sm-6 flex-content'>"+administrationPRN.routes+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Dose Given"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='dose-given-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"Reason for Giving"+"</p>"+"<p class='col-sm-6 flex-content'>"+"<input id='reason-giving-"+administrationPRN.id+"'>"+"</input>"+"</p>"+"</div>"
                break;
            }
          }
        html+= '</div>'
        html+= '<div class="modal-footer">'
          // if (administration) {
          //   if (findAdminItemInThisCycleItems.is_patch){
          //     html+= "<button type='button' class='btn btn-primary confirm' onclick='storePatientAdministrationDataLocally("+administration.item_id+", \""+slotTime+"\"); recordMeasurement("+itemId+");'>"+"CONFIRM"+"</button>"
          //   } else {
          //     html+= "<button type='button' class='btn btn-primary confirm' onclick='storePatientAdministrationDataLocally("+administration.item_id+", \""+slotTime+"\")'>"+"CONFIRM"+"</button>"
          //   }
          //   // html+= "<button type='button' class='btn btn-primary' onclick='storePatientAdministrationDataLocally(patient, "+administration.item_id+")'>"+"CONFIRM"+"</button>"
          // } else {
          //   // html+= "<button type='button' class='btn btn-primary' onclick='storePatientAdministrationDataLocally(patient, "+administrationPRN.id+")'>"+"CONFIRM"+"</button>"
          //   html+= "<button type='button' class='btn btn-primary confirm' onclick='storePatientAdministrationDataLocally("+administrationPRN.id+");'>"+"CONFIRM"+"</button>"
          // }
          html+= "<button type='button' class='btn btn-primary confirm'>"+"CONFIRM"+"</button>"
          html+= '<button type="button" class="btn btn-secondary" data-dismiss="modal">CANCEL</button>'
        html+= '</div>'
      // }
        // medicationAdministrationInformation(itemId, slotTime, dosing);
      html+= '</div>'
    html+='</div>'
  html+='</div>'
  $('#patientMedsChecks').html(html);
  $('.medicationAdministrationModal').modal();
  $('#dose-given-'+administrationPRN.id).focus();
  confirmClickHandler(itemId, slotTime);
  retrievePatientImages();
}

function medicationRefusalAdministration(itemId, slotTime){
  // $('.medicationAdministrationModal').modal('hide');
  $('.modal').modal('hide');
  item = patient.this_cycle_items.find(x => x.id === itemId)
  todaysAdminItem = patient.todays_administrations.find(x => x.item_id === itemId)
  // medicationProtocols = patient.medication_protocols.find(x => x.medication_name === item.medication_name)
  html = '<div class="modal medicationRefusalModal" tabindex="-1" role="dialog">'
    html+= '<div class="modal-dialog modal-dialog-centered modal-lg" role="document">'
      html+= '<div class="modal-content">'
        html+= '<div class="modal-header">'
          html+= '<h5 class="modal-title">'+item.medication_name+'</h5>'
          html+= '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
            html+= '<span aria-hidden="true">&times;</span>'
          html+= '</button>'
        html+= '</div>'
        html+= '<div class="modal-body">'
          html+= '<div class="row">'+'<p class="col-sm-6">'+"Reason"+'</p>'+'<p class="col-sm-6">'+'<select class="float-sm-right" id="reason-'+itemId+'">'
          html+= '<option value="Please Select">'+'Please Select'+'</option>'
          loginRequest.responseJSON.care_provider.mar_keys.forEach(function(mk){
            html+= '<option value="'+mk.description+'" key="'+mk.key+'">'+mk.description+'</option>'
          })
          html+= '</select>'+'</p>'+'</div>'
          if (item.available_quantity === 0){
            html+= '<div class="row">'+'<p class="col-sm-6">'+'Stock'+'</p>'+'<p class="col-sm-6">'//+'<select class="float-sm-right">'
            html+= '<span class="float-sm-right">'+'Stock Out'+'</span>'
            html+= '</p>'+'</div>'
          } else {
            html+= '<div class="row">'+'<p class="col-sm-6">'+'Stock'+'</p>'+'<p class="col-sm-6">'+'<select class="float-sm-right" id="stock-val-'+itemId+'">'
            stockValues = ['Retain','Waste','Destroy']
            stockValues.forEach(function(sv){
              html+= '<option value="'+sv+'">'+sv+'</option>'
            })
            html+= '</select>'+'</p>'+'</div>'
          }
          if (item.dosing === "prn") {
            html+= '<div class="row quantity">'+'<p class="col-sm-6">'+'Quantity'+'</p>'+'<p class="col-sm-6">'+'<input class="float-sm-right" id="quantity-'+itemId+'">'+'</input>'+'</p>'+'</div>'
          } else {
            checkDoseAdminAgainstDoseGiven(patient, itemId, slotTime)
            html+= '<div class="row quantity">'+'<p class="col-sm-6">'+'Quantity'+'</p>'+'<p class="col-sm-6">'+'<input class="float-sm-right" id="quantity-'+itemId+'" value="'+((todaysAdminItem.dose_given === null) ? todaysAdminItem.dose_prescribed : (parseInt(todaysAdminItem.dose_prescribed) - doseGivenSum))+'">'+'</input>'+'</p>'+'</div>'
          }
          html+= '<div class="row">'+'<p class="col-sm-6">'+'Notes'+'</p>'+'<p class="col-sm-6">'+'<input class="float-sm-right" id="reason-giving-'+itemId+'">'+'</input>'+'</p>'+'</div>'
        html+= '</div>'
        html+= '<div class="modal-footer">'
          html+= "<button type='button' class='btn btn-primary confirm'>"+"CONFIRM"+"</button>"
          // html+= "<button type='button' class='btn btn-primary' onclick='storePatientAdministrationDataLocally("+item.id+", \""+slotTime+"\")'>"+"CONFIRM"+"</button>"
          html+= '<button type="button" class="btn btn-secondary" data-dismiss="modal">CANCEL</button>'
        html+= '</div>'
        // medicationAdministrationInformation(itemId, slotTime, "Refusal");
      html+= '</div>'
    html+= '</div>'
  html+= '</div>'
  $('#patientMedsChecks').html(html);
  $('.medicationRefusalModal').modal();
  $('#reason-giving-'+item.id).focus();
  $(document).ready(()=>{
    $('.quantity').hide()
  })
  $('#stock-val-'+itemId).change(() => {
    if ($('#stock-val-'+itemId).val() != "Retain") {
      $('.quantity').fadeIn('slow')
      $('#quantity-'+itemId).focus()
    } else {
      $('.quantity').hide()
    }
  })
  $('.confirm').click(() => {
    checkForValidations(itemId)
    if (storeAdministration){
      storePatientAdministrationDataLocally(itemId, slotTime)
      recordItemStock(itemId)
    }
  })
}

function confirmClickHandler(itemId, slotTime){
  $('.confirm').on("click",function() {
    checkForValidations(itemId);
    if (storeAdministration) {
      // item is defined elsewhere in a different function but is accessible through the functions //
      if (item.is_patch || item.is_insulin) {
        storePatientAdministrationDataLocally(itemId, slotTime)
        recordMeasurement(itemId)
      } else {
        storePatientAdministrationDataLocally(itemId, slotTime)
      }
    }
  })
}

function checkForValidations(itemId){
  storeAdministration = false
  if ($('#dose-given-'+itemId).val() === "") {
    alert("You must enter a dose to be given.")
    $('#dose-given-'+itemId).focus()
  } else if ($('#measurement-val-'+itemId).val() === "") {
    alert("You must select a new patch location.")
    $('#measurement-val-'+itemId).focus()
  } else if (item.dosing === "prn" && $('#reason-giving-'+itemId).val() === "") {
    alert("You must give a reason.")
    $('#reason-giving-'+itemId).focus()
  } else if ($('#reason-'+itemId).val() === "Please Select") {
    alert("You must select enter a reason.")
    $('#reason-'+itemId).focus()
  } else if ($('#ins-site-'+itemId).val() === "") {
    alert("You must enter a new site.")
    $('#ins-site-'+itemId).focus()
  } else if ($('#val-'+itemId).val() === ""){
    alert("You must enter a value.")
    $('#val-'+itemId).focus()
  } else if ($('#bs-site-'+itemId).val() === ""){
    alert("You must enter a site.")
    $('#bs-site-'+itemId).focus()
  } else {
    storeAdministration = true
  }
}

function medicationAdministrationInformation(itemId, slotTime) {
  $('.modal').modal('hide')
  item = patient.this_cycle_items.find(x => x.id === itemId)
  ydayAdmin = patient.yesterdays_administrations.find(x => x.administered_at === item.last_administration && x.administered_at != null && x.item_id === itemId)
  todaysAdmin = patient.todays_administrations.find(x => x.administered_at === item.last_administration && x.administered_at != null && x.item_id === itemId)

  // if the code on the backend in the app is not fixed to ignore refused medication from item.last_administration then we will need to use the following instead //
    // todaysAdmin = patient.todays_administrations.filter(x => x.item_id === itemId && x.false_reason === null && x.administered_at != null)
    // todaysAdmin[todaysAdmin.length-1]
  // can create a .last function to use in jquery on anything //
    // Array.prototype.last = function() {return this[this.length-1];}

  // if (item.dosing == "prn") {
  //   administration = patientsDataStructureCreated[patient.id]["PRN"].Items[itemId].administrations.find(x => x.administered_at === item.last_administration)
  // } else {
  //   administration = patientsDataStructureCreated[patient.id][slotTime].Items[itemId].administrations.find(x => x.administered_at === item.last_administration)
  // }
  html = '<div class="modal medicationAdministrationInformationModal" tabindex="-1" role="dialog">'
    html+= '<div class="modal-dialog modal-dialog-centered modal-lg" role="document">'
      html+= '<div class="modal-content">'
        html+= '<div class="modal-body">'
          html+= "<h5 class='modal-title' style='padding-bottom:10px;'>"+"Medication Information"+"<span style='font-weight:200;' >"+"("+item.medication_name+")"+"</span>"+"</h5>"
          html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Instructions:"+"</b>"+"</p>"+"<p class='col-6 col-sm-6'>"+item.instructions+"</p>"+"</div>"
          if (item.image_url == "") {
            html+= "<div class='row'>"+"<div class='col-6 col-sm-6' style='display:flex;justify-content:space-around;align-items:center;'>"+"<p id='missing-med-img'>"+"No description or image available for this item"+"</p>"+"</div>"
            // html+= "<div class='row'>"+"<p class='col-6 col-sm-6' style='display:flex;justify-content:space-around;align-items:center;border:1px solid beige;background:antiquewhite;'>"+"No description or image available for this item"+"</p>"
            html+= "<p class='col-6 col-sm-6' style='display:flex;justify-content:space-around;align-items:center;'>"+item.mandatory_instructions+"</p>"+"</div>"
          } else {
            html+= "<div class='row'>"+"<p class='col-6 col-sm-6' style='display:flex;justify-content:space-around;'>"+"<img src='http://localhost:3000"+item.image_url+"'>"+"</p>"+"<p class='col-6 col-sm-6' style='display:flex;align-items:center;'>"+item.mandatory_instructions+"</p>"+"</div>"
          }
          html+= '<button type="button" class="btn btn-info" style="margin-bottom:1rem;" onclick="medicationProtocols('+item.id+', \''+slotTime+'\');">PROTOCOLS</button>'
          html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Indications:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+item.indications+"</p>"+"</div>"
          html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Route:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+item.routes+"</p>"+"</div>"
          // html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Last Taken:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+"<b>"+"DOSE:"+"</b>"+administration.dose_given+"<b>"+" DATE:"+"</b>"+moment(item.last_administration).format('DD-MMM-YYYY')+"<b>"+" TIME:"+"</b>"+moment(item.last_administration).format('hh:mm:ss')+"<b>"+" USER:"+"</b>"+administration.user_fullname+"</p>"+"</div>"

          if (todaysAdmin != undefined) {
            if (todaysAdmin.false_reason === null || todaysAdmin.false_reason === ""){
              html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Last Taken:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+"DOSE:"+todaysAdmin.dose_given+" DATE:"+moment(item.last_administration).format('DD-MMM-YYYY')+" TIME:"+moment(item.last_administration).format('hh:mm:ss')+" USER:"+todaysAdmin.user_fullname+"</p>"+"</div>"
              html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Notes:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+(todaysAdmin.mar_notes === null ? "None" : todaysAdmin.mar_notes)+"</p>"+"</div>"
            // } else if (todaysAdmin.false_reason === null) {
            //   html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Last Taken:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+"Never"+"</p>"+"</div>"
            } else {
              html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Last Taken:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+"DATE:"+moment(item.last_administration).format('DD-MMM-YYYY')+" TIME:"+moment(item.last_administration).format('hh:mm:ss')+"</p>"+"</div>"
            }
          } else if (ydayAdmin != undefined) {
              if (ydayAdmin.false_reason === null || ydayAdmin.false_reason ===  ""){
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Last Taken:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+"DOSE:"+ydayAdmin.dose_given+" DATE:"+moment(item.last_administration).format('DD-MMM-YYYY')+" TIME:"+moment(item.last_administration).format('hh:mm:ss')+" USER:"+ydayAdmin.user_fullname+"</p>"+"</div>"
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Notes:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+(ydayAdmin.mar_notes === null ? "None" : ydayAdmin.mar_notes)+"</p>"+"</div>"
              // } else if (ydayAdmin.false_reason === null) {
                // html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Last Taken:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+"Never"+"</p>"+"</div>"
              } else {
                html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Last Taken:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+"DATE:"+moment(item.last_administration).format('DD-MMM-YYYY')+" TIME:"+moment(item.last_administration).format('hh:mm:ss')+"</p>"+"</div>"
              }
          } else {
            if (item.last_administration === null) {
              html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Last Taken:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+"Never"+"</p>"+"</div>"
            } else {
              html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Last Taken:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+"DATE:"+moment(item.last_administration).format('DD-MMM-YYYY')+" TIME:"+moment(item.last_administration).format('hh:mm:ss')+"</p>"+"</div>"
            }
          }

          if (item.is_insulin) {
            html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"LAST INS SITE: "+"</b>"+"</p>"+"<p class='col-sm-6'>"+(patient.last_insulin_site == null ? "" : patient.last_insulin_site)+"</p>"+"</div>"
          }

          todaysDoseTimes(itemId); // can access doseTimesHash now
          if (Object.getOwnPropertyNames(doseTimesHash).length != 0) {
            html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Today's Dose Times:"+"</b>"+"</p>"
            html+= "<div class='col-sm-6'>"
            Object.values(doseTimesHash[itemId]).forEach(function(doseTime){
              html+= "<p style='background-color:#"+doseTime.color+";color:"+getTextColorContrastYIQ(doseTime.color)+"' class='dose-time'>"+doseTime.show_as + "(" + doseTime.time + ") " + " DOSE:" + doseTime.dose_presc+"</p>"
            })
            html+= "</div>"
            html+= "</div>"
          }
          html+= "<div class='row'>"+"<p class='col-sm-6'>"+"<b>"+"Item Id:"+"</b>"+"</p>"+"<p class='col-sm-6'>"+item.id+"</p>"+"</div>"
        html+= '</div>'
      html+= '</div>'
     html+='</div>'
  html+='</div>'
  $('#patientMedsChecks').html(html);
  $('.medicationAdministrationInformationModal').modal();
}

function getTextColorContrastYIQ(hexcolor){
  var r = parseInt(hexcolor.substr(0,2),16);
  var g = parseInt(hexcolor.substr(2,2),16);
  var b = parseInt(hexcolor.substr(4,2),16);
  var yiq = ((r*299)+(g*587)+(b*114))/1000;
  return (yiq >= 128) ? 'black' : 'white';
}

function todaysDoseTimes(itemId){
  doseTimesHash = {}
  patient.todays_administrations.filter(x => x.item_id === itemId).forEach(function(a){
    patient.time_slots.forEach(function(ts){
      if (a.slot_time === ts.time) {
        if (doseTimesHash[a.item_id] == null) {
          doseTimesHash[a.item_id] = {[ts.time]: {"time":ts.time,"show_as":ts.show_as,"color":ts.color,"dose_presc":a.dose_prescribed}}
        } else {
          doseTimesHash[a.item_id][ts.time] = {"time":ts.time,"show_as":ts.show_as,"color":ts.color,"dose_presc":a.dose_prescribed}
        }
      }
    })
  })
}

function medicationProtocols(itemId, slotTime) {
  // $('.medicationAdministrationModal').modal('hide');
  $('.modal').modal('hide');
  // assigning var next to variables as we are using variable name same as function name //
  var item = patient.this_cycle_items.find(x => x.id === itemId)
  var medicationProtocols = patient.medication_protocols.find(x => x.medication_name === item.medication_name)
  html = '<div class="modal medicationProtocolModal" tabindex="-1" role="dialog">'
    html+= '<div class="modal-dialog modal-dialog-centered" role="document">'
      html+= '<div class="modal-content">'
        html+= '<div class="modal-header">'
          html+= '<h5 class="modal-title">Medication Protocols</h5>'
          html+= '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
            html+= '<span aria-hidden="true">&times;</span>'
          html+= '</button>'
        html+= '</div>'
        html+= '<div class="modal-body">'
        if (medicationProtocols === undefined) {
          html+= "This Medication has no protocols defined."
        } else {
          medicationProtocols.medication_protocol_qas.forEach(function(mpQas){
            html+= '<p>'+mpQas.question+'</p>'
            html+= '<p>'+'<b>'+mpQas.answer+'</b>'+'</p>'
          })
        }
        html+= '</div>'
      html+= '</div>'
    html+= '</div>'
  html+= '</div>'
  $('#patientMedsChecks').html(html);
  $('.medicationProtocolModal').modal();
  $('.close').click(function(){
    // if (dosing === true || dosing == false) {
    // if (dosing == true) {
    //   medicationAdministration(itemId, slotTime, dosing)
    // } else if (dosing == false) {
    //   medicationAdministrationInformation(itemId, slotTime, dosing)
    // } else if (dosing == undefined) {
    //   medicationRefusalAdministration(itemId, slotTime)
    // }
    medicationAdministrationInformation(itemId, slotTime)
  })
}

function selectTagsForNewPatchLocation() {
  optionsArray = ["Ear Behind Left", "Ear Behind Right", "Arm Left Upper", "Arm Right Upper", "Chest Left", "Chest Right", "Back Left Upper", "Back Right Upper",
                  "Back Left Lower", "Back Right Lower", "Knee Behind Left", "Knee Behind Right"]
  result = []
  result += "<option value=''>"+"Please Select"+"</option>"
  optionsArray.forEach(function(option){
    result += "<option value='"+option+"'>"+option+"</option>"
  })
  return result
}

function storePatientAdministrationDataLocally(itemId, slotTime) {
  if (patient.this_cycle_items.find(x => x.id === itemId).dosing == "prn"){
    // Push PRN administered items into an array ready to be sent to the server for an items administration to be created //
    administrationsToSend.push({"item_id":itemId, "due_date":moment().format('YYYY-MM-DD'), "dose_prescribed":$('#dose-given-'+itemId).val(), "user_id":parsed.user.id,
                              "administered_at":moment().format('YYYY-MM-DD, hh:mm:ss'), "dose_given":$('#dose-given-'+itemId).val(), "mar_notes":$('#reason-giving-'+itemId).val(), "false_reason":$('#reason-'+itemId+' option:selected').attr('key')})
    $('.modal').modal('hide')
  } else {
    // Push Non-PRN administered items into an array ready to be sent to the server for an items administration to be created //
    itemToAdminister = patientsDataStructureCreated[patient.id][slotTime].Items[itemId].administrations.find(x => x.item_id === itemId)
    checkDoseAdminAgainstDoseGiven(patient, itemId, slotTime);
    if (itemToAdminister.dose_given == null) {
      if ($('#dose-given-'+itemId).val() <= itemToAdminister.dose_prescribed){
        administrationsToSend.push({"id":itemToAdminister.id, "user_id":parsed.user.id, "administered_at":moment().format('YYYY-MM-DD, hh:mm:ss'),
                                  "dose_given":$('#dose-given-'+itemId).val(), "mar_notes":$('#reason-giving-'+itemId).val()})//, "false_reason":""})
        $('.modal').modal('hide')
      } else if ($('#dose-given-'+itemId).val() > itemToAdminister.dose_prescribed) {
          alert("You cannot give a higher dose than Prescribed!")
      } else {
          administrationsToSend.push({"id":itemToAdminister.id, "user_id":parsed.user.id, "administered_at":moment().format('YYYY-MM-DD, hh:mm:ss'),
                                   "mar_notes":$('#reason-giving-'+itemId).val(), "false_reason":$('#reason-'+itemId+' option:selected').attr('key')})
          $('.modal').modal('hide')
      }

    } else if (doseGivenSum != parseFloat(itemToAdminister.dose_prescribed)) {
        // if ($('#reason-'+itemId+' option:selected').attr('key') != undefined){
        administrationsToSend.push({"item_id":itemToAdminister.item_id, "due_date":moment().format('YYYY-MM-DD'), "dose_prescribed":itemToAdminister.dose_prescribed, "user_id":parsed.user.id, "administered_at":moment().format('YYYY-MM-DD, hh:mm:ss'),
                                 "dose_given":$('#dose-given-'+itemId).val(), "mar_notes":$('#reason-giving-'+itemId).val(), "slot_time":slotTime,  "false_reason":$('#reason-'+itemId+' option:selected').attr('key')})
        $('.modal').modal('hide')
        // } else {
        //   administrationsToSend.push({"item_id":itemId, "due_date":moment().format('YYYY-MM-DD'), "dose_prescribed":itemToAdminister.dose_prescribed, "user_id":parsed.user.id, "administered_at":moment().format('YYYY-MM-DD, hh:mm:ss'),
        //                               "dose_given":$('#dose-given-'+itemId).val(), "mar_notes":$('#reason-giving-'+itemId).val(), "slot_time":slotTime})//, "false_reason":""})
        //   $('.modal').modal('hide')
        // }
    } else {
      alert("You cannot give anymore doses than Prescribed!")
    }
  }
  // $('.modal').modal('hide')
}

function highlightCurrentAdminsGreen(){
  administrationsToSend.forEach((a)=>{
    if (a.item_id != undefined){
      // thisCycItem = patient.this_cycle_items.find(x => x.id === a.item_id)
      // thisCycItem.dosing
      $('#item-'+a.item_id).css("color","#2cc74f")
      $('#dose-'+a.item_id).css("display","block").text(a.dose_given)
      // $('#prn-admin-'+a.item_id).prepend(doseGiven)
    } else {
      tdyAdminItem = patient.todays_administrations.find(x => x.id === a.id)
      // thisCycItem = patient.this_cycle_items.find(x => x.id === tdyAdminItem.item_id)
      $('#item-'+tdyAdminItem.item_id).css("color","#2cc74f")
      $('#dose-presc-'+tdyAdminItem.item_id).css("color","#2cc74f")
      $('#dose-presc-'+tdyAdminItem.item_id).text(a.dose_given)
      // thisCycItem.dosing
    }
  })
}

function bloodSugarConfirm(itemId, slotTime){
  html = '<div class="modal bloodSugarConfirmModal" tabindex="-1" role="dialog">'
    html+= '<div class="modal-dialog modal-dialog-centered" role="document">'
      html+= '<div class="modal-content">'
        html+= '<div class="modal-header">'
          html+= '<h5 class="modal-title">Record Blood Sugar?</h5>'
          html+= '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
            html+= '<span aria-hidden="true">&times;</span>'
          html+= '</button>'
        html+= '</div>'
        html+= '<div class="modal-body">'
          html+= '<p>Do you want to record a Blood Sugar reading for this patient?</p>'
        html+= '</div>'
        html+= '<div class="modal-footer">'
          html+= '<button type="button" class="btn btn-danger" data-dismiss="modal" onclick="medicationAdministration('+itemId+', \''+slotTime+'\')">NO</button>'
          html+= '<button type="button" class="btn btn-success" onclick="bloodSugarAdmin('+itemId+', \''+slotTime+'\')">YES</button>'
        html+= '</div>'
      html+= '</div>'
    html+= '</div>'
  html+= '</div>'
  $('#patientMedsChecks').html(html);
  $('.bloodSugarConfirmModal').modal();
}

function bloodSugarAdmin(itemId, slotTime){
  $('.modal').modal('hide')
  html = '<div class="modal bloodSugarConfirmModal" tabindex="-1" role="dialog">'
    html+= '<div class="modal-dialog modal-lg modal-dialog-centered" role="document">'
      html+= '<div class="modal-content">'
        html+= '<div class="modal-header">'
          html+= '<h5 class="modal-title">Update Measurement</h5>'
          html+= '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
            html+= '<span aria-hidden="true">&times;</span>'
          html+= '</button>'
        html+= '</div>'
        html+= '<div class="modal-body">'
          html+= '<h6 class="modal-title" style="margin-bottom:1rem;">Enter new Blood Sugar reading</h6>'
          html+= '<div class="row"> <p class="col-sm-6"> New Value:</p> <p class="col-sm-6"><input class="float-sm-right" id="val-'+itemId+'""></input></p> </div>'
          html+= '<div class="row"> <p class="col-sm-6"> Last BS Site</p> <p class="col-sm-6 float-sm-right"><span class="float-sm-right">'+(patient.last_bs_site === null ? "" : patient.last_bs_site)+'</span></p> </div>'
          html+= '<div class="row"> <p class="col-sm-6"> New BS Site</p> <p class="col-sm-6"><input class="float-sm-right" id="bs-site-'+itemId+'"></input></p> </div>'
        html+= '</div>'
        html+= '<div class="modal-footer">'
          html+= '<button type="button" class="btn btn-danger" data-dismiss="modal">CANCEL</button>'
          // html+= '<button type="button" class="btn btn-success" onclick="recordBloodSugar('+itemId+', \''+slotTime+'\')">CONFIRM</button>'
          html+= '<button type="button" class="btn btn-success confirm">CONFIRM</button>'
        html+= '</div>'
      html+= '</div>'
    html+= '</div>'
  html+= '</div>'
  $('#patientMedsChecks').html(html);
  $('.bloodSugarConfirmModal').modal();
  $('.confirm').click(() => {
    checkForValidations(itemId)
    if (storeAdministration){
      recordBloodSugar(itemId, slotTime)
    }
  })
  $('#val-'+itemId).focus()
}

function recordMeasurement(itemId){
  if (!Object.keys(measurementsToSend).length) {
    if (item.is_patch){
      measurementsToSend = [{ "measurement": { "measurement_name":"Patch Location", "value":$('#measurement-val-'+itemId).val(), "measurement_units":"", "user_id":loginRequest.responseJSON.user.id }, "patient_id":patient.id, "item_id":itemId }]
    } else if(item.is_insulin) {
      measurementsToSend = [{ "measurement": { "measurement_name":"Last Insulin Site", "value":$('#ins-site-'+itemId).val(), "measurement_units":"", "user_id":loginRequest.responseJSON.user.id }, "patient_id":patient.id, "item_id":itemId }]
    }
  } else {
    if (item.is_patch){
      measurementsToSend.push({ "measurement": { "measurement_name":"Patch Location", "value":$('#measurement-val-'+itemId).val(), "measurement_units":"", "user_id":loginRequest.responseJSON.user.id }, "patient_id":patient.id, "item_id":itemId })
    } else if (item.is_insulin){
      measurementsToSend.push({ "measurement": { "measurement_name":"Last Insulin Site", "value":$('#ins-site-'+itemId).val(), "measurement_units":"", "user_id":loginRequest.responseJSON.user.id }, "patient_id":patient.id, "item_id":itemId })
    }
  }
}

function recordBloodSugar(itemId, slotTime){
  if (!Object.keys(measurementsToSend).length) {
      measurementsToSend = [{ "measurement": { "measurement_name":"Last BS Site", "value":$('#bs-site-'+itemId).val(), "measurement_units":"", "user_id":loginRequest.responseJSON.user.id }, "patient_id":patient.id, "item_id":itemId }]
      measurementsToSend.push({ "measurement": { "measurement_name":"Blood Sugar", "value":$('#val-'+itemId).val(), "measurement_units":"mg/dL", "user_id":loginRequest.responseJSON.user.id }, "patient_id":patient.id, "item_id":itemId })
  } else {
      measurementsToSend.push({ "measurement": { "measurement_name":"Last BS Site", "value":$('#bs-site-'+itemId).val(), "measurement_units":"", "user_id":loginRequest.responseJSON.user.id }, "patient_id":patient.id, "item_id":itemId })
      measurementsToSend.push({ "measurement": { "measurement_name":"Blood Sugar", "value":$('#val-'+itemId).val(), "measurement_units":"mg/dL", "user_id":loginRequest.responseJSON.user.id }, "patient_id":patient.id, "item_id":itemId })
  }
  $('.modal').modal('hide')
  medicationAdministration(itemId, slotTime)
}

function recordItemStock(itemId){
  if ($('#stock-val-'+itemId).val() === "Waste") {
    if (!itemWasteStock.length){
      itemWasteStock = [{"quantity":$('#quantity-'+itemId).val(), "patient_id":patient.id, "id":itemId, "item":{}}]
    } else {
      itemWasteStock.push({"quantity":$('#quantity-'+itemId).val(), "patient_id":patient.id, "id":itemId, "item":{}})
    }
  } else if ($('#stock-val-'+itemId).val() === "Destroy") {
      if (!itemDestroyStock.length){
        itemDestroyStock = [{"quantity":$('#quantity-'+itemId).val(), "patient_id":patient.id, "id":itemId, "item":{}}]
      } else {
        itemDestroyStock.push({"quantity":$('#quantity-'+itemId).val(), "patient_id":patient.id, "id":itemId, "item":{}})
      }
  }
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
      if (isNaN(b)){
        doseGivenSum = false
      } else {
        doseGivenSum = (a + b)
        return doseGivenSum
      }
    })
  } else {
    doseGivenArr.map(function(dose){
      doseGivenSum = parseFloat(dose)
      return doseGivenSum
    })
  }
}

function checkForControlledItems(){
  controlledDrugFound = false
  if (administrationsToSend.length > 0) {
    administrationsToSend.forEach((admin)=>{
      if (admin.id === undefined) {
        if (patient.this_cycle_items.find(x => x.id === admin.item_id).is_controlled) {
          controlledDrugFound = true
        }
      } else {
        todaysAdminItem = patient.todays_administrations.find(x => x.id === admin.id).item_id
        if (patient.this_cycle_items.find(x => x.id === todaysAdminItem).is_controlled){
          controlledDrugFound = true
        }
      }
    })
  }
}

function witnessControlledDrugAdmin(){
  $('.modal').modal('hide')
  html = '<div class="modal witnessControlledDrugModal" tabindex="-1" role="dialog">'
    html+= '<div class="modal-dialog modal-dialog-centered" role="document">'
      html+= '<div class="modal-content">'
        html+= '<div class="modal-header">'
          html+= '<h5 class="modal-title">Witness controlled drug administration</h5>'
          html+= '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
            html+= '<span aria-hidden="true">&times;</span>'
          html+= '</button>'
        html+= '</div>'
        html+= '<div class="modal-body">'
          html+= '<div class="row"><p class="col-sm-3">Username</p><p class="col-sm-9"><input name="username" type="text" id="witness-username" style="width:100%"></input></p></div>'
          html+= '<div class="row"><p class="col-sm-3">Password</p><p class="col-sm-9"><input name="password" type="password" id="witness-password" style="width:100%"></input></p></div>'
        html+= '</div>'
        html+= '<div class="modal-footer">'
          html+= '<button type="button" class="btn btn-secondary" data-dismiss="modal">CANCEL</button>'
          html+= '<button type="button" class="btn btn-success witness">WITNESS</button>'
        html+= '</div>'
      html+= '</div>'
    html+= '</div>'
  html+= '</div>'
  $('#patientMedsChecks').html(html);
  $('.witnessControlledDrugModal').modal('show');
  $('#witness-username').focus();
  $('.witness').click((w)=>{
    if ($('#witness-username').val() === "") {
      alert("You must enter a username")
      $('#witness-username').focus()
    } else if ($('#witness-password').val() === "") {
      alert("You must enter a password")
      $('#witness-password').focus()
    } else {
      witnessLogin()
      console.log("Validating Witness")
      // $('.witnessControlledDrugModal').modal('hide')
    }
  })
}

function witnessLogin(){
  $.ajax({
    type: 'POST',
    url: 'http://localhost:3000/api/users/sign_in',
    data: {
      user_login: {
        username : $('#witness-username').val(),
        password : $('#witness-password').val()
      }
    },
    success: function(status){
      if (loginRequest.responseJSON.user.id === status.user.id) {
        alert("The witness cannot be the logged in user.")
      } else {
        controlledDrugFound = false
        $('.witnessControlledDrugModal').modal('hide')
        updatePatientAdministrations(patient)
        console.log("Witness Validated")
      }
    },
    error: function(xhr, status, error) {
      console.log("error: "+error+" status: "+status)
      // if (xhr.status === 401) {
        if (xhr.responseJSON === undefined) {
          console.log(xhr.responseText)
          alert(xhr.responseText)
        } else {
          console.log(xhr.responseJSON.errors[0].details)
          alert(xhr.responseJSON.errors[0].details)
        }
      // }
    }
    // dataType: "application/json"
  })
}

function checkBeforeUpdatingPatientAdministrations(){
  checkForControlledItems();
  if (controlledDrugFound) {
    witnessControlledDrugAdmin();
  } else {
    updatePatientAdministrations(patient)
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
      if (Object.keys(measurementsToSend).length) {
        Object.values(measurementsToSend).forEach(function(measurement){
          createMeasurements(measurement);
        })
      }
      if (itemWasteStock.length > 0){
        itemWasteStock.forEach((wasteItem)=>{
          createItemWasteStock(wasteItem)
        })
      }
      if (itemDestroyStock.length > 0){
        itemDestroyStock.forEach((destroyItem)=>{
          createItemDestroyStock(destroyItem)
        })
      }
      retrieveUpdatedPatientData(patient)
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

function createMeasurements(measurement) {
  $.ajax({
    type: 'POST',
    url: "http://localhost:3000/api/patients/"+patient.id+"/measurements.json",
    headers: {
      "Authorization":  "Token token="+authKey
    },
    data: JSON.stringify(
      measurement
    ),
    dataType: 'json',
    contentType: 'application/json',
    // data: patientAdministrationsStructure(patient),
    success: function(status){
      console.log("measurement posted successfully")
      console.log(status.errors)
      measurementsToSend = {}
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

function createItemWasteStock(wasteItem){
  $.ajax({
    type: 'POST',
    url: "http://localhost:3000/api/patients/"+patient.id+"/items/"+wasteItem.id+"/waste.json",
    headers: {
      "Authorization":  "Token token="+authKey
    },
    data: JSON.stringify(
      wasteItem
    ),
    dataType: 'json',
    contentType: 'application/json',
    // data: patientAdministrationsStructure(patient),
    success: function(status){
      console.log("item waste stock posted successfully")
      console.log(status.errors)
      itemWasteStock = []
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

function createItemDestroyStock(destroyItem){
  $.ajax({
    type: 'POST',
    url: "http://localhost:3000/api/patients/"+patient.id+"/items/"+destroyItem.id+"/destroyed.json",
    headers: {
      "Authorization":  "Token token="+authKey
    },
    data: JSON.stringify(
      destroyItem
    ),
    dataType: 'json',
    contentType: 'application/json',
    // data: patientAdministrationsStructure(patient),
    success: function(status){
      console.log("item destroy stock posted successfully")
      console.log(status.errors)
      itemDestroyStock = []
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
        if (admin.false_reason === null) {
          patientInfo+="<b>"+moment(admin.administered_at).format('hh:mm')+" "+admin.user_fullname+" "+"DOSE:"+admin.dose_prescribed+" "+"TAKEN:"+admin.dose_given+"</b>"+"<br>"
        } else {
          patientInfo+="<b>"+moment(admin.administered_at).format('hh:mm')+" "+admin.user_fullname+" "+"NOT TAKEN"+ " " +"REASON:"+admin.false_reason+"</b>"+"<br>"
        }
      else {
        if (admin.false_reason === null) {
          patientInfo+="<b>"+moment(admin.administered_at).format('hh:mm')+" "+admin.user_fullname+" "+"TAKEN:"+admin.dose_given+"</b>"+"<br>"
        } else {
          patientInfo+="<b>"+moment(admin.administered_at).format('hh:mm')+" "+admin.user_fullname+" "+"NOT TAKEN"+ " " +"REASON:"+admin.false_reason+"</b>"+"<br>"
        }
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
  tickCrossDoseSmilyFlag = false
  checkDoseAdminAgainstDoseGiven(patient,itemId,slotTime)
  item = patient.this_cycle_items.find(x => x.id === itemId)
  patientsDataStructureCreated[patient.id][slotTime].Items[itemId].administrations.forEach(function(admin){
    if (admin.dose_given === admin.dose_prescribed || admin.false_reason != null || admin.dose_prescribed === doseGivenSum.toString() || doseGivenSum === false) {
      $('#dose-presc-'+itemId).hide()
      $('#administer-'+itemId).hide()
      if (tickCrossDoseSmilyFlag === false) {
        patientInfo+="<i style='color:green;' class='far fa-smile fa-3x'></i>"
      }
      tickCrossDoseSmilyFlag = true
    }
    else {
      if (tickCrossDoseSmilyFlag === false) {
        patientInfo+="<div id='dose-presc-"+itemId+"' style='padding:0 25px 0 0;'>"
        lowStockWarning(itemId);
        if (admin.dose_given === null) {
          // patientInfo+=" "+patientsDataStructureCreated[patient.id][slotTime].Items[itemId].administrations[0].dose_prescribed+"</div>"
          patientInfo+=" "+admin.dose_prescribed+"</div>"
        } else {
          // patientInfo+=" "+"<b>"+doseGivenSum+"</b>"+"</div>"
          patientInfo+=" "+"<b>"+parseFloat(admin.dose_prescribed - doseGivenSum).toFixed(2)+"</b>"+"</div>"
        }
        if (item.available_quantity === 0){
          patientInfo+="<div style='padding-right:15px;' id='administer-"+itemId+"'>"+"<i onclick='stockOutWarning()' class='fas fa-check fa-lg'></i>"+"</div>"
          patientInfo+="<div id='administer-"+itemId+"'>"+"<i onclick='medicationRefusalAdministration("+itemId+", \""+slotTime+"\")' class='fas fa-times fa-lg'></i>"+"</div>"
        } else {
          // patientInfo+="<div id='administer-"+itemId+"'>"+"<button onclick='medicationAdministration("+itemId+", \""+slotTime+"\")'>"+"<i class='fas fa-check'></i>"+"</button>"+"</div>"
          if (item.is_insulin){
            patientInfo+="<i style='padding-right:15px;' onclick='bloodSugarConfirm("+itemId+",\""+slotTime+"\")' class='fas fa-check fa-lg' id='item-"+itemId+"'></i>"
            patientInfo+="<div id='administer-"+itemId+"'>"+"<i onclick='medicationRefusalAdministration("+itemId+", \""+slotTime+"\")' class='fas fa-times fa-lg'></i>"+"</div>"
          } else {
            patientInfo+="<div style='padding-right:15px;' id='administer-"+itemId+"'>"+"<i onclick='medicationAdministration("+itemId+", \""+slotTime+"\")' class='fas fa-check fa-lg' id='item-"+itemId+"'></i>"+"</div>"
            patientInfo+="<div id='administer-"+itemId+"'>"+"<i onclick='medicationRefusalAdministration("+itemId+", \""+slotTime+"\")' class='fas fa-times fa-lg'></i>"+"</div>"
          }
        }
      }
      tickCrossDoseSmilyFlag = true
      // patientInfo+="<div id='administer-"+itemId+"' style='padding:12.5px 0 0 0;'>"+"<button onclick='medicationAdministration(patient, "+itemId+")'>"+"<i class='fas fa-check'></i>"+"</button>"+"</div>"
      // patientInfo+="<div id='administer-"+itemId+"' style='padding:12.5px 0 0 0;'>"+"<button onclick='stockOutWarning()'>"+"<i class='fas fa-check'></i>"+"</button>"+"</div>"
    }
  })
}

function stockOutWarning(){
  stockOutWarnHtml = '<div class="modal stockOutWarningModal" tabindex="-1" role="dialog">'
    stockOutWarnHtml+= '<div class="modal-dialog modal-dialog-centered" role="document">'
      stockOutWarnHtml+= '<div class="modal-content">'
        stockOutWarnHtml+= '<div class="modal-header">'
          stockOutWarnHtml+= '<h5 class="modal-title">Stock Out</h5>'
          stockOutWarnHtml+= '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
            stockOutWarnHtml+= '<span aria-hidden="true">&times;</span>'
          stockOutWarnHtml+= '</button>'
        stockOutWarnHtml+= '</div>'
        stockOutWarnHtml+= '<div class="modal-body">'
          stockOutWarnHtml+= '<p>You have zero stock of this item and cannot administer any more.</p>'
        stockOutWarnHtml+= '</div>'
        stockOutWarnHtml+= '<div class="modal-footer">'
          stockOutWarnHtml+= '<button type="button" class="btn btn-secondary" data-dismiss="modal">OK</button>'
        stockOutWarnHtml+= '</div>'
      stockOutWarnHtml+= '</div>'
    stockOutWarnHtml+= '</div>'
  stockOutWarnHtml+= '</div>'
  $('#patientMedsChecks').html(stockOutWarnHtml);
  $('.stockOutWarningModal').modal();
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
