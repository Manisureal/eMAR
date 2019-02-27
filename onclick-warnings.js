function createParacetamolFlag(){
  patient.this_cycle_items.forEach((item)=>{
    if ( item.generic_medication_name.toLowerCase().includes('paracetamol') ||
         item.medication_name.toLowerCase().includes('paracetamol') ||
         item.mandatory_instructions.toLowerCase().includes('paracetamol')
       ) {
          console.log(item)
          item['is_paracetamol'] = true
         }
  })
}

function checkForCurrentParacetamolAdmins(itemId,slotTime){
  warningMessage = "A medication containing Paracetamol was given less than 4 hours ago, are you sure you wish to proceed?"
  createParacetamolFlag();
  clickedItem = patient.this_cycle_items.find(x => x.id === itemId)
  if ((clickedItem.is_paracetamol)){// && (moment(clickedItem.last_administration).format("YYYY-MM-DD") === moment().format("YYYY-MM-DD"))) {

    paracAdminTimes = []
    latestParacAdmin = null
    patient.this_cycle_items.filter(x => x.is_paracetamol === true && x.last_administration != null && moment(x.last_administration).format("YYYY-MM-DD") === moment().format("YYYY-MM-DD")).forEach((item)=>{
      paracAdminTimes.push(parseInt(moment(item.last_administration).format('HH:mm').split(':').join('')))
      latestParacAdmin = patient.this_cycle_items.find(x => parseInt(moment(x.last_administration).format('HH:mm').split(':').join('')) === paracAdminTimes.sort().reverse()[0])
    })

    if (latestParacAdmin != null){
      itemLastAdmin = moment(latestParacAdmin.last_administration).format('HH:mm').split(':')
      parsedLastAdminTime = parseFloat(itemLastAdmin[0] + itemLastAdmin[1])

      timeNow = moment().format('HH:mm').split(':')
      parsedTimeNow = parseFloat(timeNow[0] + timeNow[1])

      console.log(`Total hours: ${(parsedTimeNow - parsedLastAdminTime) - 40}`)
      console.log(((parsedTimeNow - parsedLastAdminTime ) < 40) ? (parsedTimeNow - parsedLastAdminTime) : ((parsedTimeNow - parsedLastAdminTime) - 40))
      calculateParacetamolAdminTime = ((parsedTimeNow - parsedLastAdminTime ) < 40) ? (parsedTimeNow - parsedLastAdminTime) : ((parsedTimeNow - parsedLastAdminTime) - 40)
      if (calculateParacetamolAdminTime < 240){
        paracetamolWarning(itemId,slotTime,warningMessage,true);
      } else {
        medicationAdministration(itemId,slotTime)
      }
    } else {
      checkParacetamolAdminsToSend(itemId,slotTime)
    }
  } else {
    checkParacetamolAdminsToSend(itemId,slotTime)
  }
}

function checkParacetamolAdminsToSend(itemId,slotTime){
  warningMessage = "You have already selected a medicine containing paracetamol, are you sure you wish to proceed?"
  clickedItem = patient.this_cycle_items.find(x => x.id === itemId)
  if (clickedItem.is_paracetamol){
    if (administrationsToSend.length > 0 && administrationsToSend.filter(x => x.false_reason === undefined).length > 0){
      administrationsToSend.forEach((admin)=>{
        if (admin.item_id != undefined) {
          tcAdminItem = patient.this_cycle_items.find(x => x.id === admin.item_id)
          if (itemId === tcAdminItem.id){
            if (tcAdminItem.is_paracetamol) {
              paracetamolWarning(itemId,slotTime,warningMessage)
            }
          } else if (clickedItem.is_paracetamol) {
              paracetamolWarning(itemId,slotTime,warningMessage)
          } else {
              medicationAdministration(itemId,slotTime);
          }
        } else if (admin.item_id === undefined) {
          tdyAdminItem = patient.todays_administrations.find(x => x.id === admin.id) //Find todays admin item using today admin id
          tdyAdminItemInTc = patient.this_cycle_items.find(x => x.id === tdyAdminItem.item_id) //Find todays admin item info in this cycle items using its itme_id
          if (itemId === tdyAdminItemInTc){
            if (tdyAdminItemInTc.is_paracetamol) {
              paracetamolWarning(itemId,slotTime,warningMessage)
            }
          } else if (tdyAdminItemInTc.is_paracetamol) {
                paracetamolWarning(itemId,slotTime,warningMessage)
            } else {
              medicationAdministration(itemId,slotTime);
            }
          }
      })
    } else {
      medicationAdministration(itemId,slotTime);
    }
  } else {
    medicationAdministration(itemId,slotTime);
  }
}

