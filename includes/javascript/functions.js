
/* $Id: functions.js 17296 2012-11-13 17:25:24Z phenxdesign $ */

/**
 * @package Mediboard
 * @subpackage includes
 * @version $Revision: 17296 $
 * @author SARL OpenXtrem
 * @license GNU General Public License, see http://www.gnu.org/licenses/gpl.html 
 */

function main() {
  try {
    // Fix for IE9 in IE8 mode
    try {
      if (Prototype.Browser.IE && document.documentMode == 8) {
        $$("html")[0].removeClassName("ua-msie-9").addClassName("ua-msie-8");
      }
    } catch (e) {}

    if (window.sessionLocked) {
      Session.lock();
    }

    prepareForms();
    SystemMessage.init();
    WaitingMessage.init();
    Note.refresh();
    Element.warnDuplicates();
    Event.initKeyboardEvents();
    $(document.documentElement).prepareTouchEvents();
    Main.init();
    new CookieJar().put("cookie-supported", 1);
  }
  catch (e) {
    errorHandler(e.extMessage || e.message || e.description || e, e.fileName, e.lineNumber, e);
  }
}

document.observe('dom:loaded', main);

var UAInfo = {
  string: "",
  buildString: function(){
    if (UAInfo.string) return UAInfo.string;
    
    UAInfo.append("Navigateur", BrowserDetect.browser+" "+BrowserDetect.version);
    
    if (Prototype.Browser.IE) {
      var ieVersion = IEVersion();
      UAInfo.append("Version", ieVersion.Version, 1);
      UAInfo.append("DocMode", ieVersion.DocMode, 1);
      UAInfo.append("Mode   ", ieVersion.BrowserMode, 1);
      UAInfo.string += "\n";
    }
    
    UAInfo.append("Cookies", ("cookieEnabled" in navigator ? (navigator.cookieEnabled ? "Oui" : "Non") : "Information non disponible"));
    UAInfo.append("Système", BrowserDetect.OS+ " ("+navigator.platform+")");
    
    if (User.login) {
      UAInfo.append("Utilisateur", User.view+" ("+User.login+")");
      UAInfo.append("Fonction", User["function"].view);
      UAInfo.append("Etablissement", User.group.view);
    }
    else {
      UAInfo.append("Utilisateur", "Non connecté");
    }
    
    if (Prototype.Browser.IE) {
      UAInfo.append("Plugins", "Information non disponible");
    }
    else {
      UAInfo.string += "\n";
      UAInfo.append("Plugins", "");
      $A(navigator.plugins).each(function(plugin){
        if (plugin.name.match(/pdf|acrobat|java/i)) {
          UAInfo.append(plugin.name, plugin.version || plugin.description, 1);
        }
      });
    }
    
    //errorHandler(2, UAInfo.string.replace(new RegExp(String.fromCharCode(8226), "g"), "<br />"));
    
    return UAInfo.string;
  },
  append: function(label, value, indent) {
    var string = ((indent > 0) ? (new Array(indent*8).join(" ")) : "");
    UAInfo.string += string + String.fromCharCode(8226)+" "+label+" : \t"+value+"\n";
  },
  show: function(){
    alert(UAInfo.buildString());
  }
};

document.observe("keydown", function(e){
  var key = Event.key(e);
  
  if (e.altKey && key == 89) {
    Event.stop(e);
    UAInfo.show();
  }
});

window.onunload = function () {
  if (Url.activeRequests.post > 0)
    alert($T("WaitingForAjaxRequestReturn"));
};

var WaitingMessage = {
  init: function() {
    window.onbeforeunload = function () {
      if(FormObserver.checkChanges()) {
        WaitingMessage.show();
      } else {
        if (FormObserver.onChanged) {
          FormObserver.onChanged();
        }
        return $T("FormObserver-msg-confirm");
      }
    };
  },
  
  show: function() {
    var doc  = document.documentElement,
        mask = $('waitingMsgMask'),
        text = $('waitingMsgText');
        
    if (!mask && !text) return;
  
    // Display waiting text
    var vpd = document.viewport.getDimensions(),
        etd = text.getDimensions();
        
    text.setStyle({
      top: (vpd.height - etd.height)/2 + "px",
      left: (vpd.width - etd.width)/2 + "px",
      opacity: 0.8
    }).show();
    
    // Display waiting mask
    mask.setStyle({
      top: 0,
      left: 0,
      height: doc.clientHeight + "px",
      width: doc.clientWidth + "px",
      opacity: 0.3,
      position: "fixed"
    }).show();
  },
  
  hide: function() {
    var mask = $('waitingMsgMask'),
        text = $('waitingMsgText');
    
    if (!mask && !text) return;
    
    text.hide();
    mask.hide();
  },
  
  cover: function(element) {
    // don't cover hidden elements in IE
    if (Prototype.Browser.IE && document.documentMode < 9 && (element.style && element.style.display === "none")) {
      return;
    }
  
    element = $(element);
    
    var coverContainer = new Element("div", {style: "border:none;background:none;padding:0;margin:0;position:relative;"}).addClassName("cover-container").hide(),
        cover = new Element("div").addClassName("ajax-loading");

    coverContainer.insert(cover);
    
    /** If the element is a TR, we add the div to the firstChild to avoid a bad page render (a div in a <table> or a <tr>)*/
    var receiver = element;
    
    if (/^tbody$/i.test(receiver.tagName)) {
      receiver = receiver.down();
    }
    
    if (/^tr$/i.test(receiver.tagName)) {
      receiver = receiver.down();
    }

    receiver.insert({top: coverContainer});
    
    cover.setStyle({
      opacity: 0.3,
      position: 'absolute',
      left: -parseInt(receiver.getStyle("padding-left"))+"px"
    }).show().clonePosition(element, {setLeft: false, setTop: false});
    
    var isTopAligned = receiver.getStyle("vertical-align") === "top";
    if (isTopAligned) {
      cover.style.top = -parseInt(receiver.getStyle("padding-top"))+"px";
    }
    
    var isLeftAligned = /left|start/i.test(receiver.getStyle("text-align") || "left");
    if (isLeftAligned) {
      cover.style.left = -parseInt(receiver.getStyle("padding-left"))+"px";
    }

    coverContainer.show();

    if (!isTopAligned || !isLeftAligned) {
      var offsetCover = coverContainer.cumulativeOffset();
      var offsetContainer = receiver.cumulativeOffset();
      
      if (!isTopAligned) {
        coverContainer.style.top = (offsetContainer.top - offsetCover.top)+"px";
      }
  
      if (!isLeftAligned) {
        coverContainer.style.left = (offsetContainer.left - offsetCover.left)+"px";
      }
    }
  }
};

