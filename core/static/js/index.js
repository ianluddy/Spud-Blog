var post_container, tag_container, paginator_container, post_tmpl, tag_tmpl, paginator_tmpl;;//, url_post_id;
$(document).ready(function() {
    cache_elements();
    load_page_count();
    load_posts();
    load_tags();
});

/**** Cache ****/

function cache_elements(){
    // Cache DOM elements
    post_container = $("#posts");
    tag_container = $("#tags");
    paginator_container = $("#paginator");

    post_tmpl = Handlebars.compile($("#post_tmpl").html());
    tag_tmpl = Handlebars.compile($("#tag_tmpl").html());
    paginator_tmpl = Handlebars.compile($("#paginator_tmpl").html());
}

/**** Posts ****/

function load_posts(page){
    // Load Posts by page
    show_loader(post_container);
    $.ajax({
        url: "posts",
        data: {
            tags: JSON.stringify(get_selected_tags()),
            page: page == undefined ? 0 : page,
            published_only: true
        }
    }).done(draw_posts);
}

function draw_posts(posts){
    // Draw the Posts we've loaded
    $(post_container).find(".post").remove();
    for (var index in posts) {
        var new_post = posts[index];
        new_post.link = location.href + "#" + new_post.id;
        $(post_container).prepend(post_tmpl(posts[index]));
    }
    hide_loader(post_container);
}

/**** Tags ****/

function load_tags(){
    // Load all Tags
    $.ajax({
        url: "tags"
    }).done(draw_tags);
}

function draw_tags(tags){
    // Draw given Tags
    for(var index in tags){
        $(tag_container).prepend(tag_tmpl(tags[index]));
    }
    add_tag_handlers();
}

function add_tag_handlers(){
    // Tag handlers
    function apply_tag_filter(){
        $(this).toggleClass("selected");
        scroll_to_top();
        load_posts();
        load_page_count();
    }
    $("#tags > .label").on("click", apply_tag_filter);
}

function get_selected_tags(){
    // Get list of selected Tags
    var tags = [];
    $(tag_container).find(".label.selected").each(function(){
        tags.push($(this).text());
    });
    return tags;
}

/**** Pagination ****/

function load_page_count(){
    // Load number of pages (depends on selected Tags)
    $.ajax({
        url: "pages",
        type: 'GET',
        data: {tags:JSON.stringify(get_selected_tags())} // Number of pages depends on tags applied
    }).done(draw_paginator);
}

function draw_paginator(page_count){
    // Add pagination div
    $(paginator_container).html(paginator_tmpl({"pages": page_range(page_count)}))
    select_page($(paginator_container).find(".pag").first());
    add_paginator_handlers();
}

function add_paginator_handlers(){
    // Add pagination div handlers
    $(paginator_container).find(".pag").on("click", load_page);
    $(paginator_container).find(".arrow").first().on("click", previous_page);
    $(paginator_container).find(".arrow").last().on("click", next_page);
}

function previous_page(){
    // Prev page
    var new_index = $(paginator_container).find(".pag.current").index() - 2;
    if( new_index < 0)
        return
    $(paginator_container).find(".pag").get(new_index).click();
}

function next_page(){
    // Next page
    var new_index = $(paginator_container).find(".pag.current").index();
    var next = $(paginator_container).find(".pag").get(new_index);
    if( next == undefined)
        return
    $(next).click();
}

function select_page(dom){
    // Select specific page
    $(dom).addClass("current").siblings().removeClass("current");
}

function load_page(){
    // Load page
    scroll_to_top();
    select_page($(this));
    load_posts(parseInt($(this).index()) - 1);
}
