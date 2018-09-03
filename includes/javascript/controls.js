/* $Id: controls.js 16957 2012-10-14 17:23:53Z phenxdesign $ */

/**
 * @package Mediboard
 * @subpackage includes
 * @version $Revision: 16957 $
 * @author Fabien Ménager
 * @license GNU General Public License, see http://www.gnu.org/licenses/gpl.html 
 */

/** Helper Function for Caret positioning
 * @param element The form element (automatically added by Prototype, don't use it)
 * @param begin   Where the selection starts
 * @param end     Where the selection ends
 * @param value   The value replacing the selection
 * @todo Utiliser les fonctions ci-apres à la place de celle-ci
 * @return If no argument is provided, it returns the selection start and end
 *         If only start is provided, it puts the caret at the start position and returns an empty value
 *         If start and end are provided, it selects the character range and returns the selected string
 *         If value is provided, it returns the selected text and replaces it by value
 */
Element.addMethods(['input', 'textarea'], {
    caret: function (element, begin, end, value) {
        if (element.length == 0)
            return null;

        // Begin ?
        if (Object.isNumber(begin)) {
            // End ?
            end = (Object.isNumber(end)) ? end : begin;

            // Text replacement
            var selected = element.value.substring(begin, end);
            if (value) {
                element.value = element.value.substring(0, begin) + value + element.value.substring(end, element.value.length);
            }

            // Gecko, Opera
            if (element.setSelectionRange) {
                element.focus();
                element.setSelectionRange(begin, value ? begin + value.length : end);
            }
            // IE
            else if (element.createTextRange) {
                var range = element.createTextRange();
                range.collapse(true);
                range.moveEnd('character', value ? begin + value.length : end);
                range.moveStart('character', begin);
                range.select();
            }

            return selected;
        }
        // No begin and end
        else {
            // Gecko, Opera
            if (element.setSelectionRange) {
                begin = element.selectionStart;
                end = element.selectionEnd;
            }
            // IE
            else if (document.selection && document.selection.createRange) {
                var range = document.selection.createRange();
                begin = 0 - range.duplicate().moveStart('character', -100000);
                end = begin + range.text.length;
            }
            return {begin: begin, end: end};
        }
    },
    // new version of the caret function
    getInputSelection: function (el, forceFocus) {
        var start = 0, end = 0, normalizedValue, range,
                textInputRange, len, endRange;

        if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
            start = el.selectionStart;
            end = el.selectionEnd;
        }
        else {
            if (forceFocus)
                el.tryFocus();

            range = document.selection.createRange();

            // check if the element has focus
            if (range && range.parentElement() == el) {
                len = el.value.length;
                normalizedValue = el.value.replace(/\r\n/g, "\n");

                // Create a working TextRange that lives only in the input
                textInputRange = el.createTextRange();
                textInputRange.moveToBookmark(range.getBookmark());

                // Check if the start and end of the selection are at the very end
                // of the input, since moveStart/moveEnd doesn't return what we want
                // in those cases
                endRange = el.createTextRange();
                endRange.collapse(false);

                if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                    start = end = len;
                }
                else {
                    start = -textInputRange.moveStart("character", -len);
                    start += normalizedValue.slice(0, start).split("\n").length - 1;

                    if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                        end = len;
                    } else {
                        end = -textInputRange.moveEnd("character", -len);
                        end += normalizedValue.slice(0, end).split("\n").length - 1;
                    }
                }
            }
        }

        return {
            start: start,
            end: end
        };
    },
    setInputSelection: function (el, start, end) {
        if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
            el.selectionStart = start;
            el.selectionEnd = end;
        }
        else {
            var offsetToRangeCharacterMove = function (el, offset) {
                return offset - (el.value.slice(0, offset).split("\r\n").length - 1);
            };

            var range = el.createTextRange();
            var startCharMove = offsetToRangeCharacterMove(el, start);

            range.collapse(true);
            if (start == end) {
                range.move("character", startCharMove);
            }
            else {
                range.moveEnd("character", offsetToRangeCharacterMove(el, end));
                range.moveStart("character", startCharMove);
            }
            range.select();
        }
    },
    replaceInputSelection: function (element, text, forceFocus) {
        text += "";

        element.tryFocus();
        var sel = element.getInputSelection(forceFocus);
        var value = element.value;
        element.value = value.substring(0, sel.start) + text + value.substring(sel.end, value.length);
        element.setInputSelection(sel.start, sel.start + text.length);
    },
    setInputPosition: function (element, position) {
        return element.setInputSelection(position, position);
    }
});