var Profiler = {
  trace: function(getParams, performance, targetElement) {
    try {
      // If Firebug or Chrome console
      if (console.firebug || console._inspectorCommandLineAPI) {
        console.log(getParams, " ", performance);
      }
      this.profile(getParams, performance, null, targetElement);
    } catch (e) {}
  },
  profile: function (getParams, performance, win, targetElement) {
    var parent = window.opener || window.parent;
    if (parent && parent !== window && parent.Profiler) {
      parent.Profiler.profile(getParams, performance, win || window, targetElement);
    }
  }
};

/**
 * Detects the Skype scripts and stylesheets to check whether the extension is active or not
 * This extension slows down Firefox
 */
function detectSkypeExtension(){
  return $$("#injection_graph_func, #_skypeplugin_dropdownmenu_css, #_injection_graph_nh_css, #_nameHighlight_injection").length > 0;
}

var AjaxResponse = {
  onDisconnected: function() {
    if (window.children['login'] && window.children['login'].closed) window.children['login'] = null;

    if (!window.children['login']) {
      var url = new Url;
      url.addParam("dialog", 1);
      url.addParam("login_info", 1);
      url.pop(650, 400, "login");
    }
  },
  
  onLoaded: function(getData, performance) {
    try {
      if (Prototype.Browser.IE) return;
      
      // If Firebug or Chrome console
      if (!("_mediboard" in window.console)) {
        console.log(getData, " ", performance, getData.m + " - " + getData.a);
      }
    } catch (e) {}
  }
};


/**
 * System message effects
 */
var SystemMessage = {
  id: "systemMsg",
  effect: null,

  // Check message type (loading, notice, warning, error) from given div
  autohidable: function() {
    return $(this.id).select(".error, .warning, .loading").length == 0;
  },
  
  notify: function(text, append) {
    $(this.id)[append ? "insert" : "update"](text);
    this.doEffect();
  },

  // show/hide the div
  doEffect : function (delay, forceFade) {
    // Cancel current effect
    if (this.effect) {
      this.effect.cancel();
      this.effect = null;
    }
    
    var element = $(this.id);
    delay = delay || 5;
    
    if (element.empty()) {
      element.hide();
      return;
    }
    
    // Ensure visible        
    element.show().setOpacity(1);
    
    // Only hide on type 'message'
    if (!forceFade && (!this.autohidable() || Preferences.INFOSYSTEM == 1)) {
      return;
    }
    
    // Program fading
    if (window.Effect) {
      this.effect = new Effect.Fade(this.id, { delay: delay } );
    }
    else {
      element.hide.delay(delay);
    }
  },
  
  init : function () {
    var element = $(this.id);
    Assert.that(element, "No system message div");
    
    // Hide on onclick
    element.observe('click', function(event) {
      SystemMessage.doEffect(0.1, true);
    });
        
    // Hide empty message immediately
    if (element.empty()) {
      element.hide();
      return;
    }
    
    SystemMessage.doEffect();
  }
};

/**
 * PairEffect Class
 */
var PairEffect = Class.create({
  initialize: function(idTarget, oOptions) {
    this.oOptions = Object.extend({
      idTarget       : idTarget,
      idTrigger      : idTarget + "-trigger",
      sEffect        : null, // could be null, "appear", "slide", "blind"
      bStartVisible  : false, // Make it visible at start
      bStoreInCookie : true,
      sCookieName    : "effects",
      duration       : 0.3
    }, oOptions);
    
    var oTarget   = $(this.oOptions.idTarget);
    var oTrigger  = $(this.oOptions.idTrigger);

    Assert.that(oTarget, "Target element '%s' is undefined", idTarget);
    Assert.that(oTrigger, "Trigger element '%s' is undefined ", this.oOptions.idTrigger);
  
    // Initialize the effect
    oTrigger.observe("click", this.flip.bind(this));
  
    // Initialize classnames and adapt visibility
    var aCNs = Element.classNames(oTrigger);
    aCNs.add(this.oOptions.bStartVisible ? "triggerHide" : "triggerShow");
    if (this.oOptions.bStoreInCookie) {
      aCNs.load(this.oOptions.sCookieName);
    }
    oTarget.setVisible(!aCNs.include("triggerShow"));   
  },
  
  // Flipper callback
  flip: function() {
    var oTarget = $(this.oOptions.idTarget);
    var oTrigger = $(this.oOptions.idTrigger);
    if (this.oOptions.sEffect && !Prototype.Browser.IE) {
      new Effect.toggle(oTarget, this.oOptions.sEffect, this.oOptions);
    } else {
      oTarget.toggle();
    }
  
    var aCNs = Element.classNames(oTrigger);
    aCNs.flip("triggerShow", "triggerHide");
    
    if (this.oOptions.bStoreInCookie) {
      aCNs.save(this.oOptions.sCookieName);
    }
  }
} );

/**
 * PairEffect utiliy function
 */

