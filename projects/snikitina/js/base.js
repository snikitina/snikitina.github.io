$(document).ready(function () {    
    // preview with slide down images
    $("#preview .project-name").click(function (event) {
        event.preventDefault();
        
        var img = $(this).next("div");
        if (img.is(":hidden")) {
            $("#preview li.active div").hide();
            $("#preview li.active").removeClass("active");        
            $(this).parent().addClass("active");
            img.slideDown(1000);
        }
    }); 
});