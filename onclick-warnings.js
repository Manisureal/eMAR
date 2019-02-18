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
      tcAdminItem = patient.this_cycle_items.find(x => x.id === admin.item_id)
        if (itemId === tcAdminItem.id){
          if (tcAdminItem.is_paracetamol) {
            paracetamolWarning(itemId,slotTime)
          }
        } else if (clickedItem.is_paracetamol) {
            paracetamolWarning(itemId,slotTime)
        }
        else {
          medicationAdministration(itemId,slotTime);
        }
      })
  } else {
    medicationAdministration(itemId,slotTime);
  }
}