Object.extend(PairEffect, {
  declaredEffects : {},

  // Initialize a whole group giving the className for all targets
  initGroup: function(sTargetsClass, oOptions) {
    oOptions = Object.extend({
      idStartVisible   : null, // Forces one element to start visible
      bStartAllVisible : false,
      sCookieName      : sTargetsClass
    }, oOptions);
    
    $$('.'+sTargetsClass).each(function(oElement) {
      oOptions.bStartVisible = oOptions.bStartAllVisible || (oElement.id == oOptions.idStartVisible);
      new PairEffect(oElement.id, oOptions);
    });
  }
});


/**
 * TogglePairEffect Class
 */
var TogglePairEffect = Class.create({
  initialize: function(idTarget1, idTarget2, oOptions) {
    this.oOptions = Object.extend({
      idFirstVisible : 1,
      idTarget1      : idTarget1,
      idTarget2      : idTarget2,
      idTrigger1     : idTarget1 + "-trigger",
      idTrigger2     : idTarget2 + "-trigger"
    }, oOptions);
    
    var oTarget1  = $(this.oOptions.idTarget1);
    var oTarget2  = $(this.oOptions.idTarget2);
    var oTrigger1 = $(this.oOptions.idTrigger1);
    var oTrigger2 = $(this.oOptions.idTrigger2);

    Assert.that(oTarget1, "Target1 element '%s' is undefined", idTarget1);
    Assert.that(oTarget2, "Target2 element '%s' is undefined", idTarget2);
    Assert.that(oTrigger1, "Trigger1 element '%s' is undefined ", this.oOptions.idTrigger1);
    Assert.that(oTrigger2, "Trigger2 element '%s' is undefined ", this.oOptions.idTrigger2);
  
    // Initialize the effect
    var fShow = this.show.bind(this);
    oTrigger1.observe("click", function() { fShow(2); } );
    oTrigger2.observe("click", function() { fShow(1); } );
    
    this.show(this.oOptions.idFirstVisible);
  },
  
  show: function(iWhich) {
    $(this.oOptions.idTarget1).setVisible(1 == iWhich);
    $(this.oOptions.idTarget2).setVisible(2 == iWhich);
    $(this.oOptions.idTrigger1).setVisible(1 == iWhich);
    $(this.oOptions.idTrigger2).setVisible(2 == iWhich);
  }
});

/**
 * PairEffect utiliy function
 */

Object.extend(TogglePairEffect, {
  declaredEffects : {},

  // Initialize a whole group giving the className for all targets
  initGroup: function(sTargetsClass, oOptions) {
    oOptions = Object.extend({
      idStartVisible   : null, // Forces one element to start visible
      bStartAllVisible : false,
      sCookieName      : sTargetsClass
    }, oOptions);
    
    $$('.'+sTargetsClass).each(function(oElement) {
      oOptions.bStartVisible = oOptions.bStartAllVisible || (oElement.id == oOptions.idStartVisible);
      new PairEffect(oElement.id, oOptions);
    });
  }
});

/**
 * View port manipulation object
 *   Handle view ported objects
 */

var ViewPort = {
  SetAvlHeight: function (element, pct) {
    element = $(element);
    if (!element) return;
  
    // Position Top de la div, hauteur de la fenetre,
    // puis calcul de la taille de la div
    var pos       = element.cumulativeOffset()[1];
    var winHeight = window.getInnerDimensions().height;
    element.style.overflowY = "auto";
    element.style.overflowX = "hidden";
    element.style.height = ((winHeight - pos) * pct - 10) + "px";
  },
  
  SetFrameHeight: function(element, options){
    options = Object.extend({
      marginBottom : 15
    }, options);
    
    // Calcul de la position top de la frame
    var fYFramePos = Position.cumulativeOffset(element)[1];  
    
    // hauteur de la fenetre
    var fNavHeight = window.getInnerDimensions().height;
    
    // Calcul de la hauteur de la div
    var fFrameHeight = fNavHeight - fYFramePos;
    
    element.setAttribute("height", fFrameHeight - options.marginBottom);
  }
};

/** Token field used to manage multiple enumerations easily.
 *  @param element The element used to get piped values : token1|token2|token3
 *  @param options Accepts the following keys : onChange, confirm, props, separator
 */
var TokenField = Class.create({
  initialize: function(element, options) {
    this.element = $(element);
    
    this.options = Object.extend({
      onChange : Prototype.emptyFunction,
      confirm  : null,
      props    : null,
      separator: "|"
    }, options);
  },
  onComplete: function(value) {
    if(this.options.onChange != null)
      this.options.onChange(value);
    return true;
  },
  add: function(value, multiple) {
    if (!value) return false;

    if(this.options.props) {
      ElementChecker.prepare(new Element('input', {value: value, className: this.options.props}));
      ElementChecker.checkElement();
      if(ElementChecker.oErrors.length) {
        alert(ElementChecker.getErrorMessage());
        return false;
      }
    }
    
    var aToken = this.getValues();
    aToken.push(value);
    if(!multiple) aToken = aToken.uniq();
    
    this.setValues(aToken);
    return true;
  },
  remove: function(value) {
    if(!value || (this.options.confirm && !confirm(this.options.confirm))) {
      return false;
    }

    this.setValues(this.getValues().without(value));
    return true;
  },
  contains: function(value) {
   return (this.getValues().indexOf(value) != -1);
  },
  toggle: function(value, force, multiple) {
    if (!Object.isUndefined(force)) {
      return this[force?"add":"remove"](value, multiple);
    }
    return this[this.contains(value)?"remove":"add"](value);
  },
  getValues: function(asString) {
    if (asString) {
      return this.element.value;
    }
    return this.element.value.split(this.options.separator).without("");
  },
  setValues: function(values) {
    if (Object.isArray(values)) {
      values = values.join(this.options.separator);
    }
    this.onComplete(this.element.value = values);
    return values;
  }
});

