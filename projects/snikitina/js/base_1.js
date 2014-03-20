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
    
    
    // this function is used just for testing purposes
    $("#nav a").click(function (event) {
        event.preventDefault();
        
        $("#nav li.active").removeClass("active");        
        $(this).parent().addClass("active");
        
        $(".page:visible").hide();
        $("#" + $(this).parent().attr("id") + "-page").show();
    });
    
    
    $.getJSON("http://api.flickr.com/services/feeds/photos_public.gne?id=45697665@N03&lang=en-us&format=json&jsoncallback=?", displayImages);
    function displayImages(data) {

        // Start putting together the HTML string
        var htmlString = "", i = 0;

        // Now start cycling through our array of Flickr photo details
        $.each(data.items, function(i, item){
            if (i > 9) { return false; }
            // I only want the ickle square thumbnails
            var sourceSquare = (item.media.m).replace("_m.jpg", "_s.jpg");

            // Here's where we piece together the HTML
            htmlString += '<li><a href="' + item.link + '" target="_blank">';
            htmlString += '<img title="' + item.title + '" src="' + sourceSquare;
            htmlString += '" alt="'; htmlString += item.title + '" />';
            htmlString += '</a></li>';
            i++;
        });

        // Pop our HTML in the #images DIV
        $('#flickr').html(htmlString);

        // Close down the JSON function call
    }
    
    //displayBooks();
        
});

function doNothing (widgetResults, s) {
    return;
};

function displayBooks () {
    //alert(widgetResults);
    var html = '';
    
    $.each(widgetResults["books"], function (book_id, book) {
        html += book["cover"] + ' ';
        // $.each(book, function (, value) {
        //            html += key + " ";
        //        });
    });
    $('#library').html(html);
};