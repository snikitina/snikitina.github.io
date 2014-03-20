if (typeof(gettext) == "undefined") {
    gettext = function (msg) { return msg; }
}


/* CONNECT --------------------------------------------------------------------
---------------------------------------------------------------------------- */
EventHandlers = {
    objects: [],
    handlers: [],
    put: function (DOM_object, handler_object, handler_function) {
        if (findIdentical(this.objects, DOM_object) < 0) {
            this.objects.push(DOM_object);
            this.handlers.push([[handler_object, handler_function]]);
        } else {
            this.handlers[findIdentical(this.objects, DOM_object)].push([handler_object, handler_function]);
        }
    },
    onLoad: function () {   
        for (var i = 0; i < this.objects.length; i++) {
            var obj = this.objects[i];
            connect(obj, "onclick", function (e) {
                var index = findIdentical(EventHandlers.objects, e.src());
                if (index >= 0) {
                    var handlers = EventHandlers.handlers[index]; 
                    for (j = 0; j < handlers.length; j++) {
                        var handler = handlers[j];   
                        if (handler[0] instanceof Object) {
                            handler[0][handler[1]](e);
                        } else {
                            window[handler[0]][handler[1]](e);
                        }                        
                    }
                }            
            });
        }
    }
};


/* MESSAGES -------------------------------------------------------------------
---------------------------------------------------------------------------- */
Messages = {
    wrapper: "messages-wrapper",
    field_error_class: "errorlist",    
    onLoad: function () {       
        if ($(this.wrapper)) {
            var messages = getElementsByTagAndClassName("li", null, this.wrapper);
            // let's think that there is always only one message at a time
            if (isEmpty(messages)) { return; } 
            var message_class = getNodeAttribute(messages[0], "class");
            if (message_class && message_class.match(/info|success|warning/)) {
                setTimeout(function () { slideUp($(Messages.wrapper)); }, 3000);
            } else {
                if ($("content")) {
                    connect($("content"), "onclick", Messages, "hideMessage");
                }          
            }                    
        }
    },
    hideMessage: function (e) {
        if ($(this.wrapper).style.display != 'none') {
            slideUp($(Messages.wrapper));
        }
        disconnectAllTo(Messages, "hideMessage");
    }
};


/* POPUPS ---------------------------------------------------------------------
---------------------------------------------------------------------------- */
Popup = {
    popupLinkClass: "popup-link",
    overlayId: "overlay",
    popupParentClass: "popup-parent",
    popupClass: "popup",
    closeLinkClass: "close-popup",
    cleanClass: "clean-on-cancel",
    
    showPopupEvent: function (e) {
        var popup = $(e.src().id + "-content");
        Popup.showPopup(popup);
    }, 
    
    showPopup: function (popup) {                    
        if (popup) {            
            setStyle(Popup.overlayId, {'display': 'block'});
            setStyle(popup, {'display': 'block'});
            var top = getViewportDimensions().h / 2 - getElementDimensions(popup).h / 2;
            var left = getViewportDimensions().w / 2 - getElementDimensions(popup).w / 2;            
            setElementPosition(popup, {'x': left, 'y': top});
        }        
    },
    
    closePopupEvent: function (e) { 
        var popup = getFirstParentByTagAndClassName(e.src(), null, Popup.popupClass);
        Popup.closePopup(popup);
    },
    
    closePopup: function (popup) {        
        if (popup) {
            setStyle(Popup.overlayId, {'display': 'none'});
            setStyle(popup, {'display': 'none'});
            if (hasElementClass(popup, "opened")) {
                forEach(findChildElements(popup, [".errorlist", ".errornote"]), function (error) {
                    removeElement(error);
                });
            }
            
            if (hasElementClass(popup, Popup.cleanClass)) {  
                forEach(findChildElements(popup, ['input[type="password"]']), function (input) {
                    if (!Changes) { return; }
                    var input_obj = Changes.findFieldByDOM(input);                    
                    if (input_obj && input_obj.isChanged()) {
                        input.value = "";
                        signal(input_obj.DOM, "onclick");
                    }
                });
            }
            
            if (hasElementClass(popup, Popup.cleanClass) && JsCheckboxes) {      
                forEach(findChildElements(popup, ['input[type="checkbox"]']), function (input) {
                    if (!Changes) { return; }
                    var input_obj = Changes.findFieldByDOM(input);     
                    if (input_obj && input_obj.isChanged()) {
                        var span = input.parentNode;
                        signal(span, "onclick", JsCheckboxes, "toggleCheckbox");
                    }
                });
            }
            
            if (hasElementClass(popup, Popup.cleanClass) && JsFileInputs) {  
                forEach(findChildElements(popup, ['input[type="file"]']), function (input) {    
                    JsFileInputs.clearInput(input);
                });
            }
        }     
    },
    
    onLoad: function () {
        forEach(getElementsByTagAndClassName(null, Popup.popupLinkClass), function (link) {
            connect(link, "onclick", Popup, "showPopupEvent");
        });
        forEach(getElementsByTagAndClassName(null, Popup.closeLinkClass), function (link) {
            connect(link, "onclick", Popup, "closePopupEvent");
        });
        forEach(getElementsByTagAndClassName(null, Popup.popupClass), function (popup) {
            if (hasElementClass(popup, "opened")) {
                Popup.showPopup(popup);             
            }
        });
    }
}