function guid_log(guid) {
  var parts = guid.split("-");
  var url = new Url("system", "view_history");
  url.addParam("object_class", parts[0]);
  url.addParam("object_id", parts[1]);
  url.addParam("user_id", "");
  url.addParam("type", "");
  url.popup(600, 500, "history");
}

function guid_ids(guid) {
  var parts = guid.split("-");
  var url = new Url("dPsante400", "view_identifiants");
  url.addParam("object_class", parts[0]);
  url.addParam("object_id", parts[1]);
  url.popup(750, 400, "sante400");
}

function uploadFile(object_guid, file_category_id, _rename, named, module,patient_id){
  var url = new Url("files", "upload_file");
  url.addParam("object_guid", object_guid);
  url.addParam("file_category_id", file_category_id);
  url.addParam("_rename", _rename);
  url.addParam("named", named);
  url.addParam("module", module);
  url.addParam('patient_id',patient_id);
  url.requestModal(700, 300);
}

function scanFile(oParams) {
  new Url('files','scan_file')
  .addObjectParam(null,oParams)
  .requestModal(860,565);
}

function popChgPwd() {
  new Url("admin", "chpwd").requestModal(400);
}

var Note = {
  init: function() {
    this.url = new Url("system", "edit_note");
  },
  
  create: function (object_guid) {
  this.init();
    this.url.addParam("object_guid", object_guid);
    this.modal();
  },

  edit: function(note_id) {
  this.init();
    this.url.addParam("note_id", note_id);
    this.modal();
  },

  modal: function () {
    this.url.requestModal(500);
  },
  
  submit: function (form) {
    return onSubmitFormAjax(form, { onComplete: function() { 
      Note.refresh(true); 
      Note.close();
    }});
  },
  
  close: function() {
    this.url.modalObject.close();
  },
  
  refresh: function(force, object_guid) {
    var selector = "div.noteDiv";
    
    if (force) {
      object_guid = object_guid || Note.url.oParams['object_guid'];
    }
    
    // Specific guid if forced, non initialized otherwise
    selector += force ? ("."+object_guid) : ":not(.initialized)";
    
    $$(selector).each(function(element) {
      element.addClassName("initialized");
      var url = new Url("system", "httpreq_get_notes_image");
      url.addParam("object_guid", element.className.split(" ")[1]);
      url.requestUpdate(element, {
        coverIE: false
      });
    });
  }
};

// *******
var notWhitespace   = /\S/;
var Dom = {
  writeElem : function(elem, elemReplace){
    elem = $(elem);
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
    if(elemReplace){
      elem.appendChild(elemReplace);
    }
  },
  
  cloneElemById : function(id, withChildNodes){
    return $(id).clone(withChildNodes);
  },
  
  createTd : function(sClassname, sColspan){
    return new Element('td', {
      className: sClassname,
      colspan: sColspan
    });
  },
  
  createTh : function(sClassname, sColspan){
    return new Element('th', {
      className: sClassname,
      colspan: sColspan
    });
  },
  
  createImg : function(sSrc){
    return new Element('img', {
      src: sSrc
    });
  },
  
  createInput : function(sType, sName, sValue){
    return new Element('input', {
      type: sType,
      name: sName,
      value: sValue
    });
  },
  
  createSelect : function(sName){
    return new Element('select', {
      name: sName
    });
  },
  
  createOptSelect : function(sValue, sName, selected, oInsertInto){
    var oOpt = document.createElement("option");
    oOpt.setAttribute("value" , sValue);
    if(selected && selected == true){
      oOpt.setAttribute("selected" , "selected");
    }
    oOpt.innerHTML = sName;
    if(!oInsertInto){
      return oOpt;
    }
    oInsertInto.appendChild(oOpt);
  },
  
  cleanWhitespace : function(node){
    if(node.hasChildNodes()){
      for(var i=0; i< node.childNodes.length; i++){
        var childNode = node.childNodes[i];
        if((childNode.nodeType == Node.TEXT_NODE) && (!notWhitespace.test(childNode.nodeValue))){
          node.removeChild(node.childNodes[i]);
          i--;
        }else if (Object.isElement(childNode)) {
          Dom.cleanWhitespace(childNode);
        } 
      }
    }
  }
};

/** Levenstein function **/
function levenshtein( str1, str2 ) {
  // http://kevin.vanzonneveld.net
  // +   original by: Carlos R. L. Rodrigues
  // *     example 1: levenshtein('Kevin van Zonneveld', 'Kevin van Sommeveld');
  // *     returns 1: 3

  var s, l = (s = str1.split("")).length, t = (str2 = str2.split("")).length, i, j, m, n;
  if(!(l || t)) return Math.max(l, t);
  for(var a = [], i = l + 1; i; a[--i] = [i]);
  for(i = t + 1; a[0][--i] = i;);
  for(i = -1, m = s.length; ++i < m;){
    for(j = -1, n = str2.length; ++j < n;){
      a[(i *= 1) + 1][(j *= 1) + 1] = Math.min(a[i][j + 1] + 1, a[i + 1][j] + 1, a[i][j] + (s[i] != str2[j]));
    }
  }
  return a[l][t];
}

