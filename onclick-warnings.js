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
