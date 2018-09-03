var DateFormat = Class.create();
Object.extend(DateFormat, {
    MONTH_NAMES: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    DAY_NAMES: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    LZ: function(x) {
        return (x < 0 || x > 9 ? "" : "0") + x;
    },
    compareDates: function(date1, dateformat1, date2, dateformat2) {
        var d1 = DateFormat.parseFormat(date1, dateformat1);
        var d2 = DateFormat.parseFormat(date2, dateformat2);
        if (d1 == 0 || d2 == 0)
            return -1;
        else if (d1 > d2)
            return 1;
        return 0;
    },
    format: function(date, format) {
        if (!date)
            return;

        format += "";
        var result = "",
                i = 0,
                c = "",
                token = "",
                y = date.getFullYear() + "",
                M = date.getMonth() + 1,
                d = date.getDate(),
                E = date.getDay(),
                H = date.getHours(),
                m = date.getMinutes(),
                s = date.getSeconds(),
                h = (H == 0 ? 12 : (H > 12 ? H - 12 : H));

        // Convert real date parts into formatted versions
        var value = {
            y: y + '', // Année
            yy: y.substring(2, 4), // Année sur 2 chiffres
            yyyy: y, // Année sur 4 chiffres
            M: M, // Mois sur un chiffre quand < à 10
            MM: DateFormat.LZ(M), // Mois sur deux chiffres
            MMM: DateFormat.MONTH_NAMES[M - 1], // Nom du mois
            NNN: DateFormat.MONTH_NAMES[M + 11], // Nom du mois en abbrégé
            d: d, // Numéro du jour dans le mois sur un chiffre quand < à 10
            dd: DateFormat.LZ(d), // Numéro du jour dans le mois
            E: DateFormat.DAY_NAMES[E + 7], // Nom du jour en abbrégé
            EE: DateFormat.DAY_NAMES[E], // Nom du jour
            H: H, // Heure sur 24h sur un chiffre quand < à 10
            HH: DateFormat.LZ(H), // Heure sur 24h
            h: h, // Heure sur 12h sur un chiffre quand < à 10
            hh: DateFormat.LZ(h), // Heure sur 12h
            K: H % 12, // Heure sur 12h sur 1 chiffre quand < à 10
            KK: DateFormat.LZ(H % 12), // Heure sur 12h sur 2 chiffres
            k: H + 1, // Heure sur 12h sur 1 chiffre plus 1
            kk: DateFormat.LZ(H + 1), // Heure sur 12h sur 2 chiffres pours 1
            a: H > 11 ? 'PM' : 'AM', // Méridien
            m: m, // Minutes sur 1 chiffre quand < à 10
            mm: DateFormat.LZ(m), // Minutes
            s: s, // Secondes sur 1 chiffre quand < à 10
            ss: DateFormat.LZ(s) // Secondes
        };
        while (i < format.length) {
            c = format.charAt(i);
            token = "";

            if (c == '\\') {
                result += format.charAt(++i);
                i++;
                continue;
            }
            else {
                while ((format.charAt(i) == c) && (i < format.length))
                    token += format.charAt(i++);

                if (value[token] != null)
                    result += value[token];
                else
                    result += token;
            }
        }
        return result;
    },
    _isInteger: function(val) {
        return parseInt(val) == val;
    },
    _getInt: function(str, i, minlength, maxlength) {
        // A possible replacement of this function, to be tested
        var sub = str.substring(i, i + maxlength);
        if (!sub)
            return null;
        return sub + '';

        for (var x = maxlength; x >= minlength; x--) {
            var token = str.substring(i, i + x);
            if (token.length < minlength)
                return null;
            if (DateFormat._isInteger(token))
                return token;
        }
        return null;
    },
    parseFormat: function(val, format) {
        val = val + "";
        format = format + "";
        var i_val = 0;
        var i_format = 0;
        var c = "";
        var token = "";
        var token2 = "";
        var x, y;
        var now = new Date();
        var year = now.getYear();
        var month = now.getMonth() + 1;
        var date = 1;
        var hh = now.getHours();
        var mm = now.getMinutes();
        var ss = now.getSeconds();
        var ampm = "";

        while (i_format < format.length) {
            // Get next token from format string
            c = format.charAt(i_format);
            token = "";

            if (c == '\\') {
                i_format += 2;
                continue;
            }

            while ((format.charAt(i_format) == c) && (i_format < format.length))
                token += format.charAt(i_format++);

            // Extract contents of value based on format token
            if (token == "yyyy" || token == "yy" || token == "y") {
                if (token == "yyyy")
                    x = 4;
                y = 4;
                if (token == "yy")
                    x = 2;
                y = 2;
                if (token == "y")
                    x = 2;
                y = 4;
                year = DateFormat._getInt(val, i_val, x, y);
                if (year == null)
                    return 0;
                i_val += year.length;
                if (year.length == 2) {
                    if (year > 70)
                        year = 1900 + (year - 0);
                    else
                        year = 2000 + (year - 0);
                }
            } else if (token == "MMM" || token == "NNN") {
                month = 0;
                for (var i = 0; i < DateFormat.MONTH_NAMES.length; i++) {
                    var month_name = DateFormat.MONTH_NAMES[i];
                    if (val.substring(i_val, i_val + month_name.length).toLowerCase() == month_name.toLowerCase()) {
                        if (token == "MMM" || (token == "NNN" && i > 11)) {
                            month = i + 1;
                            if (month > 12)
                                month -= 12;
                            i_val += month_name.length;
                            break;
                        }
                    }
                }
                if ((month < 1) || (month > 12))
                    return 0;
            } else if (token == "EE" || token == "E") {
                for (var i = 0; i < DateFormat.DAY_NAMES.length; i++) {
                    var day_name = DateFormat.DAY_NAMES[i];
                    if (val.substring(i_val, i_val + day_name.length).toLowerCase() == day_name.toLowerCase()) {
                        i_val += day_name.length;
                        break;
                    }
                }
            } else if (token == "MM" || token == "M") {
                month = DateFormat._getInt(val, i_val, token.length, 2);
                if (month == null || (month < 1) || (month > 12))
                    return 0;
                i_val += month.length;
            } else if (token == "dd" || token == "d") {
                date = DateFormat._getInt(val, i_val, token.length, 2);
                if (date == null || (date < 1) || (date > 31))
                    return 0;
                i_val += date.length;
            } else if (token == "hh" || token == "h") {
                hh = DateFormat._getInt(val, i_val, token.length, 2);
                if (hh == null || (hh < 1) || (hh > 12))
                    return 0;
                i_val += hh.length;
            } else if (token == "HH" || token == "H") {
                hh = DateFormat._getInt(val, i_val, token.length, 2);
                if (hh == null || (hh < 0) || (hh > 23))
                    return 0;
                i_val += hh.length;
            } else if (token == "KK" || token == "K") {
                hh = DateFormat._getInt(val, i_val, token.length, 2);
                if (hh == null || (hh < 0) || (hh > 11))
                    return 0;
                i_val += hh.length;
            } else if (token == "kk" || token == "k") {
                hh = DateFormat._getInt(val, i_val, token.length, 2);
                if (hh == null || (hh < 1) || (hh > 24))
                    return 0;
                i_val += hh.length;
                hh--;
            } else if (token == "mm" || token == "m") {
                mm = DateFormat._getInt(val, i_val, token.length, 2);
                if (mm == null || (mm < 0) || (mm > 59))
                    return 0;
                i_val += mm.length;
            } else if (token == "ss" || token == "s") {
                ss = DateFormat._getInt(val, i_val, token.length, 2);
                if (ss == null || (ss < 0) || (ss > 59))
                    return 0;
                i_val += ss.length;
            } else if (token == "a") {
                if (val.substring(i_val, i_val + 2).toLowerCase() == "am")
                    ampm = "AM";
                else if (val.substring(i_val, i_val + 2).toLowerCase() == "pm")
                    ampm = "PM";
                else
                    return 0;
                i_val += 2;
            } else {
                if (val.substring(i_val, i_val + token.length) != token)
                    return 0;
                else
                    i_val += token.length;
            }
        }
        // If there are any trailing characters left in the value, it doesn't match
        if (i_val != val.length)
            return 0;
        // Is date valid for month?
        if (month == 2) {
            // Check for leap year
            if (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)) { // leap year
                if (date > 29)
                    return 0;
            } else if (date > 28) {
                return 0;
            }
        }
        if ((month == 4) || (month == 6) || (month == 9) || (month == 11))
            if (date > 30)
                return 0;
        // Correct hours value
        if (hh < 12 && ampm == "PM")
            hh = hh - 0 + 12;
        else if (hh > 11 && ampm == "AM")
            hh -= 12;
        return new Date(year, month - 1, date, hh, mm, ss);
    },
    parse: function(val, format) {
        if (format) {
            return DateFormat.parseFormat(val, format);
        } else {
            var preferEuro = (arguments.length == 2) ? arguments[1] : false;
            var generalFormats = ['y-M-d', 'MMM d, y', 'MMM d,y', 'y-MMM-d', 'd-MMM-y', 'MMM d'];
            var monthFirst = ['M/d/y', 'M-d-y', 'M.d.y', 'MMM-d', 'M/d', 'M-d'];
            var dateFirst = ['d/M/y', 'd-M-y', 'd.M.y', 'd-MMM', 'd/M', 'd-M'];
            var checkList = [generalFormats, preferEuro ? dateFirst : monthFirst, preferEuro ? monthFirst : dateFirst];
            var d = null;
            for (var i = 0; i < checkList.length; i++) {
                var l = checkList[i];
                for (var j = 0; j < l.length; j++) {
                    d = DateFormat.parseFormat(val, l[j]);
                    if (d != 0)
                        return new Date(d);
                }
            }
            return null;
        }
    }
});

