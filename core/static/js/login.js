var login_button, username_input, password_input;
$(document).ready(function() {
    cache_elements();
    add_handlers();
});

function add_handlers(){
    $(login_button).on("click", log_in);
}

function cache_elements(){
    login_button = $("#login_button");
    username_input = $("#username");
    password_input = $("#password");
}

function log_in(){
    var username = $(username_input).val();
    var password = $(password_input).val();
    $.ajax({
        url: "authenticate",
        data: {
            username: username,
            password: password
        },
        statusCode: {
            403: login_failed,
            200: login_succeeded
        }
    });
}

function login_failed(){
    console.log("fail");
}

function login_succeeded(){
    window.location.href = "/admin";
    location.reload();
}