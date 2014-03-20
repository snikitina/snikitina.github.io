/* 
    mojeID registration form validation 
*/
if ( typeof(gettext) == "undefined" ) {
    gettext = function (msg) { return msg; }
}

MojeID = {
    form: "registration-form",
    valid: true,
    
    checkEmail: function (text) {
        var filter  = /^([a-zA-Z0-9_+\.\-])+\@(([a-zA-Z0-9_\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        return filter.test(strip(text));
    },

    checkPhone: function (text) {
        return text.match(/^[+]?[()/0-9. -]{6,50}$/);
    },

    checkCellular: function (text) {
        // \+420\.
        return true; // text.match(/^(60([1-8]|9([134]|2[1-5]))|7(0[0-9]|10|[237]))\d+/);
    },

    checkZipCode: function (text) {
        return text.match(/^\d{3}\s?\d{2}$/);
    },

    goToErrorInput: function () {        
        // set the focus to the input before the first error
        var errors = getElementsByTagAndClassName("ul", "errorlist", this.form);
        if (isNotEmpty(errors)) {
            $(errors[0].mojeid_reg_field_id).focus();
        }
    },
    
    hasErrors: function () {
        var errors = getElementsByTagAndClassName("ul", "errorlist", this.form);
        return errors.length;
    },
    
    getRequiredFields: function () {
        var fields = [];
        forEach(getElementsByTagAndClassName(null, "required", this.form), function (el) {
            var label = getFirstParentByTagAndClassName(el, "label");
            var id = getNodeAttribute(label, "for");
            if ($(id)) {
                fields.push($(id));
            }
        });
        return fields;
    },
    
    addErrorList: function (node, error_texts) {
        this.valid = false;
        var list_items = [], parent = getFirstParentByTagAndClassName(node, null, "field-wrapper");
        if (!parent) { return; }
        
        forEach(error_texts, function (text) {
            list_items.push(LI(null, text));
        });
        
        var ul = UL({"class": "errorlist"}, list_items);        
        insertSiblingNodesAfter(parent, ul);
        ul.mojeid_reg_field_id = getNodeAttribute(node, "id");
    },

    checkRegForm: function () {
        // check whether the registration form is valid
        forEach(getElementsByTagAndClassName("ul", "errorlist", this.form), removeElement);
        this.valid = true, this_ = this;
        
        forEach(this.getRequiredFields(), function (node) {
            var value = strip(node.value); 
            if (value) {
                // any checkboxes
                if (getNodeAttribute(node, "type") == "checkbox") {
                    if (!node.checked) {
                        this_.addErrorList(node, [gettext("This field is required.")]);
                    }
                }                
                // emails
                if (node.name.match(/email/)) {
                    if (!this_.checkEmail(value)) {
                        this_.addErrorList(node, [gettext("Invalid email format.")]);
                    }
                }
                // phone numbers
                if (node.name.match(/phone/)) {
                    if (!this_.checkCellular(value)) {
                        this_.addErrorList(node, [gettext("Invalid phone number. This must start with one of the following operator prefix:") +
                                " 601 602 603 604 605 606 607 608 6091 6092[1-5]" +
                                " 6093 6094 700 701 702 703 704 705 706 707 708" +
                                " 709 710 72 73 77"]);
                    }
                }
                // postal code
                if (node.name.match(/postal_code/)) {
                    if (!this_.checkZipCode(value)) {
                        this_.addErrorList(node, [gettext("Invalid ZIP code.")]);
                    }
                }
            } else {                
                this_.addErrorList(node, [gettext("This field is required.")]);
            }
        });    
        
        if ($("id_phone-default-number_1") && $("id_regform-method_0").checked && !$("id_phone-default-number_1").value) {
            this_.addErrorList($("id_phone-default-number_1"), [gettext("This field is required.")]);
        }         
        
        if (!this.valid) { 
            this.goToErrorInput();
        }
        return this.valid;
    },
    
    setStreets: function () {
        this.streetsTogglerId = "street-toggler";
        
        // can't use input[name*="street"], because it throws an exception when the name contains an underscore
        var inputs = findChildElements($(this.form), ['input[type="text"]']);
        streets = filter(function (input) {
            if (input.name.match(/street/)) {
                return input;
            }
        }, inputs);
        
        if (isNotEmpty(streets)) {
            var span = SPAN({"id": this.streetsTogglerId, "title": gettext("Add one more \"Street\" field")}, STRONG({}, "+"));
            connect(span, "onclick", this, "addStreet");            
            insertSiblingNodesAfter(streets[0], span); 
                        
            for (var i = 0; i < streets.length; i++) {
                var tr = getFirstParentByTagAndClassName(streets[i], "tr", null);
                if (i == 0) {
                    addElementClass(tr, "first-street");
                } else {
                    addElementClass(tr, "invisible street");
                }
            }            
        }
    },
    
    addStreet: function () {
        var blocks = findChildElements($(this.form), ['.invisible.street']);
        if (isNotEmpty(blocks)) {
            removeElementClass(blocks[0], "invisible");
            if (blocks.length == 1) {
                removeElement($(this.streetsTogglerId));
            }
        }
    },
    
    toggleAuthType: function (input) {
        // toggle tab classes
        var input_parent = getFirstParentByTagAndClassName(input, "li", null);
        forEach(getElementsByTagAndClassName("li", null, "auth-method-select"), function (li) {
            if (input_parent == li) {
                addElementClass(li, "active");
            } else {
                removeElementClass(li, "active");
            }
        });
        
        // toggle description block
        var input_index = getNodeAttribute(input, "id").split("_").slice(-1);
        var descr = getElementsByTagAndClassName("li", null, "auth-method-explanation");
        for (var i = 0; i < descr.length; i++) {
            if (i == input_index) {
                removeElementClass(descr[i], "invisible");
            } else {
                addElementClass(descr[i], "invisible");
            }
        } 
        
        /* onchange event won't work for hidden radiobuttons in IE6/7/8, 
        therefore 'checked' attribute should be set explicitly */
        if (!input.checked) {
            forEach(findChildElements($("auth-method-select"), ['input[checked="checked"]']), function (radiobutton) {
                radiobutton.checked = false;
            });
            input.checked = "checked"; 
        }
    },
    
    onLoad: function () { 
        if (!$(this.form)) { return; }
        
        forEach($$('#auth-method-select input'), function (input) {
            if (input.checked) {
                MojeID.toggleAuthType(input);
            }
        });
        
        forEach(getElementsByTagAndClassName("li", null, "auth-method-select"), function (li) {
            connect(li, "onclick", function (ev) {
                var label = getFirstElementByTagAndClassName("label", null, ev.src());                
                var input = getNodeAttribute(label, "for");                
                ev.stop();
                MojeID.toggleAuthType($(input));
            });
        });
        
        submitButton.onLoad();
        this.setStreets();
        
        var this_ = this;
        connect($(this.form), "onsubmit", function (e) { 
            if (!this_.checkRegForm()) {
                e.stop();
            } else {
                submitButton.setSubmitButton();
            }
        });
        
        // add registry search link to the username input on transfer page
        var input = $("id_username");
        if (!hasElementClass($(this.form), "transfer") || !input) {
            return;
        }
        var whois_link = A({"href": "http://www.nic.cz/whois/", "class": "registry-link", "title":
                       gettext("Search given contact handle in the registry.")},
                       gettext("Show data from registry"));
        connect(whois_link, "onclick", function (e) {
            e.stop();
            var username = input.value;
            if (username) {
                document.location = "http://www.nic.cz/whois/?c="+username;
            } else {
                alert(gettext("Enter contact handle first."));
            }
        });
        insertSiblingNodesAfter(input, whois_link);
        
        // added another username input
        var tr = TR({'class': 'field-row username'}, [
            TH({}, LABEL({'for': 'id_handle'}, gettext("Username") + ":")),
            TD({}, DIV({'class': 'field-wrapper clear-fix'}, [
                INPUT({'id': 'id_handle', 'type': 'text', 'class': 'readonly', 'readonly': 'readonly'}),
                removeElement(findChildElements(input.parentNode, [".help-text"])[0])
            ]))
        ]); 
        insertSiblingNodesAfter(getFirstParentByTagAndClassName(input, "tr"), tr);
    }
};

submitButton = {
    onLoad: function () {
        this.submit = findChildElements($(MojeID.form), ['input[type="submit"]'])[0];
        this.span = SPAN({'class': 'throbber invisible'}, gettext("Please wait..."));
        insertSiblingNodesAfter(this.submit, this.span); 
    },
    setSubmitButton: function () {
        if (this.submit && !MojeID.hasErrors()) {                
            removeElementClass(this.span, "invisible");                
            var input = INPUT({'type': 'hidden', 'name': this.submit.name, 'value': 1});   // hidden input with the same name to be included in POST       
            setNodeAttribute(this.submit, "disabled", "disabled");
            addElementClass(this.submit, "disabled");
            insertSiblingNodesAfter(this.submit, input);
        }
    }
};


helpTexts = {
    icon_class: "help-icon",
    message_class: "help-message", 
    onLoad: function () {
        var icons = getElementsByTagAndClassName(null, this.icon_class), obj = this;
        
        forEach(icons, function (icon) {
            var message = STRONG({'class': 'invisible ' + obj.message_class}, getNodeAttribute(icon, "title"));
            icon.removeAttribute("title");
            appendChildNodes(icon, message);
            connect(icon, "onclick", obj, "showHelpMessage");
        }); 
        
        connect(document, "onclick", obj, "hideHelpMessage");
    },
    hideHelpMessage: function (e) {
        var messages = findChildElements(getFirstParentByTagAndClassName("form", null), ['.help-message:not(.invisible)']);
        if (isEmpty(messages)) { return true; }
        
        var cursor = e.mouse().page;
        forEach(messages, function (message) {
            var dimensions = getElementDimensions(message);
            var position = getElementPosition(message);
            var area = [position.x, position.x + dimensions.w, position.y, position.y + dimensions.h];
            if (!(cursor.x > area[0] && cursor.x < area[1] && cursor.y > area[2] && cursor.y < area[3])) {
                addElementClass(message, "invisible");
            }
        });
    },
    showHelpMessage: function (e) {        
        e.stop();
        var message = findChildElements(e.src(), ['strong'])[0];
        toggleElementClass("invisible", message);  
    }
};


usernameAnimation = {
    onLoad: function () {
        this.input = $("id_username");
        if (!this.input) { return; }
        this.handle = $("id_handle");
        this.span = $$(".username .help-text span")[0];
        if (this.span) {
            this.span_text = scrapeText(this.span);
            connect(this.input, "onkeyup", this, "animate");
            connect(this.input, "onclick", this, "animate");
            connect(this.input, "onblur", this, "animate");
        }
    },
    animate: function (e) {
        if (this.input.value) {
            replaceChildNodes(this.span, this.input.value.toLowerCase());
        } else {
            replaceChildNodes(this.span, this.span_text);
        }
        if (!hasElementClass($(MojeID.form), "transfer") || !this.handle) {
            return;
        }
        this.input.value = this.input.value.toUpperCase();
        this.handle.value = this.input.value.toLowerCase();
    }
};


connect(window, "onload", function () {
    helpTexts.onLoad();
    MojeID.onLoad();
    usernameAnimation.onLoad();
});