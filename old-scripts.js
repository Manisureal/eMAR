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
