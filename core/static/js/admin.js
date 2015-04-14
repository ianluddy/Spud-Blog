var post_list_container, post_list_tmpl, editor, new_post_btn, tag_container;
var tag_tmpl, tag_input, save_post_btn, title_input, publish_input, post_editor, post_body;
$(document).ready(function() {
    cache_elements();
    load_post_list();
    add_handlers();
    create_editor();
});

/**** Cache ****/

function cache_elements(){
    new_post_btn = $("#new_post");
    save_post_btn = $("#save_post_btn");
    post_list_container = $("#post_preview_list");
    tag_container = $("#tag_container");
    tag_input = $("#tag_input");
    title_input = $("#title_input");
    post_editor = $("#post_editor");
    post_body = $("#post_body");
    publish_input = $("#publish_switch");
    post_list_tmpl = Handlebars.compile($("#post_preview_tmpl").html());
    tag_tmpl = Handlebars.compile($("#tag_tmpl").html());
}

/**** Handlers ****/

function add_handlers(){
    $(new_post_btn).on("click", new_post);
    $(save_post_btn).on("click", save_post);
    $(tag_input).keypress(function(event){
        if( event.keyCode == 13){
            draw_tag($(tag_input).val());
            $(tag_input).val("");
        }
    });
}

/**** Editor ****/

function create_editor(){
    editor = textboxio.replace('#post_body');
}

function draw_tag(tag){
    $(tag_container).append(tag_tmpl(tag));
}

function get_tags(){
    var tags = [];
    $(tag_container).find(".label").each(function(dom){
        tags.push($(this).text());
    });
    return tags;
}

function get_title(){
    return $(title_input).val();
}

function get_published(){
    return $(publish_input).find("input").is(":checked");
}

function get_id(){
    return $(post_editor).attr("current_post_id");
}

function save_post(){
    $.ajax({
        url: "update_post",
        data:{
            "id": get_id(),
            "title": get_title(),
            "body": editor.content.get(),
            "tags": JSON.stringify(get_tags()),
            "publish": get_published()
        }
    }).success(load_post_list);
}

/**** Posts ****/

function load_post_list(){
    $.ajax({
        url: "posts",
        data:{
            "titles_only": true
        }
    }).done(draw_post_list);
}

function draw_post_list(posts){
    $(post_list_container).find(".post_preview").remove();
    for( var index in posts){
        $(post_list_container).prepend(post_list_tmpl(posts[index]));
    }
    $(post_list_container).find(".post_preview").on("click", select_post);
    $(post_list_container).find(".post_preview").first().click();
    $(post_list_container).find(".post_preview .delete").on("click", delete_post);
}

function new_post(){
    $.ajax({
        url: "update_post"
    }).done(load_post_list);
}

function select_post(){
    $(this).addClass("selected").siblings().removeClass("selected");
    $.ajax({
        url: "posts",
        data: {
            id: $(this).attr("post_id")
        }
    }).success(load_post);
}

function load_post(post){
    var loaded_post = post[0];
    $(post_editor).attr("current_post_id", loaded_post.id); // Load id
    $(title_input).val(loaded_post.title); // Load title
    editor.content.set(loaded_post.body); // Load body
    $(tag_container).find(".label").remove(); // Clear Tags
    for( var index in loaded_post.tags ){
        draw_tag(loaded_post.tags[index]); // Draw Tags
    }
    $(publish_input).find("input").prop("checked", loaded_post.published); // Load published flag
}

function delete_post(){
    if( confirm("Are you sure you want to delete this Post?") ){
        $.ajax({
            url: "delete_post",
            data: {
                id: $(this).attr("post_id")
            }
        }).success(load_post_list);
    }
}