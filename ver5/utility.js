// Easy3D_WebGL
// String padding and justify methods
// Polyfill and handler classes for "on pointer hover" css switching supporting mobile touch
// Array filtering methods
// Emmanuel Charette 2017-2022

"use strict"



// Strings
function padStart(str, pad, len) {
    if (pad.length < 1) return str;
    while (str.length < len) str = pad[0] + str;
    return str;
}
function padEnd(str, pad, len) {
    if (pad.length < 1) return str;
    while (str.length < len) str = str + pad[0];
    return str;
}
function justify(str1, str2, len) {
    str1 = str1.toString();
    str2 = str2.toString();
    var delta = len - str1.length - str2.length;
    return str1 + ( (delta >=0) ? (" ".repeat(delta) + str2) : ("#".repeat(len - str1.length))) ;
}
function replaceAll(str, target, by) {
    return str.split(target).join(by);
}


// DOM helpers
function getElem(id) {
    var elem = document.getElementById(id);
    if (elem) return elem;
    return false;
}

function onClick(elemOrID, callback) {
    if (typeof(elemOrID) == "string") elemOrID = getElem(elemOrID);
    if (elemOrID) elemOrID.addEventListener("click", callback);
}

function onEvent(elemOrID, event, callback) {
    if (typeof(elemOrID) == "string") elemOrID = getElem(elemOrID);
    if (elemOrID) elemOrID.addEventListener(event, callback);
}

var __$elementMap = new Map();
function $(elem) {
    var res = __$elementMap.get(elem);
    if (res == undefined) {
        res = document.getElementById(elem);
        if (res != undefined) __$elementMap.set(elem, res);
    }
    return res;
}

function $remove(elem) {
    if ($(elem) != undefined) {
        try {
            $(elem).parentElement.removeChild($(elem));
        } catch (ex) {};
        __$elementMap.delete(elem);
    }
}

function $forEach(selector, lambda) {
    document.querySelectorAll(selector).forEach(lambda);
}


function downloadBlob(filename, data) {
    const blob = new Blob([data], {type: 'text/plain'});
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    } else {
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
        window.URL.revokeObjectURL(blob);
    }
}


//Array methods

function findIn2Array(a1, a2) {
    return a1.filter( (elem) => a2.includes(elem) );
}
function findNotIn2Array(a1, a2) {
    return a1.filter( (elem) => !a2.includes(elem) );
}
function findIn3Array(a1, a2, a3) {
    return a1.filter( (elem) => a2.includes(elem) && a3.includes(elem) );
}
function findNotIn3Array(a1, a2, a3) {
    return a1.filter( (elem) => !a2.includes(elem) && !a3.includes(elem) );
}
function findIn2ArrayExcept(a1, a2, exception) {
    return a1.filter( (elem) => a2.includes(elem) && (elem != exception) );
}
function findIn3ArrayExcept(a1, a2, a3, exception) {
    return a1.filter( (elem) => a2.includes(elem) && a3.includes(elem) && (elem != exception) );
}

// Sugary Iterators
function forN(n, lambda) {
    for (let i = 0; i < n; ++i) lambda(i, n);
}
function forXY(nx, ny, lambda) {
    for (let x = 0; x < nx; ++x) for (let y = 0; y < ny; ++y) lambda(x, y, nx, ny);
}

// UI Parameter handling
const E3D_UIPARAM = new Map();
function E3D_UIParam(param) { return E3D_UIPARAM.get(param); }

function E3D_MapToText(mapObject, keyWidth = 8, valueWidth = 16, toList = null) {
    var s = "";
    if (!Array.isArray(toList)) toList = mapObject.keys().toArray();
    for (var k of toList) s += k.padStart(keyWidth) + ": " + (""+mapObject.get(k)).padStart(valueWidth) + "\n";
    return s;
}

// Parameter DIV creation
function E3D_addHeader(element, text) {
    var newElem = document.createElement("span");
    newElem.className = "E3D_input_header";
    newElem.innerText = text;
    element.appendChild(newElem);

    newElem = document.createElement("span");
    newElem.className = "E3D_input_header";
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);

    newElem = document.createElement("span");
    newElem.className = "E3D_input_header";
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);
}
function E3D_addSeparator(element) {
    var newElem = document.createElement("span");
    newElem.className = "E3D_input_separator";
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);

    newElem = document.createElement("span");
    newElem.className = "E3D_input_separator";
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);

    newElem = document.createElement("span");
    newElem.className = "E3D_input_separator";
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);
}

