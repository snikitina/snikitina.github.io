if (typeof(gettext) == "undefined") {
    gettext = function (msg) { return msg; }
}

/* ---------------------------------------------------------------
parent for any field 
------------------------------------------------------------------ */
function Field (field, form) {
    this.DOM = field;
    this.form = form;
}

Field.prototype.init = function () {
    this.value = this.getCurrentValue();
    this.connectChange();
}

Field.prototype.getCurrentValue = function () {
    return this.DOM.value;
}

Field.prototype.changed = function () {   
    if (this.DOM.disabled) { return; }
    
    if (this.value != this.getCurrentValue()) {
        if (!this.isChanged()) { 
            this.form.changed_fields.push(this); 
        }
    } else {
        var i = findIdentical(this.form.changed_fields, this);
        if (i >= 0) {
            this.form.changed_fields.splice(i, 1);
        }
    }
    this.form.checkChanges(this);
}

Field.prototype.isChanged = function () {
    var index = findIdentical(this.form.changed_fields, this);
    if (index >= 0) { 
        return true; 
    }
    return false;
}


/* ---------------------------------------------------------------
input field with text value: text/password input
------------------------------------------------------------------ */
function InputWithTextValue (field, form) {
    Field.call(this, field, form);
}

InputWithTextValue.prototype = new Field();
delete InputWithTextValue.prototype.field;
delete InputWithTextValue.prototype.form;
InputWithTextValue.prototype.constructor = InputWithTextValue;

function InputWithTextValue (field, form) {
    Field.call(this, field, form);
}

InputWithTextValue.prototype.connectChange = function () {
    connect(this.DOM, "onkeyup", this, "changed");
    connect(this.DOM, "onclick", this, "changed");
    connect(this.DOM, "onblur", this, "changed");
}


/* ---------------------------------------------------------------
input field with boolean value: radiobutton/checkbox input
------------------------------------------------------------------ */
function InputWithBooleanValue (field, form) {
    Field.call(this, field, form);
}

InputWithBooleanValue.prototype = new Field();
delete InputWithBooleanValue.prototype.field;
delete InputWithBooleanValue.prototype.form;
InputWithBooleanValue.prototype.constructor = InputWithBooleanValue;

InputWithBooleanValue.prototype.changed = function () {  
    if (this.DOM.disabled) { return; }

    // fixing IE bugs :( onclick handlers fire in wrong order 
    // if (hasElementClass(this.DOM, "clicked")) {
        removeElementClass(this.DOM, "clicked");
        var current_value = this.getCurrentValue();
    // } else {
    //        addElementClass(this.DOM, "inverted");
    //        var current_value = !this.getCurrentValue();
    //    }     
    
    if (this.value != current_value) {
        this.form.changed_fields.push(this);
    } else {
        var i = findIdentical(this.form.changed_fields, this);
        if (i >= 0) {
            this.form.changed_fields.splice(i, 1);
        }
    }
    this.form.checkChanges(this);
}

InputWithBooleanValue.prototype.getCurrentValue = function () {    
    return this.DOM.checked;
}

InputWithBooleanValue.prototype.connectChange = function () {       
    if (hasElementClass(this.DOM, "js-checkbox") && JsCheckboxes) {
        var span = getFirstParentByTagAndClassName(this.DOM, "span", null);
        //connect(span, "onclick", this, "changed");  
        EventHandlers.put(span, this, "changed");      
        var label = JsCheckboxes.findLabelForCheckbox(this.DOM);
        if (label) { 
            //connect(label, "onclick", this, "changed"); 
            EventHandlers.put(label, this, "changed"); 
        }
        return;        
    } 
    
    var parent = this.DOM.parentNode;
    
    if (hasElementClass(parent, "can-delete")) {
        //connect(parent, "onclick", this, "changed"); 
        EventHandlers.put(parent, this, "changed"); 
        return;
    }
    
    connect(this.DOM, "onclick", this, "changed");    
}


/* ---------------------------------------------------------------
select field
------------------------------------------------------------------ */
function  Select (field, form) {
    Field.call(this, field, form);
}

Select.prototype = new Field();
delete Select.prototype.field;
delete Select.prototype.form;
Select.prototype.constructor = Select;

Select.prototype.connectChange = function () {
    if (!hasElementClass(this.DOM, "no-validation")) {
        connect(this.DOM, "onchange", this, "changed");
    }
}

Select.prototype.getCurrentValue = function () {    
    return this.DOM.selectedIndex;
}


/* ---------------------------------------------------------------
file field
------------------------------------------------------------------ */
function  FileInput (field, form) {
    Field.call(this, field, form);
}

FileInput.prototype = new Field();
delete Select.prototype.field;
delete Select.prototype.form;
FileInput.prototype.constructor = FileInput;

