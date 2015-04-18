function page_range(i){
    return i?page_range(i-1).concat(i):[]
}

function scroll_to_top(func){
    $("html, body").animate({ scrollTop: 0 }, 200, func);
}

function format_timestamp(stamp){
    return moment.unix(stamp).format("MMMM Do YYYY, h:mm:ss a");
}

function show_loader(dom){
    $(dom).append(loader_tmpl());
    $(dom).find(".loader_overlay").fadeIn(200, function(){
        $(dom).find(".loader_overlay .spinner").show();
    });
}

function hide_loader(dom){
    $(dom).find(".loader_overlay").stop().fadeOut(200, function(){
        $(dom).find(".loader_overlay").remove();
    });
}

/**** Handlerbars helpers ****/

Handlebars.registerHelper('hb_stamp', function(timestamp) {
  return new Handlebars.SafeString(format_timestamp(timestamp));
});

Handlebars.registerHelper('eq', function(x, y, options) {
    return x === y ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('uneq', function(x, y, options) {
    return x !== y ? options.fn(this) : options.inverse(this);
});