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

function checkParacetamolAdminsToSend(itemId,slotTime){
  clickedItem = patient.this_cycle_items.find(x => x.id === itemId)
  if (administrationsToSend.length > 0){
    administrationsToSend.forEach((admin)=>{
      if (admin.item_id != undefined) {
        tcAdminItem = patient.this_cycle_items.find(x => x.id === admin.item_id)
        if (itemId === tcAdminItem.id){
          if (tcAdminItem.is_paracetamol) {
            paracetamolWarning(itemId,slotTime)
          }
        } else if (clickedItem.is_paracetamol) {
            paracetamolWarning(itemId,slotTime)
        } else {
            medicationAdministration(itemId,slotTime);
        }
      } else if (admin.item_id === undefined) {
        tdyAdminItem = patient.todays_administrations.find(x => x.id === admin.id) //Find todays admin item using today admin id
        tdyAdminItemInTc = patient.this_cycle_items.find(x => x.id === tdyAdminItem.item_id) //Find todays admin item info in this cycle items using its itme_id
        if (itemId === tdyAdminItemInTc){
          if (tdyAdminItemInTc.is_paracetamol) {
            paracetamolWarning(itemId,slotTime)
          }
        } else if (tdyAdminItemInTc.is_paracetamol) {
              paracetamolWarning(itemId,slotTime)
          } else {
            medicationAdministration(itemId,slotTime);
          }
        }
    })
  } else {
    medicationAdministration(itemId,slotTime);
  }
}

function paracetamolWarning(itemId,slotTime){
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
          html+= '<p>You have already selected a medicine containing paracetamol, are you sure you wish to proceed?</p>'
        html+= '</div>'
        html+= '<div class="modal-footer">'
          html+= '<button type="button" class="btn btn-danger" data-dismiss="modal">NO</button>'
          html+= '<button type="button" class="btn btn-success" onclick="medicationAdministration('+itemId+', \''+slotTime+'\')">YES</button>'
        html+= '</div>'
      html+= '</div>'
    html+= '</div>'
  html+= '</div>'
  $('#patientMedsChecks').html(html);
  $('.paracetamolWarningModal').modal('show');
}
