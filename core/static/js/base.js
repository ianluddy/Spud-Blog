var loader_tmpl;
$(document).ready(function() {
    cache_base_elements();
});

function cache_base_elements(){
    loader_tmpl = Handlebars.compile($("#loader_tmpl").html());
}
