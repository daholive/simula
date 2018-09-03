/* $Id: checkForms.js 7654 2009-12-18 10:42:06Z phenxdesign $ */

/**
 * @package Mediboard
 * @subpackage includes
 * @version $Revision: 7654 $
 * @author SARL OpenXtrem
 * @license GNU General Public License, see http://www.gnu.org/licenses/gpl.html 
 */

Prototype.Browser.IPad = /iPad/i.test(navigator.userAgent);

// Javascript error logging
function errorHandler(errorMsg, url, lineNumber, exception) {
  var ignored = ["Script error."];
  
  try {
    if (App.config.log_js_errors && ignored.indexOf(errorMsg) == -1) {
      exception = exception || new Error(errorMsg, url, lineNumber);
      
      new Ajax.Request("index.php?m=system&a=js_error_handler&suppressHeaders=1&dialog=1", {
        method: 'post',
        parameters: 'm=system&a=js_error_handler&' +
        $H({
          errorMsg: errorMsg + _IEAdditionalInfo,
          url: url,
          lineNumber: lineNumber,
          stack: exception.stack || exception.stacktrace,// || printStackTrace(),
          location: location.href
        }).toQueryString()
      });
    }
  } catch (e) {}
  
  return Preferences.INFOSYSTEM == 0; // true to ignore errors
}

/*
 * @author Rob Reid
 * @version 20-Mar-09
 * Description: Little helper function to return details about IE 8 and its various compatibility settings either use as it is
 * or incorporate into a browser object. Remember browser sniffing is not the best way to detect user-settings as spoofing is
 * very common so use with caution.
 */
function IEVersion(){
  var na = navigator.userAgent;
  var version = "NA";
  var ieDocMode = "NA";
  var ie8BrowserMode = "NA";
  
  // Look for msie and make sure its not opera in disguise
  if(/msie/i.test(na) && (!window.opera)){
    // also check for spoofers by checking known IE objects
    if(window.attachEvent && window.ActiveXObject){
    
      // Get version displayed in UA although if its IE 8 running in 7 or compat mode it will appear as 7
      version = (na.match( /.+ie\s([\d.]+)/i ) || [])[1];
      
      // Its IE 8 pretending to be IE 7 or in compat mode   
      if(parseInt(version) == 7){
        
        // documentMode is only supported in IE 8 so we know if its here its really IE 8
        if(document.documentMode){
          version = 8; //reset? change if you need to
          
          // IE in Compat mode will mention Trident in the useragent
          if(/trident\/\d/i.test(na))
            ie8BrowserMode = "Compat Mode";
          
          // if it doesn't then its running in IE 7 mode
          else
            ie8BrowserMode = "IE 7 Mode";
        }
      }
      
      else if(parseInt(version)==8){
        // IE 8 will always have documentMode available
        if(document.documentMode) ie8BrowserMode = "IE 8 Mode";
      }
      
      // If we are in IE 8 (any mode) or previous versions of IE we check for the documentMode or compatMode for pre 8 versions     
      ieDocMode = document.documentMode ? document.documentMode : (document.compatMode && document.compatMode == "CSS1Compat") ? 7 : 5; //default to quirks mode IE5               
    }
  }
         
  return {
    UserAgent: na,
    Version: version,
    BrowserMode: ie8BrowserMode,
    DocMode: ieDocMode
  };
}

var _IEAdditionalInfo = "";

if (App.config.log_js_errors) {
  // TODO needs testing (doesn't throw console.error every time)
  if (Prototype.Browser.IE) {
    try {
      (function(){
        var ieVersion = IEVersion();
        _IEAdditionalInfo = " (Version:"+ieVersion.Version+" BrowserMode:"+ieVersion.BrowserMode+" DocMode:"+ieVersion.DocMode+")";
        
        // If DocMode is the same as the browser version (IE8 not in Compat mode) and IE8+
        if (ieVersion.Version >= 8 && (ieVersion.Version == ieVersion.DocMode) && (ieVersion.BrowserMode != "Compat Mode")) {
          window.onerror = errorHandler;
        }
      })();
    } catch(e) {}
  }
  else {
    window.onerror = errorHandler;
  }
}
else {
  window.onerror = function(){ 
    return Preferences.INFOSYSTEM == 0; // true to ignore errors
  }
}

/**
 * Main page initialization scripts
 */
var Main = {
  callbacks: [],
  loadedScripts: {},
  initialized: false,
  
  /**
   * Add a script to be launched after onload notification
   * On the fly execution if already page already loaded
   */
  add: function(callback) {
    if (this.initialized) {
      callback.defer();
    }
    else {
      this.callbacks.push(callback);
    }
  },
  
  require: function(script, options) {
    if (this.loadedScripts[script]) {
      return;
    }
    
    options = Object.extend({
      evalJS: true,
      onSuccess: (function(script){
        return function() {
          Main.loadedScripts[script] = true;
        }
      })(script)
    }, options);
    
    return new Ajax.Request(script, options);
  },
  
  /**
   * Call all Main functions
   */
  init: function() {
    this.callbacks.each(function(callback) { 
      try {
        callback();
      }
      catch (e) {
        var msg = "Main.add exception";
        errorHandler(msg, location.href, -1, e);
        console.error(msg, e);
      }
    });
    
    this.initialized = true;
  }
};

/** l10n functions */
var Localize = {
  strings: [],

  that: function() {
    var args = $A(arguments),
        string = args[0];
        
    args[0] = (window.locales ? (window.locales[string] || string) : string);
    
    if (window.locales && !window.locales[string]) {
      Localize.addString(string);
    }
    
    return printf.apply(null, args);
  },
  
  first: function() {
    var strings = $A(arguments);
    var string = strings.find(function(string) {
      return Localize.that(string) != string;
    });
  
    return Localize.that(string || strings.first());
  },
  
  populate: function(strings) {
    if (strings.length) {
      strings.each(Localize.addString.bind(Localize));
    }
  },
  
  addString: function(string) {
    if (this.strings.include(string)) {
      return;
    }

    this.strings.push(string);

    // Try and show unloc warning
    var div = $('UnlocDiv');
    if (div) {
      div.down('strong').update(this.strings.length);
      div.show();
    }
    
    // Add a row in form
    var name = 's['+string+']';
    var form = getForm('UnlocForm');
    
    if (form) {
      var tbody = form.down('tbody');
      tbody.insert(
        DOM.tr({}, 
          DOM.th({}, string),
          DOM.td({}, 
            DOM.input({ size: '70', type: 'text', name: name, value: '' })
          )
        )
      );
    }
  },
  
  showForm: function() {
    var form = getForm('UnlocForm');
    modal(form, { 
      closeOnClick: form.down('button.close')
    } );
  },
  
  onSubmit: function(form) {
    return onSubmitFormAjax(form, location.reload.bind(location));
  }
};

var $T = Localize.that;

function closeWindowByEscape(e) {
  if(Event.key(e) == Event.KEY_ESC){
    e.stop();
    window.close();
  }
}