/** Input mask for text input elements 
 * @param element The form element (automatically added by Prototype, don't use it)
 * @param mask    The input mask as a string composed by [9, a, *, ~] by default
 * @param options Options : placeholder, 
 *                          charmap, 
 *                          completed (function called when the text is full)
 */
Element.addMethods('input', {
    mask: function (element, mask, options) {
        element.options = Object.extend({
            placeholder: "_",
            charmap: {
                '9': "[0-9]",
                'a': "[A-Za-z]",
                '*': "[A-Za-z0-9]",
                'x': "[A-Fa-f0-9]",
                '~': "[+-]"
            },
            completed: Prototype.emptyFunction,
            format: Prototype.K
        }, options);

        var maskArray = mask.toArray();
        var buffer = new Array(mask.length);
        var locked = new Array(mask.length);
        var valid = false;
        var ignore = false; //Variable for ignoring control keys
        var firstNonMaskPos = null;

        var re = new RegExp("^" +
                maskArray.collect(function (c) {
                    return element.options.charmap[c] || ((/[A-Za-z0-9]/.test(c) ? "" : "\\") + c);
                }).join('') + "$");

        //Build buffer layout from mask & determine the first non masked character
        maskArray.each(function (c, i) {
            locked[i] = Object.isUndefined(element.options.charmap[c]);
            buffer[i] = locked[i] ? c : element.options.placeholder;
            if (!locked[i] && firstNonMaskPos == null)
                firstNonMaskPos = i;
        });

        // The element size and maxlength are updated
        element.size = Math.max(mask.length, element.size);
        element.maxLength = mask.length;

        // Add a placeholder
        function addPlaceholder(c, r) {
            element.options.charmap[c] = r;
        }

        // Focus event, called on element.onfocus
        function focusEvent(e) {
            checkVal();
            writeBuffer();
            var f = function () {
                valid ?
                        Prototype.emptyFunction : ///element.setInputSelection(0, mask.length):
                        element.setInputPosition(firstNonMaskPos);
            };
            element.oldValue = element.value;
            f.defer();
        }
        focusEvent = focusEvent.bindAsEventListener(element);

        // Key down event, called on element.onkeydown
        function keydownEvent(e) {
            var pos = element.getInputSelection(true);
            var k = Event.key(e);
            ignore = ((k < 41) && (k != 32) && (k != 16)); // ignore modifiers, home, end, ... except space and shift

            //delete selection before proceeding
            if ((pos.start - pos.end) != 0 && (!ignore || k == Event.KEY_BACKSPACE || k == Event.KEY_DELETE)) { // if not ignored or is backspace or delete
                clearBuffer(pos.start, pos.end);
            }

            //backspace and delete get special treatment
            switch (k) {
                case Event.KEY_BACKSPACE:
                    while (pos.start-- >= 0) {
                        var start = pos.start;

                        if (!locked[start]) {
                            buffer[start] = element.options.placeholder;
                            if (Prototype.Browser.Opera) {
                                //Opera won't let you cancel the backspace, so we'll let it backspace over a dummy character.
                                var s = writeBuffer();
                                element.value = s.substring(0, start) + " " + s.substring(start);
                                element.setInputPosition(start + 1);
                            }
                            else {
                                writeBuffer();
                                element.setInputPosition(Math.max(firstNonMaskPos, start));
                            }
                            return false;
                        }
                    }
                    break;

                case Event.KEY_DELETE:
                    var start = pos.start;
                    clearBuffer(start, start + 1);
                    writeBuffer();
                    element.setInputPosition(Math.max(firstNonMaskPos, start));
                    return false;
                    break;

                case Event.KEY_ESC:
                    clearBuffer(0, mask.length);
                    writeBuffer();
                    element.setInputPosition(firstNonMaskPos);
                    return false;
                    break;
            }

            return true;
        }
        keydownEvent = keydownEvent.bindAsEventListener(element);

        function keypressEvent(e) {
            if (ignore) {
                ignore = false;
                //Fixes Mac FF bug on backspace
                return (e.keyCode == 8) ? false : null;
            }

            e = e || window.event;
            var k = Event.key(e);

            if (e.ctrlKey || e.altKey ||
                    (k == Event.KEY_TAB) ||
                    (k >= Event.KEY_PAGEDOWN && k <= Event.KEY_DOWN))
                return true; //Ignore

            var pos = element.getInputSelection(true);

            if ((k >= 41 && k <= 122) || k == 32 || k > 186) {//typeable characters
                var p = seekNext(pos.start - 1);

                if (p < mask.length) {
                    var nRe = new RegExp(element.options.charmap[mask.charAt(p)]);
                    var c = String.fromCharCode(k);

                    if (nRe.test(c)) {
                        buffer[p] = c;
                        writeBuffer();
                        var next = seekNext(p);
                        element.setInputPosition(next);

                        if (next == mask.length) {
                            checkVal();
                            element.options.completed(element);
                        }
                    }
                }
            }

            return false;
        }
        keypressEvent = keypressEvent.bindAsEventListener(element);

        function clearBuffer(start, end) {
            for (var i = start; i < end && i < mask.length; i++) {
                if (!locked[i])
                    buffer[i] = element.options.placeholder;
            }
        }

        function writeBuffer() {
            element.value = buffer.join('');
            return element.value;
        }

        function checkVal(fire) {
            var test = element.value;
            var pos = 0;

            for (var i = 0; i < mask.length; i++) {
                if (!locked[i]) {
                    buffer[i] = element.options.placeholder;
                    while (pos++ < test.length) {
                        //Regex Test each char here.
                        var reChar = new RegExp(element.options.charmap[mask.charAt(i)]);
                        var sChar = test.charAt(pos - 1);
                        if (reChar.test(sChar)) {
                            buffer[i] = sChar;
                            break;
                        }
                    }
                }
            }
            checkVal = checkVal.bindAsEventListener(element);

            var s = writeBuffer();
            if (!re.test(s)) {
                s = element.value = "";
                clearBuffer(0, mask.length);
                valid = false;
            }
            else
                valid = true;

            if (fire) {
                if (element.oldValue != s) {
                    //element.fire("ui:change");

                    if (element.onchange)
                        element.onchange(element);
                }
                element.oldValue = element.value;
            }
        }

        function seekNext(pos) {
            while (++pos < mask.length) {
                if (!locked[pos])
                    return pos;
            }
            return mask.length;
        }

        element.observe("focus", focusEvent)
                .observe("blur", (function () {
                    checkVal(true);
                }).bind(this))
                .observe("mask:check", checkVal);

        element.onkeydown = keydownEvent;
        element.onkeypress = keypressEvent;

        //Paste events for IE and Mozilla thanks to Kristinn Sigmundsson
        if (Prototype.Browser.IE)
            element.onpaste = function () {
                setTimeout(checkVal, 0);
            };

        else
            element.observe("input", checkVal.curry(true));

        checkVal(); //Perform initial check for existing values
    }/*,
     
     unmask: function(element) {
     element.stopObserving("focus", element.focusEvent);
     element.stopObserving("blur",  element.checkVal);
     element.onkeydown  = null;
     element.onkeypress = null;
     
     if (Prototype.Browser.IE)
     element.onpaste = null;
     
     if (Prototype.Browser.Gecko)
     element.removeEventListener('input', element.checkVal, false);
     }*/
    ,
    getFormatted: function (element, mask, format) {
        var maskArray = mask.toArray();
        var reMask = "^";
        var prevChar = null;
        var count = 0;
        var charmap = null;

        if (element.options) {
            charmap = element.options.charmap;
        } else {
            return element.value;
        }

        for (var i = 0; i <= maskArray.length; i++) {
            if (!maskArray[i]) { // To manage the latest char
                reMask += "(" + charmap[prevChar] + "{" + count + "})";
                break;
            }

            var c = maskArray[i];

            if (!charmap[c]) {
                if (charmap[prevChar]) {
                    reMask += "(" + charmap[prevChar] + "{" + Math.max(1, count) + "})";
                }
                reMask += (((/[A-Za-z0-9]/.match(c) || c == null)) ? "" : "\\") + c;
                prevChar = c;
                count = 0;
            }

            else if (prevChar != c) {
                if (charmap[prevChar]) {
                    reMask += "(" + charmap[prevChar] + "{" + count + "})";
                    prevChar = c;
                    count = 0;
                }
                else {
                    prevChar = c;
                    count++;
                }
            }

            else if (prevChar == c) {
                count++;
            }

        }

        reMask = new RegExp(reMask + "$");

        var matches = reMask.exec(element.value);
        if (matches) {
            if (!format) {
                format = '';
                for (var i = 1; (i < matches.length && i < 10); i++) {
                    format += "$" + i;
                }
            }
            for (var i = 1; (i < matches.length && i < 10); i++) {
                format = format.replace("$" + i, matches[i]);
            }
        } else {
            format = element.value;
        }
        return format;
    }
});

