var loader_tmpl;
$(document).ready(function() {
    cache_base_elements();
    add_base_handlers();
});

function add_base_handlers(){
    $(about_handle).on("click", toggle_about);
}

function cache_base_elements(){
    about = $("#about");
    about_handle = $("#about_handle");
    loader_tmpl = Handlebars.compile($("#loader_tmpl").html());
}

function toggle_about(){
    if( $(about).hasClass("shown") ){
        $(about).animate({"left": "100%"}, 100);
    }else{
        $(about).animate({"left": "70%"}, 100);
    }
    $(about).toggleClass("shown");
}