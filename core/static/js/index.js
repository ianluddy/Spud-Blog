var post_container, tag_container, paginator_container, post_tmpl, tag_tmpl, paginator_tmpl, page_number;
$(document).ready(function() {
    cache_elements();
    load_page_number();
    update_url_page_number();
    load_page_count();
    load_tags();
    load_page(page_number);
});

/**** Cache ****/

function cache_elements(){
    // Cache DOM elements
    post_container = $("#posts");
    tag_container = $("#tags");
    paginator_container = $("#paginator");

    // Cache Templates
    post_tmpl = Handlebars.compile($("#post_tmpl").html());
    tag_tmpl = Handlebars.compile($("#tag_tmpl").html());
    paginator_tmpl = Handlebars.compile($("#paginator_tmpl").html());
}

/**** Location ****/

function load_page_number() {
    // Grab page number from URL bar if available
    page_number = 1;
    if( top.location.hash.length > 0 ) {
        page_number = parseInt(top.location.hash.substring(2, top.location.hash.length));
    }
}

function update_url_page_number(){
    // Update our URL with the current page number if it's missing
    top.location.hash = "#p" + page_number.toString();
}

/**** Posts ****/

function load_posts(){
    // Load Posts by page
    show_loader(post_container);
    update_url_page_number();
    $.ajax({
        url: "posts",
        data: {
            tags: JSON.stringify(get_selected_tags()),
            page: validate_page_number(page_number) - 1,
            published_only: true
        }
    }).done(draw_posts);
}

function draw_posts(posts){
    // If we haven;t actually loaded anything then go back to page 1
    if( posts.length == 0 )
        return load_page(1);

    // Clear out the Posts
    var refresh_fb_widget = false;
    if( $(post_container).find(".post").length > 0 ){
        remove_posts();
        refresh_fb_widget = true;
    }

    // Draw the Posts we've loaded
    for (var index in posts) {
        var new_post = posts[index];
        new_post.link = location.origin + "#" + new_post.id;
        $(post_container).prepend(post_tmpl(posts[index]));
    }

    // Re-generate FB widget
    if( refresh_fb_widget == true ){
        refresh_fb_input();
    }
    hide_loader(post_container);
    highlight_page_selector();
}

function remove_posts(){
    $(post_container).find(".post").remove();
    $(post_container).find(".fb-comments").remove();
}

function refresh_fb_input(){
    var scriptText = 'FB.XFBML.parse();';
    var scriptNode = document.createElement('script');
    scriptNode.appendChild(document.createTextNode(scriptText));
    $("body").append(scriptNode);
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
        scroll_to_top(load_posts);
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
    if( page_count > 0)
        $(paginator_container).html(paginator_tmpl({"pages": page_range(page_count)}));
        add_paginator_handlers();
}

function add_paginator_handlers(){
    // Add pagination div handlers
    $(paginator_container).find(".pag").on("click", select_page);
    $(paginator_container).find(".arrow").first().on("click", previous_page);
    $(paginator_container).find(".arrow").last().on("click", next_page);
}

function previous_page(){
    // Prev page
    var new_index = $(paginator_container).find(".pag.current").index() - 2;
    if( new_index < 0)
        return null;
    $(paginator_container).find(".pag").get(new_index).click();
}

function next_page(){
    // Next page
    var new_index = $(paginator_container).find(".pag.current").index();
    var next = $(paginator_container).find(".pag").get(new_index);
    if( next == undefined)
        return null;
    $(next).click();
}

function select_page(){
    // Select specific page
    load_page(parseInt($(this).index()));
}

function validate_page_number(page_number){
    // Validate selected page number. Revert to 1 if invalid
    try {
        page_number = parseInt(page_number);
        if( page_number < 1 )
            return 1;
        return page_number;
    }
    catch(err) {
        return 1
    }
}

function highlight_page_selector(){
    // Highlight paginator if it was drawn after the Posts were retrieved
    var paginator_element = $(".pag").get(page_number - 1);
    $(paginator_element).addClass("current").siblings().removeClass("current");
}

function load_page(page){
    // Load given page if valid, otherwise load page 1
    page_number = validate_page_number(page);
    scroll_to_top(load_posts);
}