DateFormat.prototype = {
    initialize: function(format) {
        this.format = format;
    },
    parse: function(value) {
        return DateFormat.parseFormat(value, this.format);
    },
    format: function(value) {
        return DateFormat.format(value, this.format);
    }
};

Object.extend(Date.prototype, {
    format: function(format) {
        return DateFormat.format(this, format);
    },
    getWeekNumber: function() {
        var d = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
        d.setDate(d.getDate() - (d.getDay() + 6) % 7 + 3); // Nearest Thu
        var ms = d.valueOf(); // GMT
        d.setMonth(0);
        d.setDate(4); // Thu in Week 1
        return Math.round((ms - d.valueOf()) / (7 * 864e5)) + 1;
    }
});

var ProgressiveCalendar = Class.create({
    initialize: function(element, options) {
        this.element = $(element);

        this.options = Object.extend({
            icon: "images/icons/calendar.gif",
            container: $(document.body)
        }, options || {});

        if (!(this.elementView = $(this.element.form.elements[this.element.name + '_da']))) {
            this.elementView = new Element('input', {type: 'text', readonly: 'readonly', className: this.element.className || 'date'});
            this.element.insert({before: this.elementView});
        }

        this.date = this.getDate();
        $V(this.elementView, (parseInt(this.date.day) ? this.pad(this.date.day) + '/' : '') +
                (parseInt(this.date.month) ? this.pad(this.date.month) + '/' : '') +
                (parseInt(this.date.year) ? this.pad(this.date.year, 4) : ''));

        if (this.options.icon) {
            var cont = new Element('div', {className: "datePickerWrapper", style: 'position:relative;border:none;padding:0;margin:0;display:inline-block;'});
            this.elementView.wrap(cont);
            var icon = new Element('img', {src: this.options.icon, className: 'inputExtension'});

            // No icon padding specified, default to 3px and calculate dynamically on image load
            var padding = 3;
            icon.observe('load', function() {
                var elementDim = this.elementView.getDimensions();
                var iconDim = icon.getDimensions();
                padding = parseInt(elementDim.height - iconDim.height) / 2;
            }.bindAsEventListener(this)).setStyle({position: 'absolute', right: padding + 'px', top: padding + 'px'});
            cont.insert(icon);

            icon.observe('click', this.createPicker.bindAsEventListener(this));
        } else {
            this.elementView.observe('click', this.createPicker.bindAsEventListener(this));
        }
    },
    getDate: function() {
        var parts = this.element.value.split('-');
        return {
            year: parts[0] || 0,
            month: parts[1] || 0,
            day: parts[2] || 0
        };
    },
    setDate: function(date) {
        $V(this.element, this.pad(date.year, 4) + '-' + this.pad(date.month) + '-' + this.pad(date.day));
        $V(this.elementView, (parseInt(date.day) ? this.pad(date.day) + '/' : '') +
                (parseInt(date.month) ? this.pad(date.month) + '/' : '') +
                (parseInt(date.year) ? this.pad(date.year, 4) : ''));
    },
    pad: function(str, length) {
        return String(str).pad('0', length || 2);
    },
    fillTable: function(table, cols, rows, min, max, type, date, slider) {
        if (min === null) {
            min = max - rows * cols + 1;
        }

        if (!slider && type == 'year' && date[type] != '') {
            while (!(min <= date[type] && max >= date[type])) {
                if (min > date[type]) {
                    max = min - 1;
                    min = max - (rows * cols) + 1;
                }
                else
                {
                    min = max + 1;
                    max = min + (rows * cols) - 1;
                }
            }
        }

        var i, j, body = table.select('tbody').first(), origMin = min;

        for (i = 0; i < rows; i++) {
            var row = new Element('tr').addClassName('calendarRow');
            for (j = 0; j < cols; j++) {
                if (i == 0 && j == 0 && type == 'year') {
                    var before = new Element('td', {rowSpan: rows, style: 'width:0.1%;padding:1px;'}).addClassName('day').update('<');
                    before.observe('click', function(e) {
                        e.stop();
                        body.update();
                        this.fillTable(table, cols, rows, origMin - cols * rows, max - cols * rows, type, date, true);
                    }.bindAsEventListener(this));
                    row.insert(before);
                }

                if (min <= max) {
                    var cell = new Element('td', {style: 'padding:1px;width:16.7%;'}).addClassName('day').update(min);
                    if (min++ == date[type])
                        cell.addClassName('current');
                    cell.observe('click', function(e) {
                        e.stop();
                        var element = e.element();
                        element.up(1).select('.current').invoke('removeClassName', 'current');
                        element.addClassName('current');
                        date[type] = element.innerHTML;
                        this.setDate(date);
                    }.bindAsEventListener(this))
                            .observe('dblclick', function(e) {
                                e.stop();
                                this.hidePicker();
                            }.bindAsEventListener(this));
                    row.insert(cell);
                }

                if (i == 0 && j == cols - 1 && type == 'year') {
                    var after = new Element('td', {rowSpan: rows, style: 'width:0.1%;padding:1px;', className: 'day'}).update('>');
                    after.observe('click', function(e) {
                        e.stop();
                        body.update();
                        this.fillTable(table, cols, rows, origMin + cols * rows, max + cols * rows, type, date, true);
                    }.bindAsEventListener(this));
                    row.insert(after);
                }
            }
            body.insert(row);
        }
    },
    createTable: function(container, title, cols, rows, min, max, type, date) {
        container.insert('<div />');

        var newContainer = container.childElements().last();
        newContainer.insert('<table style="width:100%;"><tbody /></table>');
        var table = newContainer.childElements().last();

        this.fillTable(table, cols, rows, min, max, type, date, false);

        if (title) {
            newContainer.insert('<a href="#1" style="text-align:center;display:block;font-weight:bold;">' + title + ' <img src="./images/icons/downarrow.png" height="12" /></a>');
        }

        if (title) {
            table.nextSiblings().first().observe('click', function(e) {
                e.stop();
                var element = e.findElement('a');
                if (!element.previousSiblings().first().select('.current').length)
                    return;

                var next = element.nextSiblings().first();
                if (next.visible()) {
                    switch (type) {
                        case 'year':
                            date.month = 0;
                        case 'month':
                            date.day = 0;
                    }
                    next.hide().select('table').invoke('hide');
                    element.select('img').first().src = './images/icons/downarrow.png';
                }
                else {
                    var current = next.select('.current'),
                            v = current.length ? current.first().innerHTML : 0;
                    switch (type) {
                        case 'year':
                            date.month = v;
                            break;
                        case 'month':
                            date.day = v;
                            break;
                    }
                    next.show().select('table').first().show();
                    element.select('img').first().src = './images/icons/cancel.png';
                }

                this.setDate(date);
            }.bindAsEventListener(this));
        }

        return newContainer;
    },
    createPicker: function(e) {
        if (!this.picker)
            this.picker = new Element('div', {style: 'position:absolute;', className: 'datepickerControl'}).observe('click', Event.stop);
        if (ProgressiveCalendar.activePicker)
            ProgressiveCalendar.activePicker.hidePicker();
        var container,
                now = new Date(),
                date = this.getDate();

        this.picker.update('<a href="#1" style="text-align:center;display:block;font-weight:bold;">' + tr('Année') + ' <img src="./images/icons/cancel.png" height="12" /></a>');
        this.picker.select('a').first().observe('click', function() {
            $V(this.element, '');
            $V(this.elementView, '');
            this.hidePicker();
        }.bindAsEventListener(this));

        container = this.createTable(this.picker, tr('Mois'), 4, 5, null, parseInt(now.getFullYear()), 'year', date);
        var monthContainer = this.createTable(container, tr('Jour'), 6, 2, 1, 12, 'month', date);
        var dayContainer = this.createTable(monthContainer, null, 6, 6, 1, 31, 'day', date);

        var pos = this.elementView.cumulativeOffset();
        this.picker.setStyle({
            top: pos.top + this.elementView.getDimensions().height + 'px',
            left: pos.left + 'px'
        });

        container = $(this.options.container);
        if (container)
            container.insert(this.picker);
        else
            this.insert({after: this.picker});

        if (monthContainer.firstChild.select('.current').length == 0)
            monthContainer.hide();

        if (dayContainer.firstChild.select('.current').length == 0)
            dayContainer.hide();

        e.stop();
        this.picker.show();
        document.observe('click', this.hidePicker = this.hidePicker.bindAsEventListener(this));
        ProgressiveCalendar.activePicker = this;
    },
    hidePicker: function(e) {
        this.picker.hide();
        ProgressiveCalendar.activePicker = null;
        document.stopObserving('click', this.hidePicker);
    }
});

