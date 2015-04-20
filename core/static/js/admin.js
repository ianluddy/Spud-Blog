var post_list_container, post_list_tmpl, editor, new_post_btn, tag_container, about, about_handle, admin_page;
var tag_tmpl, tag_input, save_post_btn, title_input, publish_input, post_editor, post_body, selected_post, log_out_btn;
var unsaved_changes = false;

$(document).ready(function() {
    cache_elements();
    load_post_list();
    create_editor();
    add_handlers();
});

/**** Cache ****/

function cache_elements(){
    // DOM
    admin_page = $("#admin");
    log_out_btn = $("#log_out");
    new_post_btn = $("#new_post");
    save_post_btn = $("#save_post_btn");
    post_list_container = $("#post_preview_list");
    tag_container = $("#tag_container");
    tag_input = $("#tag_input");
    title_input = $("#title_input");
    post_editor = $("#post_editor");
    post_body = $("#post_body");
    publish_input = $("#publish_switch");

    // Templates
    post_list_tmpl = Handlebars.compile($("#post_preview_tmpl").html());
    tag_tmpl = Handlebars.compile($("#editable_tag_tmpl").html());
}

/**** Handlers ****/

function add_handlers(){
    $(new_post_btn).on("click", new_post);
    $(log_out_btn).on("click", log_out);
    $(save_post_btn).on("click", save_post);
    $(title_input).on("change", changes_pending);
    $(title_input).on("keyup", changes_pending);
    $(document.getElementById('editor_iframe').contentWindow.document).keyup(changes_pending);
    $(publish_input).on("click", changes_pending);
    $(tag_input).keypress(function(event){
        if( event.keyCode == 13){
            draw_tag($(tag_input).val());
            $(tag_input).val("");
            changes_pending();
        }
    });
    $(window).unload(function(){
        confirm_changes();
    });
}

/**** Editor ****/

function create_editor(){
    editor = textboxio.replace('#post_body');
    $(".ephox-hare-content-iframe").attr("id", "editor_iframe");
}

function draw_tag(tag){
    $(tag_container).append(tag_tmpl(tag));
    $(tag_container).find(".remove").on("click", remove_tag);
}

function remove_tag(){
    $(this).parent().remove();
    changes_pending();
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
    show_loader(post_editor);
    $.ajax({
        url: "update_post",
        data:{
            "post_id": get_id(),
            "title": get_title(),
            "body": editor.content.get(),
            "tags": JSON.stringify(get_tags()),
            "published": get_published()
        }
    }).success(
        function(){load_post_list(); alertify.success(admin_saved);}
    ).error(
        function(){alertify.error(admin_save_error);}
    )
}

/**** Posts ****/

function load_post_list(){
    // Load the Post preview list
    changes_made();
    hide_loader(post_editor);
    show_loader(admin_page);
    $.ajax({
        url: "posts",
        data:{
            "titles_only": true
        }
    }).done(draw_post_list);
}

function draw_post_list(posts){
    // Draw the Post preview list
    $(post_list_container).find(".post_preview").remove();
    for( var index in posts){
        $(post_list_container).append(post_list_tmpl(posts[index]));
    }
    add_post_list_handlers();
    select_initial_post();
    hide_loader(admin_page);
}

function add_post_list_handlers(){
    // Add handlers for Post previews
    $(post_list_container).find(".post_preview").on("click", select_post);
    $(post_list_container).find(".post_preview .delete").on("click", delete_post);
}

function select_initial_post(){
    // Select first Post in list or re-select the last Post that was selected
    var post_to_select = $(post_list_container).find(".post_preview[post_id='" + selected_post + "']");
    if( post_to_select.length != 1 )
        post_to_select = $(post_list_container).find(".post_preview").first();
    $(post_to_select).click();
}

function new_post(){
    // Create a new Post
    if( confirm_changes() == true) {
        $.ajax({
            url: "update_post"
        }).success(
            function(){load_post_list(); alertify.success(admin_created);}
        ).error(
            function(){alertify.error(admin_create_error);}
        )
    }
}

function select_post(){
    // Select Post from list
    if( confirm_changes() == true ){
        $(this).addClass("selected").siblings().removeClass("selected");
        selected_post = $(this).attr("post_id");
        $.ajax({
            url: "posts",
            data: {
                post_id: $(this).attr("post_id")
            }
        }).success(load_post);
    }
}

function load_post(post){
    // Populate editor with Post data
    var loaded_post = post[0];
    $(post_editor).attr("current_post_id", loaded_post.id); // Load id
    $(title_input).val(loaded_post.title); // Load title
    editor.content.set(loaded_post.body); // Load body
    $(tag_container).find(".post_tag").remove(); // Clear Tags
    for( var index in loaded_post.tags ){
        draw_tag(loaded_post.tags[index]); // Draw Tags
    }
    $(publish_input).find("input").prop("checked", loaded_post.published); // Load published flag
}

function delete_post(){
    // Delete given Post
    if( confirm(admin_delete) ){
        $.ajax({
            url: "delete_post",
            data: {
                post_id: $(this).attr("post_id")
            }
        }).success(
            function(){load_post_list(); alertify.success(admin_deleted);}
        ).error(
            function(){alertify.error(admin_delete_error);}
        )
    }
}

function toggle_asterisk(){
    // Toggle unsaved asterisk
    if( unsaved_changes == true ){
        $(".post_preview.selected").find(".unsaved").show();
    }else{
        $(".unsaved").hide();
    }
}

function changes_made(){
    // Confirm no more unsaved changes
    unsaved_changes = false;
    toggle_asterisk();
}

function changes_pending(){
    // Confirm there are unsaved changes
    unsaved_changes = true;
    toggle_asterisk();
}

function confirm_changes(){
    // Prompt user before discarding unsaved changes
    if( unsaved_changes == false ){
        return true;
    }else if( confirm(admin_unsaved) == true ){
        changes_made();
        return true;
    }else{
        return false;
    }
}

/**** Log Out ****/
function log_out(){
    // Log user out
    $.ajax({
        url: "log_out"
    }).done(
        function(){
            window.location.href = "/";
            location.reload();
        }
    )
}