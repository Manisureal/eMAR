function displayPatientTodayMedications(patient) {
  timeSlotHash = {};
  todaysAdministrationHash = {};

  patient.time_slots.forEach(function(timeSlot){
    timeSlotHash[timeSlot.time] = [timeSlot.color, timeSlot.show_as]
    // timeslotHash["show_as"] = timeSlot.show_as
  });

  patient.todays_administrations.forEach(function(todaysAdministration){
    if (todaysAdministrationHash[todaysAdministration.slot_time] == null) {
      todaysAdministrationHash[todaysAdministration.slot_time] = []
    }
    todaysAdministrationHash[todaysAdministration.slot_time].push(todaysAdministration)
    console.log(todaysAdministrationHash)
  });

  // Check for medication in this cycle items and only display if it has dosing type PRN
  patientInfo+="<div style='background:black;color:white;padding:10px;'>"+"PRN"+"</div>"
  patient.this_cycle_items.forEach(function(thisCycleItem) {
    if (thisCycleItem.dosing == "prn") {
      patientInfo+="<div style='display:flex;border-left: 5px solid black;padding-left:5px;border-bottom: 1px solid black;'>"+"<div>"+"<p style='margin:0;'>"+thisCycleItem.generic_medication_name+"</p>"
      patientInfo+="<p style='margin:0;'>"+"<i>"+thisCycleItem.instructions+"</i>"+"</p>"+"</div>"+"</div>"
    }
  });
  // patient.todays_administrations.forEach(function(todaysAdministration){
  //   console.log(todaysAdministration)
  //   $.each(timeSlotHash, function(time, arrayOfColorAndShowas){
  //     if (time == todaysAdministration.slot_time) {
  //       patientInfo+="<div style='background: #"+arrayOfColorAndShowas[0]+";padding:10px;margin:-bottom:10px;'>"+"<div>"+arrayOfColorAndShowas[1]+"<span style='float:right;padding:0 25px 0 0;'>"+"Dose"+"</span>"+"</div>"+"</div>"
  //       patientInfo+="<div style='display:flex;border-left: 5px solid #"+arrayOfColorAndShowas[0]+";padding-left:5px;'>"+"<div style='flex-grow:1;'>"+"<p style='margin:0;'>"+todaysAdministration.medication_name+"</p>"
  //       patientInfo+="<p style='margin:0;'>"+"<i>"+patient.this_cycle_items.find(x => x.id === todaysAdministration.item_id).instructions+"</i>"+"</p>"+"</div>"
  //       patientInfo+="<div style='padding:12.5px 25px 0 0;'>"+todaysAdministration.dose_prescribed+"</div>"
  //       patientInfo+="<div style='padding:12.5px 0 0 0;'>"+"<button onclick='medicationAdministration(patient, "+todaysAdministration.id+")'>"+"<i class='fas fa-check'></i>"+"</button>"+"</div>"+"</div>"
  //     };
  //   });
  // });
}



// OLD RETRIEVE PATIENTS IMAGE CODE //
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
// ------------------------------------ //


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

// Store a local copy of the information from Patient Item administrations Modals //
function storePatientAdministrationDataLocally(patient, itemId) {
  localStorageHash = patientsDataStructureCreated
  if (patient.this_cycle_items.find(x => x.id === itemId).dosing == "prn"){
    // Create a local copy of PRN items administration that are being administered, this info will be used to populate info for each items administration //
    if (localStorageHash[patient.id].PRN.Items[itemId].administrations.length == 0) {
      localStorageHash[patient.id].PRN.Items[itemId].administrations = []
    }
    administrationItemId = localStorageHash[patient.id].PRN.Items[itemId].administrations.length
    medicationName = patient.this_cycle_items.find(x => x.id === itemId).medication_name
    localStorageHash[patient.id].PRN.Items[itemId].administrations.push({"id":administrationItemId, "item_id":itemId, "medication_name":medicationName, "dose_given":$('#dose-given-'+itemId).val(),
                                                                                 "mar_notes":$('#reason-giving-'+itemId).val(), "user_fullname":parsed.user.fullname, "administered_at":moment().format('YYYY-MM-DD, hh:mm:ss')})
    // Push PRN administered items into an array ready to be sent to the server for an items administration to be created //
    administrationsToSend.push({"item_id":itemId, "due_date":moment().format('YYYY-MM-DD'), "dose_prescribed":$('#dose-given-'+itemId).val(), "user_id":parsed.user.id,
                              "administered_at":moment().format('YYYY-MM-DD, hh:mm:ss'), "dose_given":$('#dose-given-'+itemId).val(), "mar_notes":$('#reason-giving-'+itemId).val(), "false_reason":""})
  } else {
    // Create a local copy of Non-PRN items administration that are being administered, this info will be used to populate info for each items administration //
    slotTime = patient.todays_administrations.find(x => x.item_id === itemId).slot_time
    itemToAdminister = localStorageHash[patient.id][slotTime].Items[itemId].administrations.find(x => x.item_id === itemId)
    itemToAdminister.dose_given = $('#dose-given-'+itemId).val()
    itemToAdminister.mar_notes = $('#reason-giving-'+itemId).val()
    itemToAdminister.administered_at = moment().format('YYYY-MM-DD, hh:mm:ss')
    itemToAdminister.user_fullname = parsed.user.fullname
    itemToAdminister.user_username = parsed.user.username
    itemToAdminister["user_id"] = parsed.user.id
    // Push Non-PRN administered items into an array ready to be sent to the server for an items administration to be created //
    administrationsToSend.push(itemToAdminister)
  }
  $('.modal').modal('hide')
}

// Old Script used to post items that were administered //
function patientAdministrationsStructure(patient) {
  administrations = {}
  // administrationsToSend = []
  Object.keys(localStorageHash[patient.id]).forEach(function(time){
    Object.keys(localStorageHash[patient.id][time].Items).forEach(function(item){
      localStorageHash[patient.id][time].Items[item].administrations.forEach(function(administration){
        // administrationsToSend.push(item)
        administrations["administrations"] = [administration]
      })
    })
  })
  return administrations
}