FileInput.prototype.connectChange = function () {
    connect(this.DOM, "onchange", this, "changed");
}


/* ---------------------------------------------------------------
form class
------------------------------------------------------------------ */
function Form (form) {
    this.DOM = form;
    this.fields = [];
    this.changed = false;
    this.changed_fields = [];
    this.submit_buttons = findChildElements(form, ['input[type="submit"]', 'button[type="submit"]']);
    this.init();
};

Form.prototype.init = function () {
    var form = this;
    
    forEach(findChildElements(this.DOM, ['input[type="text"]', 'input[type="password"]']), function (field) {
        if (!field.disabled) {
            form.fields.push(new InputWithTextValue(field, form));
        }
    });
    
    forEach(findChildElements(this.DOM, ['input[type="checkbox"]', 'input[type="radio"]']), function (field) {
        form.fields.push(new InputWithBooleanValue(field, form));
    });
    forEach(findChildElements(this.DOM, ['input[type="file"]']), function (field) {
        form.fields.push(new FileInput(field, form));
    });
    forEach(findChildElements(this.DOM, ['select']), function (field) {
        form.fields.push(new Select(field, form));
    });
    
    forEach(form.fields, function (field) {
        field.init(); 
    });    
    
    if (!hasElementClass(this.DOM, "conditional-validation")) {
        this.disable();
    }
}

Form.prototype.disable = function () {
    forEach(this.submit_buttons, function (button) {
        if (!hasElementClass(button, "no-validation")) {
            setNodeAttribute(button, "disabled", "disabled");
            addElementClass(button, "disabled");
        }
    });
}

Form.prototype.enable = function () {
    forEach(this.submit_buttons, function (button) {
        button.removeAttribute("disabled");
        removeElementClass(button, "disabled");
    });
}

Form.prototype.checkChanges = function (field) {
    if (!this.changed && isNotEmpty(this.changed_fields)) {
        this.changed = true;
        this.enable();
        return;
    }
    if (this.changed && isEmpty(this.changed_fields)) {
        this.changed = false;
        this.disable();
        return;
    }
}


/* ---------------------------------------------------------------
changes object
------------------------------------------------------------------ */
Changes = {
    forms: [],
    onLoad: function () {
        changes = this;
        forEach($$("form"), function (form) {
            if (!hasElementClass(form, "no-validation")) {
                changes.forms.push(new Form(form));
            }
        });
        
        forEach($$("a"), function (link) {
            if (!hasElementClass(link, "no-validation")) {
                connect(link, "onclick", changes, "linkClicked");
            }
        });
    },
    linkClicked: function (e) {
        changes = false;
        for (var i = 0; i < this.forms.length; i++) {
            if (this.forms[i].changed) {
                changes = this.forms[i];
                break;
            }
        }
        
        this.last_clicked = getNodeAttribute(e.src(), "href");
                
        if (changes) {  
            e.stop();  
            if (!$("changes-popup")) {
                // create new DOM elements
                var span_1 = SPAN({'class': 'button', 'id': 'submit-changes'}, gettext("Yes"));
                var span_2 = SPAN({'class': 'button button-2', 'id': 'no-changes'}, gettext("No"));
                var span_3 = SPAN({'class': 'button button-2'}, gettext("Cancel"));           
                var div = DIV({'class': 'popup', 'id': 'changes-popup'}, [
                    H5({}, gettext("Changes have not been saved")),
                    P({}, gettext("Setting changes have not been saved. Do you want to save changes?")),
                    DIV({'class': 'submit-row'}, [span_1, span_2, span_3])
                ]);
                insertSiblingNodesAfter($('content'), div);
            
                // connect events to the buttons            
                var this_ = this;
                connect(span_1, "onclick", function () { changes.DOM.submit(); });            
                connect(span_2, "onclick", function () { window.location.href = this_.last_clicked; });
                connect(span_3, "onclick", function () { Popup.closePopup(div); });
            }
            
            Popup.showPopup($("changes-popup"));
            return;
        }
    },
    findFieldByDOM: function (field) {
        for (var i = 0; i < this.forms.length; i++) {
            for (var j = 0; j < this.forms[i].fields.length; j++) {                
                if (this.forms[i].fields[j].DOM.id == field.id) {
                    return this.forms[i].fields[j];
                }
            }
        }  
    },
    readForm: function () {
        var changes = this, t = '';
        forEach(changes.forms, function (form) {
            t += getNodeAttribute(form.DOM, "id") + ": ";
            forEach(form.fields, function (field) {
                t += [field.DOM, field.DOM.name, field.value].join(" ") + " ";
            });
            t += "\n";
        });
        return t;
    }
};

// connect(window, "onload", Changes, "init");