function luhn (code) {
  var code_length = code.length;
  var sum = 0;
  var parity = code_length % 2;
  
  for (var i = code_length - 1; i >= 0; i--) {
    var digit = code.charAt(i);
    
    if (i % 2 == parity) {
      digit *= 2;
      
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += parseInt(digit);
  }
  
  return ((sum % 10) == 0);
}

/* Control tabs creation. It saves selected tab into a cookie name TabState */
Object.extend (Control.Tabs, {
  storeTab: function (tabName, tab) {
    new CookieJar().setValue("TabState", tabName, tab);
  },
  loadTab: function (tabName) {
    return new CookieJar().getValue("TabState", tabName);
  },
  create: function (name, storeInCookie, options) {
    if ($(name)) {
      var tab = new Control.Tabs(name, options);
      
      if (storeInCookie) {
        var oldAfterChange = tab.options.afterChange;
        
        tab.options.afterChange = function (tab, tabName) {
          if (oldAfterChange && Object.isFunction(oldAfterChange)) {
            oldAfterChange(tab, tabName);
          }
          
          Control.Tabs.storeTab(name, tab.id);
        };

        var tabName = Control.Tabs.loadTab(name);
        if (tabName) {
          tab.setActiveTab(tabName);
        }
      }
      return tab;
    }
  },
  
  activateTab: function(tabName) {
    Control.Tabs.findByTabId(tabName).setActiveTab(tabName);
  },
  
  getTabAnchor: function(tabName) {
    // Find anchor
    var anchors = $$('a[href=#'+tabName+']');
    if (anchors.length != 1) {
      Console.error('Anchor not found or found multiple for tab: '+tabName);
      return;
    }

    return anchors[0];
  },
    
  setTabCount: function(tabName, count) {
    count += ""; // String cast
    var anchor = this.getTabAnchor(tabName);
    
    //anchor.writeAttribute("data-count", count);
    
    // Find count span
    var small = anchor.down('small') || anchor.insert({
      bottom: " <small></small>" // keep the space
    }).down('small');
    
    if (!small) {
      Console.error('Small count span not found for tab: '+tabName);
      return;
    }
    
    // Manage relative count
    if (count.charAt(0) == "+" || count.charAt(0) == "-") {
      count = parseInt(small.innerHTML.replace(/(\(|\))*/,"")) + parseInt(count);
    }
    
    // Set empty class
    anchor.setClassName('empty', count < 1);
    
     // Set count label
    small.update('('+count+')');
  }
});

Class.extend (Control.Tabs, {
  changeTabAndFocus: function(iIntexTab, oField) {
    this.setActiveTab(iIntexTab);
    if (oField) {
      oField.focus();
    } else {
      var oForm = $$('form')[0];
      if (oForm) {
        oForm.focusFirstElement();
      }
    }
  },
  print: function(){
    this.toPrint().print();
  },
  toPrint: function(){
    var container = DOM.div({});
    
    this.links.each(function(link){
      // header
      var h = DOM.h2({});
      h.update(link.innerHTML);
      h.select('button').invoke('remove');
      container.insert(h);
      
      // content
      var content = $(link.getAttribute("href").substr(1)).clone(true);
      content.show();
      container.insert(content);
    }, this);
    
    return container;
  }
});

window.getInnerDimensions = function() {
  return {width: document.documentElement.clientWidth, height: document.documentElement.clientHeight};
};

/** DOM element creator for Prototype by Fabien Ménager
 *  Inspired from Michael Geary 
 *  http://mg.to/2006/02/27/easy-dom-creation-for-jquery-and-prototype
 **/
var DOM = {
  defineTag: function (tag) {
    DOM[tag] = function () {
      return DOM.createNode(tag, arguments);
    };
  },
  
  createNode: function (tag, args) {
    var e, i, j, arg, length = args.length;
    try {
      e = new Element(tag, args[0]);
      for (i = 1; i < length; i++) {
        arg = args[i];
        if (arg == null) continue;
        if (!Object.isArray(arg)) e.insert(arg);
        else {
          for (j = 0; j < arg.length; j++) e.insert(arg[j]);
        }
      }
    }
    catch (ex) {
      console.error('Cannot create <' + tag + '> element:\n' + Object.inspect(args) + '\n' + ex.message);
      e = null;
    }
    return e;
  },
  
  tags: [
    'a', 'applet', 'big', 'br', 'button', 'canvas', 'div', 'fieldset', 'form',
    'h1', 'h2', 'h3', 'h4', 'h5', 'hr', 'iframe', 'img', 'input', 'label', 
    'legend', 'li', 'ol', 'optgroup', 'option', 'p', 'param', 'pre', 'script',
    'select', 'small', 'span', 'strong', 'table', 'tbody', 'td', 'textarea',
    'tfoot', 'th', 'thead', 'tr', 'tt', 'ul'
  ]
};

DOM.tags.each(DOM.defineTag);

// To let the tooltips on top
Control.Window.baseZIndex = 800;
Control.Overlay.styles.zIndex = 799;
Control.Overlay.ieStyles.zIndex = 799;

if (document.documentMode >= 8) {
  Control.Overlay.ieStyles.position = "fixed";
}

// Replacements for the javascript alert() and confirm()
var Modal = {
  alert: function(message, options) {
    options = Object.extend({
      className: 'modal alert big-warning',
      okLabel: 'OK',
      onValidate: Prototype.emptyFunction,
      closeOnClick: null,
      iframeshim: false
    }, options);
    
    // Display element
    if (Object.isElement(message)) {
      message.show();
    }

    var html = DOM.div(null, 
      DOM.div( { style: "min-height: 3em;"}, message),
      DOM.div( { style: "text-align: center; margin-left: -3em;" },
        DOM.button( {className : "tick", type: "button"}, options.okLabel)
      )
    );

    var m = Control.Modal.open(html.innerHTML, options);
    m.container.down('button.tick').observe('click', (function(){this.close(); options.onValidate();}).bind(m));
  },
  
  confirm: function(message, options) {
    options = Object.extend( {
      className: 'modal confirm big-info',
      yesLabel: tr('bool.1'),
      noLabel: tr('bool.0'),
      onOK: Prototype.emptyFunction,
      onKO: Prototype.emptyFunction,
      onValidate: Prototype.emptyFunction,
      closeOnClick: null,
      iframeshim: false
    }, options);
    
    // Display element  
    if (Object.isElement(message)) {
      message.show();
    }

    var html = DOM.div(null, 
      DOM.div( { style: "min-height: 3em;"}, message),
      DOM.div( { style: "text-align: center; margin-left: -3em;" },
       DOM.button( {className : "tick"  , type: "button"}, options.yesLabel), 
       DOM.button( {className : "cancel", type: "button"}, options.noLabel )
      )
    );
    
    var m = Control.Modal.open(html.innerHTML, options);
    
    var okButton = m.container.down('button.tick');
    var koButton = m.container.down('button.cancel');
    
    var closeModal = function(){
      document.stopObserving('keyup', escapeClose);
      m.close();
    };
    
    var okCallback = function(){ 
      closeModal(); 
      options.onValidate(true); 
      options.onOK();
    };
    okButton.observe('click', okCallback);
    
    var koCallback = function(){ 
      closeModal(); 
      options.onValidate(false); 
      options.onKO(); 
    };
    koButton.observe('click', koCallback);
    
    var escapeClose = function(e){
      if (Event.key(e) == Event.KEY_ESC) {
        e.stop();
        koCallback();
      }
    };
    
    okButton.tryFocus();
    document.observe('keyup', escapeClose);
  }, 
  
  open: function(container, options) {
    options = Object.extend({
      className: 'modal',
      closeOnClick: null,
      overlayOpacity: 0.5,
      iframeshim: false
    }, options);
    
    return Control.Modal.open(container, options);
  }
};
/*
window.open = function(element, title, options) {
  options = Object.extend({
    className: 'modal popup',
    width: 800,
    height: 500,
    iframe: true,
    iframeshim: false
  }, options);
  
  Control.Modal.open(element, options);
  return false;
}*/

window._close = function() {
  window.close();
};

// We replace the window.close method for iframes (modal windows)
if (window.parent && window.parent != window && window.parent.Mediboard) {
  window.launcher = window.parent;
  
  window.oldClose = window.close;
  window.close = window._close = function(){
    try {
      var modal = window.launcher.Control.Modal.stack.last();
      modal.close();
      modal.destroy();
    } catch (e) {
      window.oldClose();
    }
  }
}
else {
  window.launcher = window.opener;
}

window.modal = Modal.open;

window.scrollToTop = function(){
  window.scrollTopSave = document.documentElement.scrollTop || document.body.scrollTop;
  
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

window.scrollReset = function(){
  if (!window.scrollTopSave) {
    return;
  }
  
  document.documentElement.scrollTop = window.scrollTopSave;
  document.body.scrollTop = window.scrollTopSave;
};

// Multiple mocals
Object.extend(Control.Modal,{
  stack: [],
  close: function() {
    if (!Control.Modal.stack.length) return;
    Control.Modal.stack.last().close();
  },
  
  position: function() {
    if (!Control.Modal.stack.length) return;
    Control.Modal.stack.last().position();
  },
  
  Observers: {
    beforeOpen: function(){
      /// FUCK APPLETS AND FIREFOX
      if (!Prototype.Browser.Gecko || !$$("applet").length) {
        document.body.style.overflow = "hidden"; // Removes the body's scrollbar
      }
      
      if(!this.overlayFinishedOpening && Control.Modal.stack.length == 0){
        Control.Overlay.observeOnce('afterShow',function(){
          this.overlayFinishedOpening = true;
          this.open();
        }.bind(this));
        Control.Overlay.show(this.options.overlayOpacity,this.options.fade ? this.options.fadeDuration : false);
        throw $break;
      }/*else
      Control.Window.windows.without(this).invoke('close');*/
    },
    
    afterOpen: function(){
      if (Control.Modal.stack.length == 0) {
        // Forcer le scroll to top a cause des datepicker qui se positionnent mal
        // (prescription, planning de la semaine du bloc, etc)
        window.scrollToTop();
      }
      
      //Control.Modal.current = this;
      var overlay = Control.Overlay.container;
      Control.Modal.stack.push(this);
      overlay.style.zIndex = this.container.style.zIndex - 1;
      
      // move the overlay before the modal element (zIndex trick)
      this.container.insert({before: overlay});
      overlay.insert({after: Control.Overlay.iFrameShim.element});
      
      this.container.style.position = "fixed";
      
      Event.stopObserving(window, 'scroll', this.positionHandler);
      Event.stopObserving(window, 'resize', this.outOfBoundsPositionHandler);
      
      Control.Overlay.positionIFrameShim();
    },
    
    afterClose: function(){
      Control.Modal.stack.pop().close();
      var overlay = Control.Overlay.container;
      
      if (Control.Modal.stack.length == 0) {
        var body = $(document.body);
        
        window.scrollReset();
        
        /// FUCK APPLETS AND FIREFOX
        if (!Prototype.Browser.Gecko || !$$("applet").length) {
          body.style.overflow = "auto"; // Put back the body's scrollbar
        }
        
        // put it back at the end of body
        body.insert(overlay);
        body.insert(Control.Overlay.iFrameShim.element);
        
        Control.Overlay.hide(this.options.fade ? this.options.fadeDuration : false);
      }
      else {
        var lastModal = Control.Modal.stack.last().container;
        overlay.style.zIndex = lastModal.style.zIndex - 2;
        
        // move the overlay before the modal element (zIndex trick)
        lastModal.insert({before: overlay}); 
        overlay.insert({after: Control.Overlay.iFrameShim.element});
        
        Control.Overlay.positionIFrameShim();
      }
      
      //Control.Modal.current = false;
      this.overlayFinishedOpening = false;
    }
  }
});

Class.extend(Control.Modal, {
  restore: function() {
    this.container.removeClassName("modal");
    this.container.setStyle({ position: null});
    Control.Overlay.container.hide(); 
    this.iFrameShim.hide();
    this.isOpen = false;
    this.notify('afterClose');
  },
  print: function() {
    var e = this.container.clone(true);
    e.style.cssText = null;
    e.removeClassName("modal");
    e.print();
  },
  position: function(){
    var contDims = this.container.getDimensions();
    var vpDims = document.viewport.getDimensions();
    
    var top  = Math.max(16, (vpDims.height - contDims.height) / 2);
    var left = Math.max(0,  (vpDims.width  - contDims.width)  / 2);
    
    this.container.setStyle({
      top: top + "px",
      left: left + "px"
    });
  },
  // Redefine this method to ...
  bringToFront: function(){
    // ... do nothing!
  }
});

var Session = {
  window: null,
  isLocked: false,
  lock: function(){
    this.isLocked = true;
    var url = new Url;
    url.addParam("lock", true);
    url.requestUpdate("systemMsg", {
      method: "post",
      getParameters: {m: 'admin', a: 'ajax_unlock_session'}
    });
    var container = $('sessionLock');
    this.window = Modal.open(container);
    
    container.down('form').reset();
    container.down('input[type=text], input[type=password]').focus();
    
    $('main').hide();
  },
  request: function(form){
    var url = new Url;
    url.addElement(form.password);
    url.requestUpdate(form.down('.login-message'), {
      method: "post",
      getParameters: {m: 'admin', a: 'ajax_unlock_session'}
    });
    return false;
  },
  unlock: function(){
    this.window.close();
    $('main').show();
    return false;
  },
  close: function(){
    document.location.href = '?logout=-1';
  }
};

/*
function dataUri2File(data, filename, replace) {
  data = new String(data).replace(/=/g, '%3D').replace(/\//g, '%2F').replace(/\+/g, '%2B');
  
  new Ajax.Request('?m=system&a=datauri_to_file&suppressHeaders=1', {
    method: 'post',
    postBody: 'filename='+filename+'&replace='+replace+'&data='+data
  });
}
*/

var UserSwitch = {
  window: null,
  popup: function(){
    var container = $('userSwitch');
    this.window = Modal.open(container);
    
    container.down('form').reset();
    container.down('input[type=text], input[type=password]').focus();
    document.observe('keydown', function(e){
      if (Event.key(e) == Event.KEY_ESC) UserSwitch.cancel();
    });
  },
  reload: function(){
    this.window.close();
    location.reload();
    location.href = location.href.match(/^(.*)#/)[1]; // When Mediboard is inside a showModalDialog window (url without what's after #)
  },
  login: function(form){
    if (!checkForm(form)) return false;
    var url = new Url;
    url.addElement(form.username);
    url.addElement(form.password);
    url.requestUpdate(form.down('.login-message'), {
      method: "post",
      getParameters: {
        m: 'admin',
        a: 'ajax_login_as',
        is_locked: Session.isLocked
      }
    });
    return false;
  },
  cancel: function(){
    this.window.close();
    if (Session.isLocked) {
      Session.lock();
    }
  }
};

Element.addMethods({
  highlight: function(element, term, className) {
    function innerHighlight(element, term, className) {
      className = className || 'highlight';
      term = (term || '').toUpperCase();
      
      var skip = 0;
      if ($(element).nodeType == 3) {
        var pos = element.data.toUpperCase().indexOf(term);
        if (pos >= 0) {
          var middlebit = element.splitText(pos),
              endbit = middlebit.splitText(term.length),
              middleclone = middlebit.cloneNode(true),
              spannode = document.createElement('span');
              
          spannode.className = 'highlight';
          spannode.appendChild(middleclone);
          middlebit.parentNode.replaceChild(spannode, middlebit);
          skip = 1;
        }
      }
      else if (element.nodeType == 1 && element.childNodes && !/(script|style|textarea|select)/i.test(element.tagName)) {
        for (var i = 0; i < element.childNodes.length; ++i)
          i += innerHighlight(element.childNodes[i], term, className);
      }
      return skip;
    }
    innerHighlight(element, term, className);
    return element;
  },
  removeHighlight: function(element, term, className) {
    className = className || 'highlight';
    $(element).select("span."+className).each(function(e) {
      e.parentNode.replaceChild(e.firstChild, e);
    });
    return element;
  },
  getSelection: function(element) {
    var doc, win, selection, range;
    if ((doc = element.ownerDocument) && (win = doc.defaultView) &&
        win.getSelection && doc.createRange && 
        (selection = window.getSelection()) && 
        selection.removeAllRanges) {
        range = doc.createRange();
        range.selectNode(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    else if (document.body && document.body.createTextRange && 
            (range = document.body.createTextRange())) {
        range.moveToElementText(element);
        range.select();
    }
  },
  print: function(element){
    var iframe = $("printFrame");
    
    if (iframe) iframe.remove();

    // FIXME use Element.getTempIframe
    $(document.documentElement).insert(DOM.iframe({
      id:    "printFrame",
      name:  "printFrame", 
      src:   "about:blank",
      style: "position:absolute;width:1px;height:1px;",
      frameborder: 0
    }));
    
    iframe = $("printFrame");
    
    var win = iframe.contentWindow;
    var doc = win.document;
    var bodyContent = "";
    var parentHead = $$("head")[0];
  
    if (Prototype.Browser.IE) { // argh
      parentHead.select("link, style").each(function(e){
        // Si c'est une feuille de style
        if (e.styleSheet) {
          var css = e.styleSheet.cssText;
          
          // Si elle a un href (feuille de style externe)
          if (e.href) {
            var matchHref = e.href.match(/(.*\/)[^\/]+$/);
            var pattern = /@import\s*(?:url\s*\(\s*)?["']?([^"'\)]+)\)?["']?/g;
            var i = 50, match;
            
            if (matchHref) {
              // on regarde tous ses @import pour les importer "à la main"
              while(i-- && (match = pattern.exec(css))) {
                bodyContent += "<" + "link type=\"text/css\" rel=\"stylesheet\" href=\"" + matchHref[1] + match[1] + "\" />";
              }
            }
          }
          
          bodyContent += "<"+"style type='text/css'>"+css+"<"+"/style>";
        }
      });
    }
    
    bodyContent += "<"+"style type='text/css'>";
    $$("body style").each(function(elt) {
      bodyContent += elt.innerHTML;
    });
    bodyContent += "<"+"/style>";

    var htmlClass = $$("html")[0].className;
    var meta = Prototype.Browser.IE ? "<meta http-equiv='X-UA-Compatible' content='IE="+document.documentMode+"' />" : "";
    
    doc.open();
    doc.write("<"+"html class='"+htmlClass+"'><"+"head>"+meta+"<"+"/head><"+"body>"+bodyContent+"<"+"/body><"+"/html>");

    // !! Don't use PrototypeJS functions here, this is an iframe
    var head = doc.head || doc.getElementsByTagName('head')[0];
    var body = doc.body || doc.getElementsByTagName('body')[0];
    
    var elements;
    
    if (Object.isElement(element))
      elements = [element];
    else 
      elements = element;
    
    elements.each(function(e){
      if (Object.isFunction(e.toPrint)) {
        e = e.toPrint();
      }
      var clone = $(e).clone(true);
      clone.select('script').invoke('remove');
      
      if (Prototype.Browser.IE && document.documentMode && document.documentMode == 9) {
        body.insertAdjacentHTML("beforeEnd", clone.outerHTML.replace(/>\s+<(t[dh])/gi, "><$1"));
      }
      else {
        body.appendChild(clone); // Fx, IE8 and others
      }
    });
    
    if (Prototype.Browser.IE) { // argh
      parentHead.select("script").each(function(e){
        bodyContent += e.outerHTML;
      });
    
      doc.close();
      doc.execCommand('print', false, null);
    }
    else {
      if (Prototype.Browser.Gecko) {
        parentHead.select("link").each(function(e) {
          if (/css/.test(e.getAttribute("href"))) {
            var css = "";
            $A(e.sheet.cssRules).each(function(rule) {
              css += rule.cssText;
            });
            head.innerHTML += "<"+"style type='text/css'>"+css+"<"+"/style>";
          }
        });
      }
      else {
        head.innerHTML = parentHead.innerHTML;
      }
      
      win.focus();
      win.print();
    }
  }
});

App.print = function(){
  if (Prototype.Browser.IE && document.documentMode == 9 && window.parent) {
    document.execCommand('print', false, null);
  }
  else {
    window.focus();
    window.print();
  }
};

App.deferClose = function(){
  (function(){
    window.close();
  }).defer();
};

/**
 * Adds column highlighting to a table
 * @param {Element} table The table
 * @param {String} className The CSS class to give to the highlighted cells
 */
Element.addMethods("table", {
  gridHighlight: function(table, className) {
    className = className || "hover";
    
    var rows = $(table).select("tr");
    
    rows.each(function(row){
      row.select('th,td').each(function(cell, i){
        cell.observe("mouseover", function(e){
          $(table).select("th."+className+",td."+className).invoke("removeClassName", className);
          rows.each(function(_row){
            _row.childElements()[i].addClassName(className);
          });
        });
      });
    });
  }
});

/**
 * Creates a temporary iframe element
 * @param {String} id The ID to give to the iframe
 */
Element.getTempIframe = function(id) {
  var iframe = DOM.iframe({
    src:   "about:blank",
    style: "position:absolute;width:0px;height:0px;",
    frameborder: 0
  });
  
  if (id) {
    Element.writeAttribute(iframe, 'id', id);
  }
    
  Element.writeAttribute(iframe, 'name', iframe.identify());
  
  $(document.documentElement).insert(iframe);
  
  return iframe;
};

var BarcodeParser = {
  inputWatcher: Class.create({
    initialize: function(input, options) {
      this.input = $(input);
      if (!this.input) return;
      
      this.options = Object.extend({
        size: null,
        field: "scc_prod",
        onRead: null,
        onAfterRead: function(parsed){}
      }, options);
      
      this.options.onRead = this.options.onRead ||
        function(parsed) {
          var field = this.options.field;
          var alert = (!parsed.comp[field] && field != "ref") || (field == "ref" && (parsed.comp.lot || parsed.comp.scc || parsed.comp.per));
          var message = input.next(".barcode-message");
          
          if (!message) {
            message = DOM.span({style: "color: red; display: none;", className: "barcode-message"}, "Ce n'est pas un code valide");
            input.up().insert({bottom: message});
          }
          message.setVisible(alert);
          
          if (parsed.comp[this.options.field]) {
            $V(input, parsed.comp[this.options.field]);
          }
          
          input.select();
        }.bind(this);
      /*GS - 10-01-2013*/
      //input.maxLength = 50;
      input.addClassName("barcode");
      input.observe("keypress", function(e){
        var charCode = Event.key(e);
        var input = Event.element(e);
        
        if (charCode == Event.KEY_RETURN) {
          if (!this.options.size || ($V(input).length != this.options.size)) {
            Event.stop(e);
          }
          
          var url = new Url("dPstock", "httpreq_parse_barcode");
          url.addParam("barcode", $V(input));
          url.requestJSON(function(parsed){
            this.options.onRead(parsed);
            this.options.onAfterRead(parsed);
          }.bind(this));
        }
      }.bindAsEventListener(this));
    }
  })
};

/**
 * gives the string of the represented by the key
 * @param tr_key
 */
function tr(tr_key) {
	return typeof(window.locales[tr_key]) == "undefined" ? tr_key : window.locales[tr_key];
}


function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

String.prototype.replaceAll = function(find, replace) {
  return this.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}