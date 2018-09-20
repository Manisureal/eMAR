var loginRequest;
var authKey;
var patientData;
var retrievePatientImage;

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
    },
    error: function(xhr, status, error) {
      console.log("error"+error)
      console.log("error"+status)
      // $(".results").html(error + " " + status)
      $(".results").html(JSON.parse(loginRequest.responseText).errors[0].details)
      console.log(JSON.parse(loginRequest.responseText).errors[0].details)
    }
    // dataType: "application/json"
  })
}

  // $.when( loginRequest.status == 200 ).then(function( data, textStatus, jqXHR ) {
  // //   alert( jqXHR.status ); // Alerts 200
  // console.log("data"+data)
  // // console.log("textStatus"+textStatus)
  // // console.log("jqXHR"+jqXHR.status)
  //   $(".results").html("You have Signed in Successfully!")
  // });


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
      $(".results").html("You have Signed in Successfully!")
      // $('.canvas').replaceWith(patientData.responseText);
      $('.canvas').replaceWith(displayAllPatients());
     },
     contentType: "application/json"
  });
}

function displayAllPatients() {
  var parsedPatientData = JSON.parse(patientData.responseText)
  parsedPatientData.patients.forEach(function(patient){
    // $('div').append(patient.forenames)
    // $('.canvas').html("YO")
    info="<div>"+patient.forenames+ new Patient(patient.avatar.uuid)+"</div>"
    document.write(info)
  })
}
// patient.retrieveImage(patient.avatar.uuid)

var Patient = function retrieveImage(avatarUuid) {
  this.avatarUuid = avatarUuid;
  var retrievePatientImage = $.ajax({
    method: "GET",
    url: "http://localhost:3000/api/images/"+avatarUuid,
    headers: {
      "Authorization":  "Token token="+authKey
    },
    success: function(argument) {
      console.log("Image Retrieved")
    },
    contentType: "application/json"
  })
}


  // obj.user.auth_token // Retrieves the auth token needed for login

  // obj.errors[0] // This will display any errors if there has been a failure with login credentials


// }).done(function(d) {
//   results = JSON.parse(d.responseText); // redundant as we are not checking for done state anymore
