/* $Id: prototypex.js 17323 2012-11-15 13:50:11Z phenxdesign $ */

/**
 * @package Mediboard
 * @subpackage includes
 * @version $Revision: 17323 $
 * @author SARL OpenXtrem
 * @license GNU General Public License, see http://www.gnu.org/licenses/gpl.html 
 */

/**
 * Class utility object
 */
Class.extend = function (oClass, oExtension) {
  Object.extend(oClass.prototype, oExtension);
};
 
/**
 * Function class
 */
Class.extend(Function, {
  getSignature: function() {
    var re = /function ([^\{]*)/;
    return this.toString().match(re)[1];
  }
});

/**
 * Recursively merges two objects.
 * @param {Object} src - source object (likely the object with the least properties)
 * @param {Object} dest - destination object (optional, object with the most properties)
 * @return {Object} recursively merged Object
 */
Object.merge = function(src, dest){
  var v, result = dest || {};
  for(var i in src){
    v = src[i];
    result[i] = (v && typeof(v) === 'object' && !(v.constructor === Array || v.constructor === RegExp) && !Object.isElement(v)) ? Object.merge(v, dest[i]) : result[i] = v;
  }
  return result;
};

/** TODO: Remove theses fixes */
//fixes getDimensions bug which does not work with Android
Object.extend(document.viewport,{
  getDimensions: function() {
    var dimensions = { }, B = Prototype.Browser;
    $w('width height').each(function(d) {
      var D = d.capitalize();
      if (B.WebKit && !document.evaluate) {
        // Safari <3.0 needs self.innerWidth/Height
        dimensions[d] = self['inner' + D];
      } else if (B.Opera && parseFloat(window.opera.version()) < 9.5) {
        // Opera <9.5 needs document.body.clientWidth/Height
        dimensions[d] = document.body['client' + D]
      } else {
        dimensions[d] = document.documentElement['client' + D];
      }
    });
    return dimensions;
  }
});
// Fixes a bug that scrolls the page when in an autocomplete 
Class.extend(Autocompleter.Base, {
  markPrevious: function() {
   if(this.index > 0) {this.index--;}
   else {
    this.index = this.entryCount-1;
    this.update.scrollTop = this.update.scrollHeight;
   }
   var selection = this.getEntry(this.index);
   if(selection.offsetTop < this.update.scrollTop){
    this.update.scrollTop = this.update.scrollTop-selection.offsetHeight;
   }
  },
  markNext: function() {
   if(this.index < this.entryCount-1) {this.index++;}
   else {
    this.index = 0;
    this.update.scrollTop = 0;
   }
   var selection = this.getEntry(this.index);
   if((selection.offsetTop+selection.offsetHeight) > this.update.scrollTop+this.update.offsetHeight){
    this.update.scrollTop = this.update.scrollTop+selection.offsetHeight;
   }
  },
  updateChoices: function(choices) {
    if(!this.changed && this.hasFocus) {
      this.update.innerHTML = choices;
      Element.cleanWhitespace(this.update);
      Element.cleanWhitespace(this.update.down());

      if(this.update.firstChild && this.update.down().childNodes) {
        this.entryCount =
          this.update.down().childNodes.length;
        for (var i = 0; i < this.entryCount; i++) {
          var entry = this.getEntry(i);
          entry.autocompleteIndex = i;
          this.addObservers(entry);
        }
      } else {
        this.entryCount = 0;
      }

      this.stopIndicator();
      this.update.scrollTop = 0;
      
      // was "this.index = 0;"
      this.index = this.options.dontSelectFirst ? -1 : 0;

      if(this.entryCount==1 && this.options.autoSelect) {
        this.selectEntry();
        this.hide();
      } else {
        this.render();
      }
    }
  },
  onKeyPress: function(event) {
    if(this.active)
      switch(event.keyCode) {
       case Event.KEY_TAB:
         // Tab key should not select an element if this is a STR autocomplete
         if (this.element.hasClassName("str")) {
           this.hide();
           this.active = false;
           this.changed = false;
           this.hasFocus = false;
           return;
         }
       case Event.KEY_RETURN:
         if (this.index < 0) return; 
         this.selectEntry();
         Event.stop(event);
       case Event.KEY_ESC:
         this.hide();
         this.active = false;
         Event.stop(event);
         return;
       case Event.KEY_LEFT:
       case Event.KEY_RIGHT:
         return;
       case Event.KEY_UP:
         this.markPrevious();
         this.render();
         Event.stop(event);
         return;
       case Event.KEY_DOWN:
         this.markNext();
         this.render();
         Event.stop(event);
         return;
      }
     else
       if(event.keyCode==Event.KEY_TAB || event.keyCode==Event.KEY_RETURN ||
         (Prototype.Browser.WebKit > 0 && event.keyCode == 0)) return;

    this.changed = true;
    this.hasFocus = true;

    if(this.observer) clearTimeout(this.observer);
    this.observer =
      setTimeout(this.onObserverEvent.bind(this), this.options.frequency*1000);
  },
  onBlur: function(event) {
    if (this.updateHasFocus) return;
    
    if (Prototype.Browser.IE && this.update.visible()) {  
      // fix for IE: don't blur when clicking the vertical scrollbar (if there is one)
      var verticalScrollbarWidth = this.update.offsetWidth - this.update.clientWidth -
        this.update.clientLeft - (parseInt(this.update.currentStyle['borderRightWidth']) || 0);
        
      if (verticalScrollbarWidth) {
        var x = event.clientX, 
            y = event.clientY, 
            parent = this.update.offsetParent,
            sbLeft = this.update.offsetLeft + this.update.clientLeft + this.update.clientWidth,
            sbTop = this.update.offsetTop + this.update.clientTop,
            sbRight = sbLeft + verticalScrollbarWidth,
            sbBottom = sbTop + this.update.clientHeight;
            
        while (parent) {
          var offs = parent.offsetLeft + parent.clientLeft, scrollOffs = offs - parent.scrollLeft;
          sbLeft = (sbLeft += scrollOffs) < offs ? offs : sbLeft;
          sbRight = (sbRight += scrollOffs) < offs ? offs : sbRight;
          offs = parent.offsetTop + parent.clientTop; scrollOffs = offs - parent.scrollTop;
          sbTop = (sbTop += scrollOffs) < offs ? offs : sbTop;
          sbBottom = (sbBottom += scrollOffs) < offs ? offs : sbBottom;
          parent = parent.offsetParent;
        }
        
        if (x >= sbLeft && x < sbRight && y >= sbTop && y < sbBottom) {
          this.element.setActive();
          return;
        }
      }
    }
    
    setTimeout(this.hide.bind(this), 250);
    this.hasFocus = false;
    this.active = false;
  },

  getTokenBounds: function() {
    if (!this.options.caretBounds && (null != this.tokenBounds)) return this.tokenBounds;
    var value = this.element.value;
    if (value.strip().empty()) return [-1, 0];
    
    // This has been added so that the token bounds are relative to the current cert position
    if (this.options.caretBounds) {
      var caret = this.element.getInputSelection(true).start;
      var start = value.substr(0, caret).lastIndexOf("\n")+1;
      var end = value.substr(caret).indexOf("\n")+caret+1;
      return (this.tokenBounds = [start, end]);
    }
    
    // This needs to be declared here as the arguments.callee is not the same
    var firstDiff = function(newS, oldS) {
      var boundary = Math.min(newS.length, oldS.length);
      for (var index = 0; index < boundary; ++index)
        if (newS[index] != oldS[index])
          return index;
      return boundary;
    };
    /////////////
    
    var diff = firstDiff(value, this.oldElementValue);
    var offset = (diff == this.oldElementValue.length ? 1 : 0);
    var prevTokenPos = -1, nextTokenPos = value.length;
    var tp;
    for (var index = 0, l = this.options.tokens.length; index < l; ++index) {
      tp = value.lastIndexOf(this.options.tokens[index], diff + offset - 1);
      if (tp > prevTokenPos) prevTokenPos = tp;
      tp = value.indexOf(this.options.tokens[index], diff + offset);
      if (-1 != tp && tp < nextTokenPos) nextTokenPos = tp;
    }
    return (this.tokenBounds = [prevTokenPos + 1, nextTokenPos]);
  },
  selectEntry: function() {
    this.active = false;
    if(this.index > -1){ 
      this.updateElement(this.getCurrentEntry());
    }
  }
});

// Fix a bug in IE9 where whitespace between cells adds empty cells *sometimes*
if (Prototype.Browser.IE && document.documentMode && document.documentMode == 9) {
  Object.toHTML = function(object) {
    return (object && object.toHTML ? object.toHTML() : String.interpret(object)).replace(/>\s+<(t[dh])/gi, "><$1");
  }
}

// FIX in Scriptaculous
// Précompilation plutot qu'un test dans la fonction : plus rapide
if (!Prototype.Browser.IE || document.documentMode > 8) {
  Droppables.isAffected = function(point, element, drop) {
    Position.prepare();
    return (
      (drop.element!=element) &&
      ((!drop._containers) ||
        this.isContained(element, drop)) &&
      ((!drop.accept) ||
        (Element.classNames(element).detect(
          function(v) { return drop.accept.include(v) } ) )) &&
      Position.withinIncludingScrolloffsets(drop.element, point[0], point[1]) );
  };
}
else {
  Droppables.isAffected = function(point, element, drop) {
    Position.prepare();
    return (
      (drop.element!=element) &&
       drop.element.visible() && // Cette ligne a été ajoutée. Dans le plan de soins, une cellule cachée a les dimensions du plan de soins entier.
      ((!drop._containers) ||
        this.isContained(element, drop)) &&
      ((!drop.accept) ||
        (Element.classNames(element).detect(
          function(v) { return drop.accept.include(v) } ) )) &&
      Position.withinIncludingScrolloffsets(drop.element, point[0], point[1]) );
  };
}

if (Prototype.Browser.IE && document.documentMode >= 10) {
  Element.addMethods({
    setOpacity: function(element, value) {
      element = $(element);
      element.style.opacity = (value == 1 || value === '') ? '' :
        (value < 0.00001) ? 0 : value;
      return element;
    }
  });
}

Class.extend(Ajax.Request, {
  abort: function() {
    this.transport.abort();
  }
});

Class.extend(Array, {
  notMatch: function(css) {
    return this.reject(function(e){
      return e.match(css);
    });
  }
});

// Fix to get better window size ( document.documentElement instead of document.body )
// Needs to be done after everything
(function(){
  try {
  Object.extend(Control.Overlay, {
    positionOverlay: function(){
      Control.Overlay.container.setStyle({
        width: document.documentElement.clientWidth + 'px',
        height: document.documentElement.clientHeight + 'px'
      });
    }
  });
  } catch (e) {}
}).defer();

Element.addMethods({
  // To fix a bug in Prototype 1.6.0.3 (no need to patch the lib)
  getOffsetParent: function(element) {
    if (element.offsetParent) return $(element.offsetParent);
    if (element == document.body) return $(element);

    while ((element = element.parentNode) && element != document.body && element != document) // Added " && element != document"
      if (Element.getStyle(element, 'position') != 'static')
        return $(element);

    return $(document.body);
  },
  absolutize: function (element) {
    element = $(element);

    if (Element.getStyle(element, 'position') === 'absolute') {
      return element;
    }

    var offsetParent = element.getOffsetParent();
    var eOffset = element.viewportOffset(),
     pOffset = offsetParent.viewportOffset();

    var offset = eOffset.relativeTo(pOffset);
    var layout = element.getLayout();

    element.store('prototype_absolutize_original_styles', {
      left:   element.getStyle('left'),
      top:    element.getStyle('top'),
      width:  element.getStyle('width'),
      height: element.getStyle('height'),
      position: element.getStyle('position')
    });

    element.setStyle({
      position: 'absolute',
      top:    offset.top + 'px',
      left:   offset.left + 'px',
      width:  layout.get('width') + 'px',
      height: layout.get('height') + 'px'
    });

    return element;
  }
});

/** END HACKS */

/**
 * Element.ClassNames class
 */
Class.extend(Element.ClassNames, {
  load: function (sCookieName, nDuration) {
    var oCookie = new CookieJar({expires: nDuration});
    var sValue = oCookie.getValue(sCookieName, this.element.id);
    if (sValue) {
      this.set(sValue);
    }
  },
  
  save: function (sCookieName, nDuration) {
    new CookieJar({expires: nDuration}).setValue(sCookieName, this.element.id, this.toString());
  },

  toggle: function(sClassName) {
    this[this.include(sClassName) ? 'remove' : 'add'](sClassName);
  },
  
  flip: function(sClassName1, sClassName2) {
    if (this.include(sClassName1)) {
      this.remove(sClassName1);
      this.add(sClassName2);
      return;
    }
    
    if (this.include(sClassName2)) {
      this.remove(sClassName2);
      this.add(sClassName1);
      return;
    }
  }
});

function NoClickDelay(el) {
  this.element = typeof el == 'object' ? el : document.getElementById(el);
  if( window.Touch ) this.element.addEventListener('touchstart', this, false);
}

NoClickDelay.prototype = {
  handleEvent: function(e) {
    var callback = {
      touchstart: this.onTouchStart,
      touchmove:  this.onTouchMove,
      touchend:   this.onTouchEnd
    }[e.type];
    
    if (callback) {
      callback(e);
    }
  },

  onTouchStart: function(e) {
    e.preventDefault();
    this.moved = false;

    this.theTarget = document.elementFromPoint(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
    if(this.theTarget.nodeType == 3) this.theTarget = theTarget.parentNode;
    this.theTarget.className+= ' pressed';

    this.element.addEventListener('touchmove', this, false);
    this.element.addEventListener('touchend', this, false);
  },

  onTouchMove: function(e) {
    this.moved = true;
    this.theTarget.className = this.theTarget.className.replace(/ ?pressed/gi, '');
  },

  onTouchEnd: function(e) {
    this.element.removeEventListener('touchmove', this, false);
    this.element.removeEventListener('touchend', this, false);

    if( !this.moved && this.theTarget ) {
      this.theTarget.className = this.theTarget.className.replace(/ ?pressed/gi, '');
      var theEvent = document.createEvent('MouseEvents');
      theEvent.initEvent('click', true, true);
      this.theTarget.dispatchEvent(theEvent);
    }

    this.theTarget = undefined;
  }
};

// Makes an element to be in the viewport instead of overflow
Element.addMethods({
  unoverflow: function(element, offset) {
    var dim = element.getDimensions(); // Element dimensions
    var pos = element.cumulativeOffset(); // Element position
    var scroll = document.viewport.getScrollOffsets(); // Viewport offset
    var viewport = document.viewport.getDimensions(); // Viewport size
    offset = offset || 0;

    pos.left -= scroll.left;
    pos.top -= scroll.top;

    pos.right  = pos[2] = pos.left + dim.width; // Element right position
    pos.bottom = pos[3] = pos.top + dim.height; // Element bottom position
    
    // If the element exceeds the viewport on the right
    if (pos.right > (viewport.width - offset)) {
      element.style.left = parseInt(element.style.left) - (pos.right - viewport.width) - offset + 'px';
    }

    // If the element exceeds the viewport on the top
    if (pos.top < 0) {
      element.style.top = '0px';
    }
    // If the element exceeds the viewport on the bottom
    else if (pos.bottom > (viewport.height - offset)) {
      element.style.top = Math.max(0, parseInt(element.style.top) - (pos.bottom - viewport.height) - offset) + 'px';
    }
    
    return element;
  },
  
  centerHV : function(element, pos) {
    element.setStyle({
      left: 0
    });
    
    var viewport = document.viewport.getDimensions(); // Viewport size
    var dim = element.getDimensions(); // Element dimensions
    
    pos = parseInt(pos || 0)-(dim.height/2);
    
    element.setStyle({
      top: Math.max(pos, 100) + "px",
      left: (viewport.width - dim.width) / 2 + "px",
      width: dim.width - 10 + "px"
    });
    return element;
  },
  
  isVisible: function(element, parent) {
    var element = $(element);
    var parent = parent ? $(parent) : element.getOffsetParent();
    
    var offset_element = element.cumulativeOffset();
    var offset_parent = parent.cumulativeOffset();
    var scroll = element.cumulativeScrollOffset();
    
    var top_top = offset_parent.top;
    var top_bottom = top_top + parent.getHeight();
    var left_left = offset_parent.left;
    var left_right = left_left + parent.getWidth();
    
    var scroll_top_a = offset_element.top - scroll.top;
    var scroll_top_b = scroll_top_a + element.getHeight();
    var scroll_left_a = offset_element.left - scroll.left;
    var scroll_left_b = scroll_left_a + element.getWidth();
    
    return ((scroll_top_a >= top_top && scroll_top_a <= top_bottom) ||
            (scroll_top_b >= top_top && scroll_top_b <= top_bottom))
        && ((scroll_left_a >= left_left && scroll_left_a <= left_right) ||
            (scroll_left_b >= left_left && scroll_left_b <= left_right));
  },
  
  setVisible: function(element, condition) {
    return element[condition ? "show" : "hide"]();
  },
  
  setVisibility: function(element, condition) {
    return element.setStyle( {
      visibility: condition ? "visible" : "hidden"
    } );
  },
  
  setClassName: function(element, className, condition) {
    if (condition ) element.addClassName(className);
    if (!condition) element.removeClassName(className);
    return element;
  },
  
  getInnerWidth: function(element){
    var aBorderLeft = parseInt(element.getStyle("border-left-width")),
        aBorderRight = parseInt(element.getStyle("border-right-width"));
    return element.offsetWidth - aBorderLeft - aBorderRight;
  },
  
  getInnerHeight: function(element){
    var aBorderTop = parseInt(element.getStyle("border-top-width")),
        aBorderBottom = parseInt(element.getStyle("border-bottom-width"));
    return element.offsetHeight - aBorderTop - aBorderBottom;
  },
  
  /** Gets the elements properties (specs) thanks to its className */
  getProperties: function (element) {
    var props = {};

    $w(element.className).each(function (value) {
      var params = value.split("|");
      props[params.shift()] = (params.length == 0) ? true : (params.length > 1 ? params : params[0]);
    });
    return props;
  },
  
  /** Add a class name to an element, and removing this class name to all of it's siblings */
  addUniqueClassName: function(element, className) {
    $(element).siblings().invoke('removeClassName', className);
    return element.addClassName(className);
  },
  
  clone: function(element, deep) {
    return $($(element).cloneNode(deep)).writeAttribute("id", "");
  },
  
  /** Get the surrounding form of the element  */
  getSurroundingForm: function(element) {
    if (element.form) return $(element.form);
    return $(element).up('form');
  },
  
  enableInputs: function(element) {
    var inputs = element.select("input,select,textarea");
    inputs.invoke("enable");
    return element.show();
  },
  disableInputs: function(element, reset) {
    var inputs = element.select("input,select,textarea");
    inputs.invoke("disable");
    if (reset) {
      inputs.each(function(i) { $V(i, ""); });
    }
    return element.hide();
  },
  getText: function(element) {
    // using || may not work
    return ("innerText" in element ? element.innerText : element.textContent)+"";
  },
  prepareTouchEvents: function(root){
    if (!App.touchDevice) return;
    
    /*root.select("label").each(function(label){
      label.observe("touchstart", Event.stop);
    });*/
  
    /*
    root.select("*[onclick], .control_tabs a, .control_tabs_vertical a").each(function(element) {
      new NoClickDelay(element);
    });
    */
    
   
   root.select("label").each(function(label){
     if (label.hasAttribute("onclick")) {
       return;
     }
     
     label.setAttribute("onclick", "");
   });
    
    if (App.mouseEventsPrepared) {
      return;
    }
    
    var eventsHandled = $H({
      onmouseover: 300, 
      ondblclick:  500
    });
    
    document.observe("touchstart", function(event){
      var element = Event.element(event);
      
      eventsHandled.each(function(pair){
        var eventName = pair.key;
        
        if (element[eventName]) {
          var timeout = pair.value;
          Event.stop(event);
          element["triggered"+eventName] = false;
          
          element["timer"+eventName] = setTimeout(function(){
            element[eventName](event);
            element["triggered"+eventName] = true;
          }, timeout);
        }
      });
    });
    
    document.observe("touchmove", function(event){
      var element = Event.element(event);
      
      eventsHandled.each(function(pair){
        var eventName = pair.key;
        
        if (element["timer"+eventName]) {
          clearTimeout(element["timer"+eventName]);
        }
      });
    });
    
    document.observe("touchend", function(event){
      var element = Event.element(event);
      
      eventsHandled.each(function(pair){
        var eventName = pair.key;
        
        if (element[eventName]) {
          Event.stop(event);
          clearTimeout(element["timer"+eventName]);
          
          if (!element["triggered"+eventName]) {
            // event bubbling
            var bubble = (element.onclick || element.href) ? element : element.up("[onclick], :link");
            
            // simulate event firing
            if (bubble.href && (!bubble.onclick || bubble.onclick() !== false)) {
              location.href = bubble.href;
              return;
            }
          }
        }
      });
    });
    
    App.mouseEventsPrepared = true;
  }
});

/** Get the element's "data-" attributes value */
Element.addMethods({
  "get": function(element, data) {
    return element.getAttribute("data-"+data);
  },
  "set": function(element, key, data) {
    return element.writeAttribute("data-"+key, data);
  }
});

Element.addMethods(['input', 'textarea'], {
  emptyValue: function (element) {
    var notWhiteSpace = /\S/;
    return Object.isUndefined(element.value) ?
      element.empty() : 
      !notWhiteSpace.test(element.value);
  },
  switchMultiline: function (element, button) {
    var newElement;
    
    if (/^textarea$/i.test(element.tagName)) {
      newElement = new Element("input", {type: "text", value: $V(element)});
      if (button) $(button).removeClassName("singleline").addClassName("multiline");
    }
    else {
      newElement = new Element("textarea", {style: "width: auto;"}).update($V(element));
      
      if (element.maxLength) {
        newElement.observe("keypress", function(e){
          var txtarea = Event.element(e),
              value = $V(txtarea);
          if (value.length >= element.maxLength) {
            $V(txtarea, value.substr(0, element.maxLength-1));
          }
        });
      }
      
      if (button) $(button).removeClassName("multiline").addClassName("singleline");
    }
    
    var exclude = ["type", "value"];
    var map = {
      readonly: "readOnly", 
      maxlength: "maxLength", 
      size: "cols", 
      cols: "size"
    };
    
    $A(element.attributes).each(function(a){
      if (exclude.indexOf(a.name) != -1) return;
      newElement.setAttribute(map[a.name] || a.name, a.value);
    });
    
    element.insert({after: newElement});
    element.remove();
    return newElement;
  }
});

Element.addMethods(['input', 'textarea', 'select', 'button'], {
  tryFocus: function (element) {
    try {
      element.focus();
    } catch (e) {}
    return element;
  }
});

Element.addMethods('select', {
  sortByLabel: function(element){
    var selected = $V(element),
        sortedOptions = element.childElements().sortBy(function(o){
      return o.text;
    });
    element.update();
    sortedOptions.each(function(o){
      element.insert(o);
    });
    $V(element, selected, false);
  }
});

Element.addMethods('form', {
  clear: function(form, fire){
    $A(form.elements).each(function(e){
      if (e.type != "hidden" || /(autocomplete|date|time)/i.test(e.className)) {
        $V(e, '', fire);
      }
    });
  },

  /**
   * Tells if the app is in readonly mode
   *
   * @param {HTMLFormElement} form
   *
   * @return {Boolean}
   */
  isReadonly: function(form) {
    return App.readonly && User.id && form.method === "post" && (!form.elements.dosql || App.notReadonlyForms.indexOf(form.elements.dosql.value) == -1);
  }
});

Form.getInputsArray = function(element) {
  if (element instanceof NodeList || typeof oElement === "RadioNodeList" || element instanceof HTMLCollection) {
    return $A(element);
  }

  return [element];
};

Object.extend(Event, {
  key: function(e){
    return (window.event && (window.event.keyCode || window.event.which)) || e.which || e.keyCode || false;
  },
  isCapsLock: function(e){
    var charCode = Event.key(e);
    var shiftOn = false;
    
    if (e.shiftKey) {
      shiftOn = e.shiftKey;
    } else if (e.modifiers) {
      shiftOn = !!(e.modifiers & 4);
    }

    if ((charCode >= 97 && charCode <= 122 && shiftOn) || 
        (charCode >= 65 && charCode <= 90 && !shiftOn)) {
      return true;
    }
    
    // Keys from the top of a French keyboard
    /*var keys = {
      "0": "à",
      "1": "&",
      "2": "é",
      "3": "\"",
      "4": "'",
      "5": "(",
      "6": "-",
      "7": "è",
      "8": "_",
      "9": "ç",
      "°": ")",
      "+": "=",
      "¨": "^",
      "£": "$",
      "%": "ù",
      "µ": "*",
      "?": ",",
      ".": ";",
      "/": ":",
      "§": "!",
      ">": "<"
    };
    
    var c = String.fromCharCode(charCode);
    
    if ( shiftOn && Object.values(keys).indexOf(c) != -1 ||
        !shiftOn && keys[c]) return true;*/

    return false;
  },
  wheel: function (event){
    var delta = 0;
    
    if (!event) event = window.event;
    
    if (event.wheelDelta) {
      delta = event.wheelDelta/120; 
      if (window.opera) delta = -delta;
    } 
    else if (event.detail) { 
      delta = -event.detail/3; 
    }
    
    return Math.round(delta); //Safari Round
  }
});

Object.extend(String, {
  allographs: {
    withDiacritics   : "àáâãäåòóôõöøèéêëçìíîïùúûüÿñ",
    withoutDiacritics: "aaaaaaooooooeeeeciiiiuuuuyn"
  },
  glyphs: {
    "a": "àáâãäå",
    "c": "ç",
    "e": "èéêë",
    "i": "ìíîï",
    "o": "òóôõöø",
    "u": "ùúûü",
    "y": "ÿ",
    "n": "ñ"
  },
  dec2frac: function (dec, sep) {
    sep = sep || "/";
    
    var df = 1,
        top = 1,
        bot = 1;

    while (df != dec) {
      if (df < dec) {
        top++;
      }
      else {
        bot++;
        top = parseInt(dec * bot);
      }
      
      df = top / bot;
    }
    
    return top + sep + bot;
  }
});

Class.extend(String, {
  trim: function() {
    return this.replace(/^\s+|\s+$/g, "");
  },
  pad: function(ch, length, right) {
    length = length || 30;
    ch = ch || ' ';
    var t = this;
    while(t.length < length) t = (right ? t+ch : ch+t);
    return t;
  },
  unslash: function() {
    return this
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t");
  },
  stripAll: function() {
    return this.strip().gsub(/\s+/, " ");
  },
  removeDiacritics: function(){
    var str = this;
    var from, to;
    
    from = String.allographs.withDiacritics.split("");
    to   = String.allographs.withoutDiacritics.split("");
    
    from.each(function(c, i){
      str = str.gsub(c, to[i]);
    });
    
    from = String.allographs.withDiacritics.toUpperCase().split("");
    to   = String.allographs.withoutDiacritics.toUpperCase().split("");
    
    from.each(function(c, i){
      str = str.gsub(c, to[i]);
    });
    
    return str;
  },
  // @todo: should extend RegExp instead of String
  allowDiacriticsInRegexp: function() {
    var re = this.removeDiacritics();
    
    var translation = {};
    $H(String.glyphs).each(function(g){
      translation[g.key] = "["+g.key+g.value+"]";
    });
        
    $H(translation).each(function(t){
      re = re.replace(new RegExp(t.key, "gi"), t.value);
    });
    
    return re;
  },
  like: function(term) {
    var specials = "/.*+?|()[]{}\\".split("");
    
    term = term.replace(new RegExp('(\\' + specials.join('|\\') + ')', "g"), '\\$1');
    
    return !!this.match(new RegExp(term.trim().allowDiacriticsInRegexp(), "i"));
  },
  htmlDecode: function() {
    return DOM.div({}, this).getText();
  }
});

/**
 *
 * @param {String}         string
 * @param {String,Integer} defaultValue
 *
 * @return {*}
 */
Number.getInt = function(string, defaultValue) {
  var number = parseInt(string, 10);
  if (isNaN(number)) {
    return defaultValue;
  }

  return number;
}

RegExp.escape = function(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

Ajax.PeriodicalUpdater.addMethods({
  resume: function() {
    this.updateComplete();
  }
});

if (Prototype.Browser.IE) {
  Object.extend(Function.prototype, {
    delay: function(timeout){
      var __method = this, args = Array.prototype.slice.call(arguments, 1);
      timeout = timeout * 1000;
      
      return window.setTimeout(function(){
        try {
          return __method.apply(__method, args);
        } 
        catch (e) {
          var msg = (e.extMessage || e.message || e.description || e) + "\n -- " + __method;
          errorHandler(msg, e.fileName, e.lineNumber, e);
        }
      }, timeout);
    }
  });
}

/**
 * Improves image resampling of big images in Firefox
 * @param {Object} element
 */
Element.addMethods("img", {
  resample: function(element){
    if (!Prototype.Browser.Gecko || !element.getAttribute("width") && !element.getAttribute("height"))
      return element;
    
    element.onload = function() {
      if (element.naturalWidth < 500 && element.naturalHeight < 200) return;
      
      var canvas = document.createElement("canvas");
      canvas.height = canvas.width * (element.height / element.width);
      var ctx = canvas.getContext("2d");
      
      ctx.scale(0.5, 0.5);
      ctx.drawImage(element, 0, 0);
      element.src = canvas.toDataURL();
      element.onload = null;
    };
    
    if (element.complete) element.onload();
    
    return element;
  }
});

PeriodicalExecuter.addMethods({
  resume: function() {
    if (!this.timer) this.registerCallback();
  }
});

document.observeOnce = function(event_name, outer_callback){
  $(document.documentElement).observeOnce(event_name, outer_callback);
};

Function.getEvent = function(){
  var caller = arguments.callee.caller;
  
  while(caller = caller.caller) {
    if(caller.arguments[0] instanceof Event) {
      return caller.arguments[0];
    }
  }
};

Element.findDuplicates = function(attr, tag) {
  var ids = $$((tag || "*")+"["+attr+"]").sort(function(e){return e[attr]});
  var results = [],
      len = ids.length - 1;
      
  for (var i = 0; i < len; i++) {
    if (ids[i][attr] === "") continue;
    
    if (ids[i + 1][attr] == ids[i][attr]) {
      if (results.indexOf(ids[i]) == -1) {
        results.push(ids[i]);
      }
      results.push(ids[i + 1]);
    }
  }
  
  return results;
};

Element._duplicates = [];
Element._idConflicts = [];

Element.warnDuplicates = function(){
  if (Prototype.Browser.IE || Prototype.Browser.IPad || !(console.firebug || (Preferences.INFOSYSTEM == 1))) return; // if("0") => true
  
  var elements;
  
  /*elements = Element.findDuplicates("id");
  if (elements.length && !Element._duplicates.intersect(elements).length) {
    Element._duplicates = Element._duplicates.concat(elements);
    console.warn("Duplicates *[id]: ", elements);
  }*/
  
  elements = Element.findDuplicates("name", "form");
  if (elements.length && !Element._duplicates.intersect(elements).length) {
    Element._duplicates = Element._duplicates.concat(elements);
    console.warn("Duplicates form[name]: ", elements);
  }
  
  elements = $$("form form");
  if (elements.length && !Element._duplicates.intersect(elements).length) {
    Element._duplicates = Element._duplicates.concat(elements);
    console.error("Nested form: ", elements);
  }
  
  elements = $$("form:not([method]), form[method='']");
  if (elements.length && !Element._duplicates.intersect(elements).length) {
    Element._duplicates = Element._duplicates.concat(elements);
    console.error("Method-less forms: ", elements);
  }
  
  elements = $$("*[id]").pluck("id").intersect($H(window).keys().without("console", "main", "menubar", "performance")); // FIXME
  if (elements.length && !Element._idConflicts.intersect(elements).length) {
    Element._idConflicts = Element._idConflicts.concat(elements);
    console.error("ID conflicts (element ID and global variable have the same name): ", elements);
  }
};

Event.initKeyboardEvents = function() {
  document.observe("keydown", function(e){
    var key = Event.key(e);
    var element = Event.element(e);
    var tagName = element.tagName;
    
    // Prevent backspace to go back in history
    if(key == Event.KEY_BACKSPACE && !/input|textarea/i.test(tagName)) {
      Event.stop(e);
    }
    
    // Ctrl+Return in a textera to submit the form
    if(key == Event.KEY_RETURN && element.form && e.ctrlKey && tagName == "TEXTAREA") {
      element.form.onsubmit();
      Event.stop(e);
    }
  });
};

/**
 * format the number with european mask
 * @param decimal - number of decimal digits, default value 2
 */
Number.prototype.format = function(decimal) {
	if(typeof(decimal) == 'undefined') decimal = 2;
	return this.toFixed(decimal).replace('.',',').replace(/(\d)(?=(\d{3})+,)/g, "$1.");
};
