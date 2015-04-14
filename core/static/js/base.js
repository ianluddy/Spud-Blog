var about_handle, about, loader_tmpl;
$(document).ready(function() {
    cache_base_elements();
    add_base_handlers();
});

function cache_base_elements(){
    about = $("#about");
    about_handle = $("#about_handle");
    loader_tmpl = Handlebars.compile($("#loader_tmpl").html());
}

function add_base_handlers(){
    $(about_handle).on("click", toggle_about);
}

function toggle_about(){
    if( $(about).hasClass("shown") ){
        $(about).animate({"left": "100%"}, 100);
    }else{
        $(about).animate({"left": "80%"}, 100);
    }
    $(about).toggleClass("shown");
}