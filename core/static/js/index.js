var post_container, tag_container, paginator_container, post_tmpl, tag_tmpl, paginator_tmpl;
$(document).ready(function() {
    cache_elements();
    load_page_count();
    load_posts();
    load_tags();
});

/**** Cache ****/

function cache_elements(){
    post_container = $("#posts");
    tag_container = $("#tags");
    paginator_container = $("#paginator");

    post_tmpl = Handlebars.compile($("#post_tmpl").html());
    tag_tmpl = Handlebars.compile($("#tag_tmpl").html());
    paginator_tmpl = Handlebars.compile($("#paginator_tmpl").html());
}

/**** Posts ****/

function load_posts(page){
    // Page?
    if( page == undefined )
        page = 0;

    // Tags?
    var tags = get_selected_tags();

    show_loader(post_container);
    $.ajax({
        url: "posts",
        data: {
            tags: JSON.stringify(tags),
            page: page
        }
    }).done(draw_posts);
}

function draw_posts(posts){
    $(post_container).find(".post").remove();
    for( var index in posts){
        $(post_container).prepend(post_tmpl(posts[index]));
    }
    add_post_handlers();
    hide_loader(post_container);
}

function add_post_handlers(){

}

/**** Tags ****/

function load_tags(){
    $.ajax({
        url: "tags"
    }).done(draw_tags);
}

function draw_tags(tags){
    for(var index in tags){
        $(tag_container).prepend(tag_tmpl(tags[index]));
    }
    add_tag_handlers();
}

function add_tag_handlers(){
    function apply_tag_filter(){
        $(this).toggleClass("selected");
        load_posts();
        load_page_count();
    }
    $("#tags > .label").on("click", apply_tag_filter);
}

function get_selected_tags(){
    var tags = [];
    $(tag_container).find(".label.selected").each(function(){
        tags.push($(this).text());
    });
    return tags;
}


/**** Pagination ****/

function load_page_count(){
    // Number of pages depends on tags applied
    var tags = get_selected_tags();
    $.ajax({
        url: "pages",
        type: 'GET',
        data: {tags:JSON.stringify(tags)}
    }).done(draw_paginator);
}

function draw_paginator(page_count){
    $(paginator_container).html(paginator_tmpl({"pages": page_range(page_count)}))
    select_page($(paginator_container).find(".pag").first());
    add_paginator_handlers();
}

function add_paginator_handlers(){
    $(paginator_container).find(".pag").on("click", load_page);
    $(paginator_container).find(".arrow").first().on("click", previous_page);
    $(paginator_container).find(".arrow").last().on("click", next_page);
}

function previous_page(){
    var new_index = $(paginator_container).find(".pag.current").index() - 2;
    if( new_index < 0)
        return
    $(paginator_container).find(".pag").get(new_index).click();
}

function next_page(){
    var new_index = $(paginator_container).find(".pag.current").index();
    var next = $(paginator_container).find(".pag").get(new_index);
    if( next == undefined)
        return
    $(next).click();
}

function select_page(dom){
    $(dom).addClass("current").siblings().removeClass("current");
}

function load_page(){
    select_page($(this));
    var page = parseInt($(this).index()) - 1;
    load_posts(page);
    scroll_to_top();
}