function E3D_addInput_range(element, name, caption, min, max, value, callback, step = 1, scale = 1, formatter = null) {
    // <span class="E3D_input_caption">$caption</span>
    var newElem = document.createElement("span");
    newElem.className = "E3D_input_caption";
    newElem.innerText = caption;
    element.appendChild(newElem);

    // <span id="range_$name_value" class="E3D_input_value">$value</span>
    var newElem2 = document.createElement("span");
    newElem2.className = "E3D_input_value";
    newElem2.innerText = value;
    newElem2.id = "range_"+name+"_value";
    element.appendChild(newElem2);

    //<input type="range" id="range_$name" class="E3D_input_range" min="$min" max="$max" step="$step" value="$value" data-scale="$scale"/>
    newElem = document.createElement("input");
    newElem.type = "range";
    newElem.id = "range_"+name;
    newElem.className = "E3D_input_range";
    newElem.setAttribute("min", min);
    newElem.setAttribute("max", max);
    newElem.setAttribute("step", step);
    newElem.value = value;
    newElem.setAttribute("data-scale", scale);
    element.appendChild(newElem);

    newElem.addEventListener("input", function(event) {
        var newValue = Number(event.target.value) * scale;
        E3D_UIPARAM.set(name, newValue);
        if (formatter != null) newValue = formatter(newValue);
        newElem2.innerText = newValue;
        callback(event, "range", name, newValue);
    });

    E3D_UIPARAM.set(name, value);
}
function E3D_setInput_range(element, name, value) {
    var newInputValue = element.querySelector("#range_"+name+"_value");
    var newInputElem = element.querySelector("#range_"+name);
    if ((newInputValue) && (newInputElem)) {

        newInputValue.innerText = value;
        newInputElem.value = value;
        newInputElem.dispatchEvent(new Event('input', { bubbles: true, target:newInputElem, value: value }));
    }

}

function E3D_addInput_radio(element, name, caption, group, checked, callback) {
    // <span class="E3D_input_caption">$caption</span>
    var newElem = document.createElement("span");
    newElem.className = "E3D_input_caption";
    newElem.innerText = caption;
    element.appendChild(newElem);

    // <span id="range_$name_value" class="E3D_input_value">$value</span>
    var newDiv = document.createElement("div");
    newDiv.className = "E3D_input_value";
    element.appendChild(newDiv);

        newElem = document.createElement("input");
        newElem.type = "radio";
        newElem.id = "radio_"+group+"_"+name;
        newElem.value = name;
        //newElem.className = "E3D_input_radio";
        newElem.setAttribute("name", group);
        if (checked) newElem.setAttribute("checked", true);
        newDiv.appendChild(newElem);
        newElem.addEventListener("input", function(event) {
            if (event.target.checked) E3D_UIPARAM.set(event.target.name, name);
            callback(event, "radio", name, event.target.checked, event.target.name);
         });

    var newElem2 = document.createElement("span");
    newElem2.innerHTML = "&nbsp;";
    element.appendChild(newElem2);

    //<input type="radio" id="radio_$name" name="$group" class="E3D_input_radio" $checked />
    if (!E3D_UIPARAM.has(group)) E3D_UIPARAM.set(group, "");
    if (checked) E3D_UIPARAM.set(group, name);
}
function E3D_setInput_radio(element, name, group, checked) {
    const newInputElem = element.querySelector("#radio_"+group+"_"+name);
    if (newInputElem) newInputElem.checked = checked;
    if (checked) {
        newInputElem.dispatchEvent(new Event('input', { bubbles: true, target:newInputElem, value: checked }));
    }
}