/* FORM FIELDS ----------------------------------------------------------------
---------------------------------------------------------------------------- */
JsCheckboxes = {
    checkboxClass: 'js-checkbox',
    checkedClass: 'checked',
    uncheckedClass: 'unchecked',
    disabledClass: 'disabled',
    
    toggleCheckbox: function (e) { 
        var clicked = e.src(), for_attr = getNodeAttribute(clicked, "for");

        if (for_attr) {
            // label was clicked
            var checkbox = $(for_attr);
            clicked = getFirstParentByTagAndClassName(checkbox, "span", null);
        } else {
            // span was clicked
            var checkbox = getFirstElementByTagAndClassName("input", JsCheckboxes.checkboxClass, clicked);
        }        
        if (checkbox.disabled) { return; }
        
        if (!checkbox.checked) {
            // select all
            removeElementClass(clicked, JsCheckboxes.uncheckedClass);
            removeElementClass(clicked, "somechecked");
            addElementClass(clicked, JsCheckboxes.checkedClass);
        } else {
            removeElementClass(clicked, JsCheckboxes.checkedClass);
            removeElementClass(clicked, "somechecked");
            addElementClass(clicked, JsCheckboxes.uncheckedClass);
        }
        
        checkbox.checked = !checkbox.checked;        
        
        // fixing IE bugs :( onclick handlers fire in wrong order 
        // if (hasElementClass(checkbox, "inverted")) {
        //             removeElementClass(checkbox, "inverted");            
        //         } else {
        //             addElementClass(checkbox, "clicked");
        //         }
        
        // the bug in signal() - error 'this._event is undefined' (Mochikit 1.4) 
        if (e._event) { e.stop(); }  
    },
    
    toggleCheckboxViaLabel: function (e) {
        var target = e.target(), href = getNodeAttribute(target, "href");
        if ((e.src() != target) && href) {
            e.stop();
            window.location = href;
        } else {
            this.toggleCheckbox(e);
        }
    },
    
    findLabelForCheckbox: function (checkbox) {
        var labels = getElementsByTagAndClassName("label", null);
        var for_attr = getNodeAttribute(checkbox, "id");
        if (!for_attr || isEmpty(labels)) { return false; }
                    
        for (var i = 0; i < labels.length; i++) {
            if (getNodeAttribute(labels[i], "for") == for_attr) {
                return labels[i];
            }
        }
        return false;
    },
    
    onLoad: function (use_event_handlers) {    
        forEach(getElementsByTagAndClassName("input", JsCheckboxes.checkboxClass), function (checkbox) {
            var span = getFirstParentByTagAndClassName(checkbox, "span", null);
            
            if (checkbox.checked) {
                addElementClass(span, JsCheckboxes.checkedClass);
            } else {
                addElementClass(span, JsCheckboxes.uncheckedClass);
            }  
            
            if (checkbox.disabled) {
                addElementClass(span, JsCheckboxes.disabledClass);
            }
            
            if (use_event_handlers) {
                EventHandlers.put(span, "JsCheckboxes", "toggleCheckbox"); 
            } else {                
                connect(span, "onclick", JsCheckboxes, "toggleCheckbox");
            } 
                       
            var label = JsCheckboxes.findLabelForCheckbox(checkbox);
            if (label) {
                if (use_event_handlers) {
                    EventHandlers.put(label, "JsCheckboxes", "toggleCheckboxViaLabel");
                } else {                
                    connect(label, "onclick", JsCheckboxes, "toggleCheckboxViaLabel");
                }
            }            
            // connect(span, "onclick", JsCheckboxes, "toggleCheckbox"); 
            //             var label = JsCheckboxes.findLabelForCheckbox(checkbox);
            //             if (label) {
            //                 connect(label, "onclick", JsCheckboxes, "toggleCheckboxViaLabel");
            //             }
        });
    }
}

JsFileInputs = {
    onLoad: function () {
        forEach(getElementsByTagAndClassName("input", "file-input", currentDocument().body), function (input) {
            connect(input, "onchange", JsFileInputs, "updateTextInput");
        });
    },
    updateTextInput: function (e) {
        var input = e.src();
        var id = getNodeAttribute(input, "id");
        var filename = input.value.split("\\");
        $(id + "_text").value = filename[filename.length - 1];
    },
    clearInput: function (input) {
        var new_input = INPUT({}), attrs = ['type', 'class', 'id', 'size', 'name'];
        forEach(attrs, function (attr) {
            var attr_value = getNodeAttribute(input, attr);
            if (attr_value) {
                setNodeAttribute(new_input, attr, attr_value);
            }
        }); 
        swapDOM(input, new_input);

        $(getNodeAttribute(new_input, "id") + "_text").value = "";    
        connect(new_input, "onchange", JsFileInputs, "updateTextInput");
        
        if (Changes) { 
            var file_input_obj = Changes.findFieldByDOM(new_input);
            file_input_obj.DOM = new_input;
            connect(new_input, "onchange", file_input_obj, "changed");
            signal(new_input, "onchange", file_input_obj, "changed");
            var text_input = $(new_input.id + "_text");
            if (text_input) { signal(text_input, "onkeyup"); }
        }
    }
}