var Calendar = {
    // This function is bound to date specification
    dateProperties: function(date, dates) {
        if (!date)
            return {};
        var properties = {},
                sDate = date.toDATE();

        if (dates.limit.start && dates.limit.start > sDate ||
                dates.limit.stop && dates.limit.stop < sDate) {
            properties.disabled = true;
        }

        if ((dates.current.start || dates.current.stop) &&
                !(dates.current.start && dates.current.start > sDate || dates.current.stop && dates.current.stop < sDate)) {
            properties.className = "active";
        }

        if (dates.spots.include(sDate)) {
            properties.label = "Date";
        }
        return properties;
    },
    prepareDates: function(dates) {
        dates.current.start = Calendar.prepareDate(dates.current.start);
        dates.current.stop = Calendar.prepareDate(dates.current.stop);
        dates.limit.start = Calendar.prepareDate(dates.limit.start);
        dates.limit.stop = Calendar.prepareDate(dates.limit.stop);
        dates.spots = dates.spots.map(Calendar.prepareDate);
    },
    prepareDate: function(date) {
        if (!date)
            return null;
        return Date.isDATETIME(date) ? Date.fromDATETIME(date).toDATE() : date;
    },
    regField: function(element, dates, options) {
        if (!$(element) || $V(element.form._locked) == 1)
            return;

        if (element.hasClassName('datepicker'))
            return;

        if (dates) {
            dates.spots = $A(dates.spots);
        }

        dates = Object.extend({
            current: {
                start: null,
                stop: null
            },
            limit: {
                start: null,
                stop: null
            },
            spots: []
        }, dates);

        Calendar.prepareDates(dates);

        // Default options
        options = Object.extend({
            datePicker: true,
            timePicker: false,
            altElement: element,
            altFormat: 'yyyy-MM-dd',
            icon: window.Mobile ? "mobile/images/icons/calendar.gif" : "images/icons/calendar.gif",
            //locale: "fr_FR", 
            // ** @Alteração: Colocar o calendario em portugues  - @Nome: diogo.a.santos - @Data: 27-11-2012
            locale: window.locales["js-date_language"],
            timePickerAdjacent: !window.Mobile,
            use24hrs: true,
            weekNumber: true,
            container: $(document.body),
            dateProperties: function(date) {
                return Calendar.dateProperties(date, dates)
            },
            center: window.Mobile,
            editable: false,
            emptyButton: true
        }, options);

        options.captureKeys = !options.inline;
        options.emptyButton = options.emptyButton && (!options.noView && !element.hasClassName('notNull'));

        var elementView;

        if (!(elementView = $(element.form.elements[element.name + '_da']))) {
            elementView = new Element('input', {type: 'text', readonly: 'readonly', name: element.name + '_da'});
            elementView.className = (element.className || 'date');
            element.insert({before: elementView});
        }

        if (window.Mobile) {
            elementView.disabled = "disabled";
        }

        if (element.hasClassName('dateTime')) {
            options.timePicker = true;
            options.altFormat = 'yyyy-MM-dd HH:mm:ss';
        }
        else if (element.hasClassName('time')) {
            options.timePicker = true;
            options.datePicker = false;
            options.altFormat = 'HH:mm:ss';
            options.icon = window.Mobile ? "mobile/images/icons/time.png" : "images/icons/time.png";
        }

        var datepicker = new Control.DatePicker(elementView, options);
        if (options.editable) {
            var onChange = (function() {
                var date = DateFormat.parse(elementView.value, this.options.currentFormat);
                this.element.value = DateFormat.format(date, this.options.altFormat);
            }).bindAsEventListener(datepicker);

            elementView.mask(datepicker.options.currentFormat.replace(/[a-z]/gi, "9"));
            elementView.observe("ui:change", onChange).observe("focus", onChange);
            elementView.writeAttribute("readonly", false);
        }

        if (options.inline) {
            Event.stopObserving(document, 'click', datepicker.hidePickerListener);
        }

        var showPicker = function(e) {
            Event.stop(e);

            // Focus will be triggered a second time when the date is selected
            if (Prototype.Browser.IE) {
                if (this._dontShow && e.type !== "click") {
                    this._dontShow = false;
                    return;
                }
                else {
                    this._dontShow = true;
                    setTimeout((function() {
                        //this._dontShow = false;
                    }).bind(this), 2000);
                }
            }

            this.show.bind(datepicker)(e);

            var dp = $(this.datepicker.element);

            if (!dp)
                return;

            dp.setStyle({zIndex: ""}).// FIXME do not set it in datepicker.js
                    unoverflow();

        }.bindAsEventListener(datepicker);

        if (options.noView) {
            // @todo: Passer ça en classe CSS
            datepicker.element.setStyle({width: 0, border: 'none', background: 'none', position: 'absolute'}).addClassName("opacity-0");
            datepicker.element.up().setStyle({width: '16px'});
            if (datepicker.icon) {
                datepicker.icon.setStyle({
                    position: 'relative',
                    right: 0,
                    top: ""
                });
            }
        }
        else {
            if (window.Mobile) {
                var div = new Element('div', {style: 'position:absolute;opacity:0;'});
                var parent = elementView.up();
                // solution pour éviter de créer plusieurs div quand les pages sont chargées en ajax 
                // les insertions se font sur "content" et "content" n'est pas rafraichi
                // trouver un id 
                parent.insert(div);
                div.clonePosition(elementView);
                var pos = elementView.cumulativeOffset();

                div.observe('click', function(e) {
                    Event.stop(e);
                    this.show.bind(datepicker)(e);

                    if (!this.datepicker.element)
                        return;
                    $(this.datepicker.element).centerHV(pos.top);
                    Calendar.mobileHide(datepicker);
                }.bindAsEventListener(datepicker));
            }
            else {
                elementView.observe('click', showPicker).observe('focus', showPicker);
            }
        }

        // We update the view
        if (element.value && !elementView.value) {
            var date = DateFormat.parse(element.value, datepicker.options.altFormat);
            elementView.value = DateFormat.format(date, datepicker.options.currentFormat) || '';
        }

        if (datepicker.icon) {
            datepicker.icon.observe("click", function() {
                var element = this.datepicker ? this.datepicker.element : this.element;

                if (options.center) {
                    var posIcon = this.icon.cumulativeOffset();
                    $(element).centerHV(posIcon.top);
                    Calendar.mobileHide(datepicker);
                }
                else {
                    $(element).
                            setStyle({zIndex: ""}).// FIXME do not set it in datepicker.js
                            unoverflow();
                }
            }.bindAsEventListener(datepicker));
        }

        datepicker.handlers.onSelect = function(date) {
            element.fire("ui:change");

            if (elementView != element) {
                elementView.fire("ui:change");
            }
        };

        element.addClassName('datepicker');

        return datepicker;
    },
    mobileHide: function(picker) {
        document.observeOnce('click', function(e) {
            $(picker).hide();
        });
    },
    regProgressiveField: function(element, options) {
        new ProgressiveCalendar(element, options);
    }
};


