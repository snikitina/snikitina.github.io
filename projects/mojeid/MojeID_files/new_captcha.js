/*
    Update captcha with ajax
    
    Required: MochiKit, gettext
*/

if (typeof(gettext) == "undefined") {
    gettext = function (msg) { return msg; }
}

Captcha = {
    img_id: "captcha_img",
    refresh_url_id: "captcha_refresh_url",
    frame_id: "captcha_frame",
    refresh_id: "captcha_updating",    
    
    load: function () {
        if (!$(Captcha.img_id)) {
            logError("Captcha image missing.");
            return;
        }
        
        if ($(Captcha.refresh_id)) {
            Captcha.statusbar = setTimeout(function () {
                setStyle($(Captcha.refresh_id), {"visibility": "visible"});
            }, 1000);
        }
        
        var path = getNodeAttribute($(Captcha.refresh_url_id), "href");
        // it's important to use 'no-cache' attribute, because IE caches captcha by default
        var defer = loadJSONDoc(path, {'no-cache': new Date().getTime()});
        defer.addCallbacks(Captcha.fetchSuccess, Captcha.fetchFailed);
    },

    fetchSuccess: function (data) {
        clearTimeout(Captcha.statusbar);
        
        refresh_message = $(Captcha.refresh_id);
        if (refresh_message) {
            setStyle(refresh_message, {"visibility": "hidden"});
        }
        
        if (data.errors && data.errors.length) {
            logError(data.errors);
            return;
        }
        
        // check the url for the captcha image in site_urls in nicommon
        $(Captcha.img_id).src = data.url;
    },
    
    fetchFailed: function (err) {
        clearTimeout(Captcha.statusbar);
        if ($(Captcha.refresh_id)) {
            setStyle($(Captcha.refresh_id), {"visibility": "hidden"});
        }
        logError(err.message);
    }
};

connect(window, 'onload', function () {
    var frame = $(Captcha.frame_id);
    if (frame) {
        var link = A({"href": "#", "title": gettext("Display another image.")}, frame.children);
        replaceChildNodes(frame, link);
    
        forEach([$(Captcha.refresh_url_id), link], function (link) {
            connect(link, "onclick", function (e) {
                e.stop();
                Captcha.load();
            });
        }); 
        
        var img = IMG({"src": "/media/img/throbber.gif", "alt": ""});
        var children = [img, BR(), gettext("Image is loading."), BR(), gettext("Please wait...")];
        var span = SPAN({"id": Captcha.refresh_id, "style": "visibility: hidden;"}, children);
        insertSiblingNodesBefore($(Captcha.img_id), span);
    }       
});