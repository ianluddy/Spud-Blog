var login_button, username_input, password_input, password_prefix, username_prefix;

$(document).ready(function() {
    cache_elements();
    add_handlers();
});

/**** Cache ****/

function cache_elements(){
    login_button = $("#login_button");
    username_input = $("#username");
    password_input = $("#password");
    username_prefix = $(".username.prefix");
    password_prefix = $(".password.prefix");
}

/**** Handlers ****/

function add_handlers(){
    $(login_button).on("click", log_in);
    $(login_button).keypress(function(e){if(e.which == 13){log_in()}});
    $(username_input).keypress(function(e){if(e.which == 13){log_in()}});
    $(password_input).keypress(function(e){if(e.which == 13){log_in()}});
}

/**** Validation ****/

function validate_input(){
    if( $(username_input).val().length < 1 ) {
        $(username_prefix).addClass("login_error");
        alertify.error(login_invalid_username);
        return false;
    }else{
        $(username_prefix).removeClass("login_error");
    }
    if( $(password_input).val().length < 1 ){
        $(password_prefix).addClass("login_error");
        alertify.error(login_invalid_password);
        return false;
    }else{
        $(password_prefix).removeClass("login_error");
    }
    return true;
}

/**** Login ****/

function login_failed(){
    alertify.error(login_error);
}

function login_succeeded(){
    window.location.href = "/admin";
    location.reload();
}

function log_in() {
    if( validate_input() == true ){
        $.ajax({
            url: "authenticate",
            data: {
                username: $(username_input).val(),
                password: $(password_input).val()
            },
            statusCode: {
                403: login_failed,
                200: login_succeeded
            }
        });
    }
}