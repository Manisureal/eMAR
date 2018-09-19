var loginRequest;
var authKey;

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
      $(".results").html("You have Signed in Successfully!")
      parseLoginResponse();

    },
    error: function(xhr, status, error) {
      console.log("error"+error)
      console.log("error"+status)
      $(".results").html(error + " " + status)
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

// $(document).ajaxSuccess(function(){
// })


function parseLoginResponse() {
  parsed = JSON.parse(loginRequest.responseText) // convert string into json readable format
  authKey = parsed.user.auth_token
}

// $.ajax({
//    method: "GET",
//    url: "http://localhost:3000/api/patients.json",
//    headers: {
//     "Authorization":  "Token token="+authKey
//    },
//    success: function() { alert('Success!' + authKey); },
//    contentType: "application/json"
// });



  // obj.user.auth_token // Retrieves the auth token needed for login

  // obj.errors[0] // This will display any errors if there has been a failure with login credentials


// }).done(function(d) {
//   results = JSON.parse(d.responseText); // redundant as we are not checking for done state anymore