Element.addMethods({
    getMasterLabel: function (element) {
        if (!element)
            return;
        var label,
                target;

        if (element instanceof NodeList || typeof oElement === "RadioNodeList") {
            element = $A(element);
        }

        element = Object.isArray(element) ? element.first() : element;

        if (!element || !element.form || !element.id)
            return;

        target = element.form.name + '_' + element.name;

        if (label = $('labelFor_' + target))
            return label;
        else if (label = $(element.form).down("label[for='" + target + "']"))
            return label;
        else
            return $(element.form).down("label[for='" + element.name.replace(/\[\]/, '').replace(/\]*\[/g, '_').replace(/\]/, '') + "']");
    },
    getLabel: function (element, strict) {

        if (!element || !element.form || !element.id)
            return;

        var htmlFor = "", match, byId;

        if (!strict && /radio|checkbox/i.test(element.type)) {
            match = new RegExp("(\.*)_" + RegExp.escape(element.value) + "$", "i").exec(element.id);
            if (match) {
                if (byId = $("labelFor_" + match[1])) {
                    return byId;
                }

                htmlFor = "label[for='" + match[1] + "'], ";
            }
        }

        if (byId = $("labelFor_" + element.id)) {
            return byId;
        }

        return $(element.form).down(htmlFor + "label[for='" + element.id + "']");
    },
    setResizable: function (element, options) {
        options = Object.extend({
            autoSave: true,
            step: 1
        }, options);

        var staticOffset,
                cookie = new CookieJar(),
                container = new Element('div').addClassName("textarea-container"),
                grippie = new Element('div', {title: tr("msg-glissez_barre")}); // the draggable element

        $(element).insert({before: container});

        // We remove the margin between the textarea and the grippie
        $(container).insert(element);
        element.insert({after: grippie});

        // grippie's class and style
        grippie.addClassName('grippie-h').setOpacity(0.5);
        if (!element.visible()) {
            grippie.hide();
        }

        // When the mouse is pressed on the grippie, we begin the drag
        grippie.observe('mousedown', startDrag);

        // All this doesn't work with curry()
        element
                .observe("focus", function () {
                    container.addClassName("input-focus");
                })
                .observe("blur", function () {
                    container.removeClassName("input-focus");
                })
                .observe("mouseover", function () {
                    container.addClassName("input-hover");
                })
                .observe("mouseout", function () {
                    container.removeClassName("input-hover");
                });

        // Loads the height maybe saved in a cookie
        function loadHeight() {
            var h = cookie.getValue('ElementHeight', element.id);
            if (h)
                element.setStyle({height: (h + 'px')});
        }
        loadHeight.defer(); // deferred to prevent Firefox 2 resize bug

        function startDrag(e) {
            Event.stop(e);
            staticOffset = element.getHeight() - e.pointerY();

            if (!Prototype.Browser.WebKit) {
                element.setOpacity(0.4);
            }

            document.observe('mousemove', performDrag)
                    .observe('mouseup', endDrag);
        }

        function performDrag(e) {
            Event.stop(e);
            var h, iStep;
            if (typeof options.step == 'string') {
                iStep = element.getStyle(options.step);
                iStep = iStep.substr(0, iStep.length - 2);

                h = Math.max(iStep * 2, staticOffset + e.pointerY()) - Math.round(grippie.getHeight() / 2);
                h = Math.round(h / iStep) * iStep;
            } else {
                h = Math.max(32, staticOffset + e.pointerY());
            }
            element.setStyle({height: h + 'px'});
        }

        function endDrag(e) {
            Event.stop(e);

            if (!Prototype.Browser.WebKit) {
                element.setOpacity(1);
            }

            document.stopObserving('mousemove', performDrag)
                    .stopObserving('mouseup', endDrag);

            if (element.id) {
                cookie.setValue('ElementHeight', element.id, element.getHeight() - Math.round(grippie.getHeight() / 2));
            }
        }
    }
});

