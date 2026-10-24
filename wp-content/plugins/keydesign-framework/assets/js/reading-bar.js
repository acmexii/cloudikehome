(function ($) {
    $(window).scroll(function() {
        'use strict';
        // Check if the necessary elements are present on the page
        if ($("body.single-post .entry-content").length) {
            // Safe to access properties of these elements
            let contentHeight = $("body.single-post .entry-content").height();
            let finalHeight = contentHeight + $("body.single-post .entry-content").offset().top;
            let winHeight = $(window).height();
            let viewport = finalHeight - winHeight;
            let scrollPos = $(window).scrollTop();
            let scrollPercent = (scrollPos / viewport) * 100;
            
            // Update the width of .rebar-element based on the scroll percentage
            $(".rebar-element").css("width", scrollPercent + "%");
        }
    });
})(jQuery);