function E3D_addInput_checkbox(element, name, caption, checked, callback) {
    // <span class="E3D_input_caption">$caption</span>
    var newElem = document.createElement("span");
    newElem.className = "E3D_input_caption";
    newElem.innerText = caption;
    element.appendChild(newElem);

    // <span id="range_$name_value" class="E3D_input_value">$value</span>
    var newDiv = document.createElement("div");
    newDiv.className = "E3D_input_value";
    element.appendChild(newDiv);

        newElem = document.createElement("input");
        newElem.type = "checkbox";
        //ewElem.className = "E3D_input_checkbox";
        newElem.id = "checkbox_" + name;
        if (checked) newElem.setAttribute("checked", true);
        newDiv.appendChild(newElem);
        newElem.addEventListener("input", function(event) {
            E3D_UIPARAM.set(name, event.target.checked);
            callback(event, "checkbox", name, event.target.checked);
        });

    newElem = document.createElement("span");
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);

    if (!E3D_UIPARAM.has(name)) E3D_UIPARAM.set(name, false);
    if (checked) E3D_UIPARAM.set(name, true);
}
function E3D_setInput_checkbox(element, name, checked) {
    const newInputElem = element.querySelector("#checkbox_"+name);
    if (newInputElem) newInputElem.checked = checked;
    if (checked) {
        newInputElem.dispatchEvent(new Event('input', { bubbles: true, target:newInputElem, value: checked }));
    }
}


function E3D_addOutput_text(element, name, caption, value) {
    var newElem = document.createElement("span");
    newElem.className = "E3D_input_caption";
    newElem.innerText = caption;
    element.appendChild(newElem);

    newElem = document.createElement("span");
    newElem.className = "E3D_input_value";
    newElem.id = "outputText_" + name;
    newElem.innerText = value;
    element.appendChild(newElem);

    newElem = document.createElement("span");
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);
}
function E3D_setOutput_text(element, name, value) {
    var outputElem = element.querySelector("#outputText_"+name);
    if (outputElem) {
        outputElem.innerText = value;
    }
}

function E3D_addInput_select(element, name, caption, options, values, callback) {
    if ((!values) || (values.length == 0)) values = options;

    var newElem = document.createElement("span");
    newElem.className = "E3D_input_caption";
    newElem.innerText = caption;
    element.appendChild(newElem);

    newElem = document.createElement("span");
    newElem.className = "E3D_input_value";
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);

    newElem = document.createElement("select");
    newElem.className = "E3D_input_select";
    newElem.id = "select_" + name;
    element.appendChild(newElem);

    for (var i = 0; i < options.length; ++i) {
        var newOpt = document.createElement("option");
        newOpt.innerText = options[i];
        newOpt.value = values[i];
        newElem.appendChild(newOpt);
    }

    newElem.addEventListener("input", function(event) {
        E3D_UIPARAM.set(name, event.target.value);
        callback(event, "select", name, event.target.value);
    });
    if (!E3D_UIPARAM.has(name)) E3D_UIPARAM.set(name, values[0]);
}
function E3D_setInput_select(element, name, selectonOption) {

    var newInputElem = element.querySelector("#select_"+name);
    if (newInputElem) {
        var oldVal = newInputElem.value;
        newInputElem.value = selectonOption;
        if (oldVal != selectonOption) newInputElem.dispatchEvent(new Event('input', { bubbles: true, target:newInputElem, value: selectonOption }));
    }
}


/*
Example:

var paramDiv1 = document.getElementById("paramDiv1");

E3D_addHeader(paramDiv1, "Parameters");
E3D_addInput_range(paramDiv1, "dia", "Ext Diameter", 2, 120, 50, paramDiv1CB, 0.5);
E3D_addInput_range(paramDiv1, "hole", "Int Diameter", 1, 100, 12.6, paramDiv1CB, 0.1);
E3D_addInput_range(paramDiv1, "sh", "Slice Height", 1, 25, 4, paramDiv1CB, 0.1);
E3D_addInput_range(paramDiv1, "bh", "Bump Height", 0, 10, 4, paramDiv1CB, 0.05);
E3D_addInput_select(paramDiv1, "bt", "Bump Type", ["Square", "Lobe", "Pyra", "Bunny"], ["S", "L", "P", "B"], paramDiv1CB);

function paramDiv1CB(event, type, id, value, group) {
    //event is the raw JS event
    //type is the input type (checkbox, range, radio, select etc)
    //id is the parameter ID
    //value is the parameter value
    //group is the group ID for radio input

    switch (id) {
        case "dia":
            majorDia = value;
            break;
        case "hole":
            insideDia = value;
            break;
        case "sh":
            sliceHeight = value;
            break;
        case "bh":
            bumpHeight = value;
            break;
        case "bt":
            bumpType = value;
            break;
    }
    entity.clear();
    genMesh();
}
*/