/**
 * Durations expressed in milliseconds
 */
Object.extend(Date, {
    // Exact durations
    millisecond: 1,
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    // Approximative durations
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365.2425 * 24 * 60 * 60 * 1000,
    isDATE: function(sDate) {
        return /^\d{4}-\d{2}-\d{2}$/.test(sDate);
    },
    isDATETIME: function(sDateTime) {
        return /^\d{4}-\d{2}-\d{2}[ \+T]\d{2}:\d{2}:\d{2}$/.test(sDateTime);
    },
    // sDate must be: YYYY-MM-DD
    fromDATE: function(sDate) {
        var match;

        if (!(match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(sDate)))
            Assert.that(match, "'%s' is not a valid DATE", sDate);

        return new Date(match[1], match[2] - 1, match[3]); // Js months are 0-11!!
    },
    // sDateTime must be: YYYY-MM-DD HH:MM:SS
    fromDATETIME: function(sDateTime) {
        var match, re = /^(\d{4})-(\d{2})-(\d{2})[ \+T](\d{2}):(\d{2}):(\d{2})$/;

        if (/^(\d{4})-(\d{2})-(\d{2})[ \+T](\d{2}):(\d{2})$/.exec(sDateTime))
            sDateTime += '-00';

        if (!(match = re.exec(sDateTime)))
            Assert.that(match, "'%s' is not a valid DATETIME", sDateTime);

        return new Date(match[1], match[2] - 1, match[3], match[4], match[5], match[6]); // Js months are 0-11!!
    },
    // sTime must be: HH:MM:SS
    fromTIME: function(sTime) {
        var match;

        if (!(match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(sTime)))
            Assert.that(match, "'%s' is not a valid TIME", sTime);

        return new Date(0, 0, 0, match[1], match[2], match[3]);
    },
    fromLocaleDate: function(sDate) {
        var match, re = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!(match = re.exec(sDate)))
            Assert.that(match, "'%s' is not a valid display date", sDate);

        return new Date(match[3], match[2] - 1, match[1]);
    },
    fromLocaleDateTime: null
});

