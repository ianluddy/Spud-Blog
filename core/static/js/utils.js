function page_range(i) {
    return i ? page_range(i - 1).concat(i) : []
}

function scroll_to_top(func) {
    $("html, body").animate({scrollTop: 0}, 200, func);
}

function format_timestamp(stamp) {
    return moment.unix(stamp).format("MMMM Do YYYY, h:mm:ss a");
}

function show_loader(dom) {
    $(dom).append(loader_tmpl());
    $(dom).find(".loader_overlay").fadeIn(200, function () {
        $(dom).find(".loader_overlay .spinner").show();
    });
}

function hide_loader(dom) {
    $(dom).find(".loader_overlay").stop().fadeOut(200, function () {
        $(dom).find(".loader_overlay").remove();
    });
}

/**** Handlerbars helpers ****/

Handlebars.registerHelper('hb_stamp', function (timestamp) {
    return new Handlebars.SafeString(format_timestamp(timestamp));
});

Handlebars.registerHelper('eq', function (x, y, options) {
    return x === y ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('uneq', function (x, y, options) {
    return x !== y ? options.fn(this) : options.inverse(this);
});

/*
 * Using the Konami code, easily configure an Easter Egg for your page or any element on the page.
 *
 * Copyright 2011 - 2014 Tom McFarlin, http://tommcfarlin.com
 * Released under the MIT License
 */
$.fn.konami = function (options) {
    var opts, masterKey, controllerCode, code;
    opts = $.extend({}, $.fn.konami.defaults, options);
    return this.each(function () {
        controllerCode = [];
        $(window).keyup(function (evt) {
            code = evt.keyCode || evt.which;
            if (opts.code.length > controllerCode.push(code)) {
                return;
            } // end if
            if (opts.code.length < controllerCode.length) {
                controllerCode.shift();
            } // end if
            if (opts.code.toString() !== controllerCode.toString()) {
                return;
            } // end for
            opts.cheat();
        }); // end keyup
    }); // end each
}; // end opts

$.fn.konami.defaults = {
    code: [38, 38, 40, 40, 37, 39, 37, 39, 66, 65],
    cheat: null
};

/* Custom action to fire on successful Konami cheat code */
$(window).konami({
    cheat: function () {

        //Add a spud to the end of the page. CSS already in style.css
        $('body').append('<span class="spuddy"></span>');

        //Define these here so we don't need to calculate them on every movement of the mouse
        var spud = $('.spuddy'),
            winWidth = $(window).innerWidth(),
            winHeight = $(window).innerHeight(),
            spudCentre = winWidth / 2, //Window midpoint
            mouseX,
            mouseAltitude,
            spudRotate;

        //On any mouse move, fire this
        $("body").mousemove(function (e) {
            mouseX = e.pageX; //Mouse X position
            mouseAltitude = 1 - e.clientY / winHeight; //Mouse Y as a percentage
            spudRotate = 20 * mouseAltitude; //20 degrees - we don't want him to hurt himself

            if (mouseX < spudCentre) {
                //Flip him left and rotate him to look up
                spud.css('transform', 'rotate(' + spudRotate + 'deg) ' + 'scaleX(-1)');
            } else {
                //UnFlip him and rotate him to look up
                spud.css('transform', 'rotate(-' + spudRotate + 'deg) ');
            }
        })

    }
});