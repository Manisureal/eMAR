function attemptLogin() {
  var loginRequest = $.ajax({
    type: 'post',
    url: 'https://demo.caremeds.co.uk/api/users/sign_in',
    dataType: "application/json",
    data: {
        user_login: {
          username : $('#user-name').val(),
          password : $('#user-pass').val()
        }
    }
    // console.log("executed");
  })
  console.log("success")
}
// }).done(function(d) {
//   results = JSON.parse(d.responseText); // redundant as we are not checking for done state anymore

var obj = JSON.parse(loginRequest.responseText) // convert string into json readable format

obj.user.auth_token // Retrieves the auth token needed for login

obj.errors[0] // This will display any errors if there has been a failure with login credentials