Class.extend(Date, {
    toDATE: function() {
        var y = this.getFullYear(),
                m = this.getMonth() + 1, // Js months are 0-11!!
                d = this.getDate();
        return printf("%04d-%02d-%02d", y, m, d);
    },
    toTIME: function() {
        var h = this.getHours(),
                m = this.getMinutes(),
                s = this.getSeconds();
        return printf("%02d:%02d:%02d", h, m, s);
    },
    toDATETIME: function(useSpace) {
        var h = this.getHours(),
                m = this.getMinutes(),
                s = this.getSeconds();

        if (useSpace)
            return this.toDATE() + printf(" %02d:%02d:%02d", h, m, s);
        else
            return this.toDATE() + printf("+%02d:%02d:%02d", h, m, s);
    },
    toLocaleDate: function() {
        var y = this.getFullYear();
        var m = this.getMonth() + 1; // Js months are 0-11!!
        var d = this.getDate();
        return printf("%02d/%02d/%04d", d, m, y);
    },
    toLocaleDateTime: function() {
        var h = this.getHours();
        var m = this.getMinutes();
        return this.toLocaleDate() + printf(" %02d:%02d", h, m);
    },
    toLocaleTime: function() {
        var h = this.getHours();
        var m = this.getMinutes();
        return printf(" %02d:%02d", h, m);
    },
    resetDate: function() {
        this.setFullYear(1970);
        this.setMonth(1);
        this.setDate(1);
    },
    resetTime: function() {
        this.setHours(0);
        this.setMinutes(0);
        this.setSeconds(0, 0); // s, ms
    },
    addDays: function(iDays) {
        this.setDate(this.getDate() + parseInt(iDays, 10));
        return this;
    },
    addHours: function(iHours) {
        this.setHours(this.getHours() + parseInt(iHours, 10));
        return this;
    },
    addMinutes: function(iMinutes) {
        this.setMinutes(this.getMinutes() + parseInt(iMinutes, 10));
        return this;
    },
    addYears: function(iYears) {
        this.setFullYear(this.getFullYear() + parseInt(iYears, 10));
        return this;
    }
});

Control.DatePickerPanel.prototype.dateClickedListener = function (date, timeOverride) {
    var dateCopy = new Date(date.getTime());
    return function (e) {
        if (e.target.hasClassName('now')) {
            dateCopy = new Date();
        }
        if (e.element().hasClassName('disabled'))
            return false;
        if (!timeOverride) {
            dateCopy.setHours(this.currentDate.getHours());
            dateCopy.setMinutes(this.currentDate.getMinutes());
            dateCopy.setSeconds(0);
        }
        this.dateClicked(dateCopy, this.options.timePicker);
    }.bindAsEventListener(this);
};