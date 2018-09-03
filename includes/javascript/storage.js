/* $Id: storage.js 8209 2010-03-04 20:01:54Z phenxdesign $ */

/**
 * @package Mediboard
 * @subpackage includes
 * @version $Revision: 8209 $
 * @author SARL OpenXtrem
 * @license GNU General Public License, see http://www.gnu.org/licenses/gpl.html 
 */

dojo.require("dojo.dom");
dojo.require("dojo.io.*");
dojo.require("dojo.event.*");
dojo.require("dojo.html.*");
dojo.require("dojo.lfx.*");
dojo.require("dojo.storage.*");

function storageMain(){}

var MbStorage = {
  initialize: function(){
    storageMain();
  },
  
  load: function(key){   
    if(key == null || typeof key == "undefined" || key == ""){
      this._printStatus("Veuillez entrer une clé", "error");
      return;
    }
    return this._handleLoad(key);
  },

  save: function(key,value){
    if(key == null || typeof key == "undefined" || key == ""){
      this._printStatus("Veuillez entrer une clé", "error");
      return;
    }
    this._save(key, value);
  },

  clear: function(){
    
    dojo.storage.clear();
    
    this._printStatus("Cleared", "message");
  },

  configure: function(evt){
    evt.preventDefault();
    evt.stopPropagation();
    if(dojo.storage.hasSettingsUI()){
      // redraw our keys after the dialog is closed, in
      // case they have all been erased
      var self = this;
      dojo.storage.onHideSettingsUI = function(){};
      
      // show the dialog
      dojo.storage.showSettingsUI();
    }
  },
    
  remove: function(key){    
    this._printStatus("Removing '" + key + "'...", "loading");
    dojo.storage.remove(key);
    this._printStatus("Removed '" + key, "message");
  },
    
  _save: function(key, value){
    this._printStatus("Saving '" + key + "'...", "loading");
    var self = this;
    var saveHandler = function(status, keyName){
      if(status == dojo.storage.FAILED){
        alert("You do not have permission to store data for this web site. "
              + "Press the Configure button to grant permission.");
      }else if(status == dojo.storage.SUCCESS){
        self._printStatus("Saved '" + key + "'", "message");
      }
    };
    try{
      dojo.storage.put(key, value, saveHandler);
    }catch(exp){
      alert(exp);
    }
  },

  _handleLoad: function(key){
    this._printStatus("Loading '" + key + "'...", "loading");
    var results = dojo.storage.get(key);
    this._printStatus("Loaded '" + key + "'", "message");
    return results;
  },

  _printStatus: function(message,classname){
    $('systemMsg').innerHTML = "<div class='" + classname + "'>" + message + "</div>";
  }
};

//wait until the storage system is finished loading
if(dojo.storage.manager.isInitialized() == false){ // storage might already be loaded when we get here
  dojo.event.connect(dojo.storage.manager, "loaded", MbStorage, MbStorage.initialize);
}else{
  dojo.event.connect(dojo, "loaded", MbStorage, MbStorage.initialize);
}