Element.addMethods('input', {
    addSpinner: function (element, options) {
        options = Object.extend({
            min: null,
            max: null,
            step: null,
            decimals: null,
            showPlus: false,
            fraction: false,
            deferEvent: false,
            showFraction: false,
            deferDelay: Prototype.Browser.IE ? 300 : 200,
            bigButtons: App.touchDevice
        }, options);

        element.spinner = {
            /** Calculate appropriate step
             *  ref is the reference to calculate the step, it is useful to avoid having bad steps :
             *  for exampele, when we have oField.value = 10, if we decrement, we'll have 5 instead of 9 without this ref
             *  Set it to -1 when decrementing, 0 when incrementing
             */
            getStep: function (ref) {
                ref = ref || 0;
                if (options.step == null) {
                    var value = Math.abs(element.value) + ref;
                    if (options.fraction && (value < 1))
                        return 0.25;
                    if (value < 10)
                        return 1;
                    if (value < 50)
                        return 5;
                    if (value < 100)
                        return 10;
                    if (value < 500)
                        return 50;
                    if (value < 1000)
                        return 100;
                    if (value < 5000)
                        return 500;
                    return 1000;
                } else {
                    return options.step;
                }
            },
            // Increment function
            inc: function (focus) {
                if (element.disabled || element.readOnly)
                    return;

                var step = Number(element.spinner.getStep(0.1));
                var result = (Math.round(parseFloat(Number(element.value)) / step) + 1) * step;

                if (options.max != null) {
                    result = (result <= options.max) ? result : options.max;
                }
                if (options.decimals !== null) {
                    result = result.toFixed(options.decimals);
                }
                result = ((options.showPlus && result >= 0) ? '+' : '') + result;

                if (options.deferEvent) {
                    element.value = result;
                    clearTimeout(this.timer);

                    this.timer = setTimeout((function () {
                        (element.onchange || Prototype.emptyFunction).bindAsEventListener(element)();
                        element.fire("ui:change");
                    }).bind(this), options.deferDelay);
                }
                else {
                    $V(element, result, true);
                }

                if (focus === true) {
                    element.select();
                }
            },
            // Decrement function
            dec: function (focus) {
                if (element.disabled || element.readOnly)
                    return;

                var step = Number(element.spinner.getStep(-0.1));
                var result = (Math.round(parseFloat(Number(element.value)) / step) - 1) * step;

                if (options.min != null) {
                    result = (result >= options.min) ? result : options.min;
                }
                if (options.decimals !== null) {
                    result = result.toFixed(options.decimals);
                }
                result = ((options.showPlus && result >= 0) ? '+' : '') + result;

                if (options.deferEvent) {
                    element.value = result;
                    clearTimeout(this.timer);

                    this.timer = setTimeout((function () {
                        (element.onchange || Prototype.emptyFunction).bindAsEventListener(element)();
                        element.fire("ui:change");
                    }).bind(this), options.deferDelay);
                }
                else {
                    $V(element, result, true);
                }

                if (focus === true) {
                    element.select();
                }
            },
            updateFraction: function (value) {
                if (Math.abs(value) >= 1 || value == 0) {
                    value = "";
                }
                else {
                    value = String.dec2frac(value, " / ");
                }

                element.up("table").down(".fraction").update(value);
            },
            updateFractionEvent: function (event) {
                var element = Event.element(event);
                element.spinner.updateFraction(element.value);
            }
        };

        if (element.value && options.decimals !== null) {
            element.value = Number(element.value).toFixed(options.decimals);
        }

        var fractionCell = (options.showFraction ? '<td class="fraction"></td>' : '');
        var table;

        if (options.bigButtons) {
            table = '<table class="control numericField big-buttons"><tr><td><button class="down" type="button"></button><span class="field"></span><button class="up" type="button"></button></td>' + fractionCell + '</tr></table>';
        }
        else {
            table = '<table class="control numericField"><tr><td class="field"></td><td class="arrows"><div class="up"></div><div class="down"></div></td>' + fractionCell + '</tr></table>';
        }

        element.insert({before: table});
        table = element.previous();
        table.down('.field').update(element);

        if (options.showFraction) {
            element.spinner.updateFraction(element.value);
            element.observe("ui:change", element.spinner.updateFractionEvent);
            element.observe("change", element.spinner.updateFractionEvent);
        }

        if (App.touchDevice) {
            table.down(".up").observe('touchstart', element.spinner.inc);
            table.down(".down").observe('touchstart', element.spinner.dec);
        }
        else {
            table.down(".up").observe('click', element.spinner.inc.curry(true));
            table.down(".down").observe('click', element.spinner.dec.curry(true));
        }
    }
});

Element.addMethods('select', {
    makeAutocomplete: function (element, options) {
        element = $(element);

        options = Object.extend({
            width: '100px'
        }, options);

        var selectedOption = element.options[element.selectedIndex],
                textInput = new Element('input', {type: 'text', style: 'width:' + options.width})
                .addClassName('autocomplete')
                .writeAttribute('autocomplete', false),
                list = new Element('div').addClassName('autocomplete'),
                views = [], viewToValue = {};

        textInput.value = selectedOption.disabled ? "" : selectedOption.text;
        element.insert({after: textInput}).insert({after: list}).hide();

        textInput.observe("focus", function (e) {
            Event.element(e).select();
        });

        $A(element.options).each(function (e) {
            if (e.disabled)
                return;
            views.push(e.text);
            viewToValue[e.text] = e.value;
        });

        new Autocompleter.Local(textInput, list.identify(), views, {
            afterUpdateElement: function (text, li) {
                $V(element, viewToValue[text.value]);
            }
        });
    }
});