function paracetamolWarning(itemId,slotTime,warningMessage,checkForCurntParacAdmins){
  $('.modal').modal('hide')
  html = '<div class="modal paracetamolWarningModal" tabindex="-1" role="dialog">'
    html+= '<div class="modal-dialog modal-dialog-centered" role="document">'
      html+= '<div class="modal-content">'
        html+= '<div class="modal-header">'
          html+= '<h5 class="modal-title">Warning</h5>'
          html+= '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'
            html+= '<span aria-hidden="true">&times;</span>'
          html+= '</button>'
        html+= '</div>'
        html+= '<div class="modal-body">'
          html+= '<p>'+warningMessage+'</p>'
        html+= '</div>'
        html+= '<div class="modal-footer">'
          html+= '<button type="button" class="btn btn-danger" data-dismiss="modal">NO</button>'
          if (checkForCurntParacAdmins){
            html+= '<button type="button" class="btn btn-success" onclick="checkParacetamolAdminsToSend('+itemId+', \''+slotTime+'\')">YES</button>'
          } else {
            html+= '<button type="button" class="btn btn-success" onclick="medicationAdministration('+itemId+', \''+slotTime+'\')">YES</button>'
          }
        html+= '</div>'
      html+= '</div>'
    html+= '</div>'
  html+= '</div>'
  $('#patientMedsChecks').html(html);
  $('.paracetamolWarningModal').modal('show');
}

function medicationNotDue(itemId, slotTime){
  itemNotDue = patient.todays_administrations.find(x => x.item_id === itemId && x.slot_time === slotTime &&
              (parseFloat(x.slot_time.split(":").join('')) - 100) > parseFloat(moment().format("HH:mm").split(":").join('')))
  if (itemNotDue) {
    medNotDueWarning(itemNotDue.item_id,itemNotDue.slot_time);
  } else {
    checkForCurrentParacetamolAdmins(itemId,slotTime)
  }
}

function medNotDueWarning(itemId,slotTime){
  bootbox.confirm({
    title: "Warning",
    message: "This medication is not due yet. Are you sure you want to proceed?",
    closeButton: false,
    animate: false,
    buttons: {
        confirm: {
            label: 'YES',
            className: 'btn-success'
        },
        cancel: {
            label: 'NO',
            className: 'btn-danger'
        }
    },
    callback: function (result) {
      insulinAdmin = patient.this_cycle_items.find(x => x.id === itemNotDue.item_id).is_insulin
      if (result){
        if (insulinAdmin) {
          bloodSugarConfirm(itemId,slotTime)
        } else {
          checkForCurrentParacetamolAdmins(itemId,slotTime)
        }
      }
    }
  }).find('.modal-dialog').addClass("modal-dialog-centered")
}

function medAlreadySelected(itemId,slotTime){
  addItemIdToadminsToSend()
  console.log(administrationsToSend)
  if (administrationsToSend.length > 0 && administrationsToSend.find(x => x.itemid === itemId)){
    if (itemId === administrationsToSend.find(x => x.itemid === itemId).itemid){
      medAlreadySelectedWarning(itemId,slotTime);
    } else {
      medicationNotDue(itemId,slotTime);
    }
  } else {
    medicationNotDue(itemId,slotTime);
  }
}

function addItemIdToadminsToSend(){
  if (administrationsToSend.length > 0) {
    administrationsToSend.forEach(function(a2s){
      findItemIdInTdyAdmin = patient.todays_administrations.find(x => x.id === a2s.id)
      if (a2s.id === findItemIdInTdyAdmin.id){
        a2s['itemid'] = findItemIdInTdyAdmin.item_id
      }
    })
  }
}

function medAlreadySelectedWarning(itemId,slotTime){
  bootbox.confirm({
    title: "Warning",
    message: "This medication is in a different round to others already selected, do you wish to proceed?",
    closeButton: false,
    animate: false,
    buttons: {
        confirm: {
            label: 'YES',
            className: 'btn-success'
        },
        cancel: {
            label: 'NO',
            className: 'btn-danger'
        }
    },
    callback: function (result) {
      if (result){
        medicationNotDue(itemId,slotTime)
      }
    }
  }).find('.modal-dialog').addClass("modal-dialog-centered")
}

function medWasGivenLaterThanPreviousSlotTime(itemId,slotTime){
  item = patient.this_cycle_items.find(x => x.id === itemId)
  if (item.last_administration != null || moment(item.last_administration).format("YYYY-MM-DD") === moment().format("YYYY-MM-DD")){

    tdyAdminItem = patient.todays_administrations.find(x => x.administered_at === item.last_administration)
    timeDiffBetweenTimeSlots = (parseFloat(slotTime.split(":").join('')) - parseFloat(tdyAdminItem.slot_time.split(":").join('')))

    timeAllowedBetweenAdmins = (timeDiffBetweenTimeSlots - loginRequest.responseJSON.care_provider.emar_time_allowance_warning_delay) / 100

    calcTimeNowWithLastAdminTime =  (parseFloat(moment().format("HH:mm").split(":").join('')) - parseFloat(moment(tdyAdminItem.administered_at).format("HH:mm").split(":").join(''))) / 100

    if (calcTimeNowWithLastAdminTime <= timeAllowedBetweenAdmins){
      medWasGivenLaterWarning(itemId,slotTime)
    } else {
      medAlreadySelected(itemId,slotTime)
    }
  } else {
    medAlreadySelected(itemId,slotTime)
  }
}
