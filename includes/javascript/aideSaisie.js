/**
 * Provides auto-completion to helped fields
 */

var AideSaisie = {
  AutoComplete: Class.create({
    timestamp: "",
    initialize: function(element, options){
      this.element = $(element);
      
      if ($(this.element.form).isReadonly()) {
        return;
      }
      
      this.options = Object.extend({
        dependField1: null,
        classDependField1: null,
        classDependField2: null,
        dependField2: null, 
        searchField: null, 
        objectClass: null, 
        userId: User.id,
        userView: User.view,
        contextUserId: User.id,
        contextUserView: User.view,
        validate: null,//element.form.onsubmit.bind(element.form),
        validateOnBlur: true,
        resetSearchField: true,
        resetDependFields: true,
        filterWithDependFields: true,
        defaultUserId: null,
        defaultUserView: null,
        updateDF: true,
        property: '',
        strict: true,
        timestamp: AideSaisie.timestamp,
        height: "auto"
      }, options);
      this.init();
    },
    init: function(){
      this.options.defaultUserId = this.options.contextUserId;
      this.options.defaultUserView = this.options.contextUserView;
      this.searchField = $(this.options.searchField || this.element);
      this.isContextOwner = this.options.userId == this.options.contextUserId;
      this.list = this.createListContainer();
      
      var url = new Url("dPcompteRendu", "httpreq_do_aide_autocomplete");
      url.addParam("property", this.options.property || this.element.name);
      url.addParam("object_class", this.options.objectClass);
      url.addParam("user_id", this.options.defaultUserId);
      
      // If it is a textarea
      if (/^textarea$/i.test(this.searchField.tagName)) {
        this.buildAdvancedUI(url);
      }
      else {
        url.autoComplete(this.searchField, this.list, {
          minChars: 2,
          updateElement: this.update.bind(this),
          paramName: "_search"
        });
      }
    },
    
    // Create div to feed
    createListContainer: function(){
      var list = new Element("div", {
        id: this.searchField.id + "_auto_complete"
      }).addClassName("autocomplete").setStyle({
        width: "400px",
        height: this.options.height
      }).hide();
      
      this.searchField.insert({after: list});
      return list;
    },
    
    getSelectedData: function(selected){
      var oDepend1 = selected.down(".depend1");
      var oDepend2 = selected.down(".depend2");
      var oText = selected.down(".value");
      
      return {
        depend1: oDepend1 ? oDepend1.getText() : "",
        depend2: oDepend2 ? oDepend2.getText() : "",
        text: oText.getText()
      };
    },
    
    // Update field after selection
    update: function(selected){
      var data = this.getSelectedData(selected);
      
      $V(this.options.dependField1, data.depend1);
      $V(this.options.dependField2, data.depend2);
      $V(this.element, data.text.strip());
      this.element.tryFocus();
    },
    
    // Update depend fields after selection
    updateDependFields: function(input, selected){
      if (!this.options.updateDF) return;
      
      var data = this.getSelectedData(selected);
      
      if($V(input).charAt($V(input).length - 1) != '\n') {
        $V(input, $V(input) + ' ');
      }
      if (Object.isFunction(input.onchange)){
        input.onchange.bindAsEventListener(input)();
      }
      input.tryFocus();
      $V(this.options.dependField1, data.depend1);
      $V(this.options.dependField2, data.depend2);
    },
    
    buildAdvancedUI: function(url){
      var throbber, list, toolbar, 
          options = this.options,
          buttons = {};
      var container = 
        DOM.div({className: "textarea-helped"},
        toolbar = DOM.div({className: "toolbar "+Preferences.textareaToolbarPosition},
          
          DOM.a({href: "#1", className: "throbber-background"}), 
          throbber = DOM.a({href: "#1", className: "throbber"}).hide(),
          //buttons.grid   = DOM.a({href: "#1"}, DOM.img({src: "images/icons/grid.png", title: "Mode grille"})),
          buttons.down   = DOM.a({href: "#1"}, DOM.img({src: "style/mediboard/images/buttons/down.png", title: "Voir tous les choix"})),
          buttons.create = DOM.a({href: "#1"},
            DOM.span({style: "display: none;", className: "sub-toolbar"},
              buttons.newGroup    = DOM.img({style: "", src: "images/icons/group.png"        , title: "Nouvelle aide pour "+User["group"].view}), DOM.br({}),
              //buttons.newFunction = DOM.img({style: "", src: "images/icons/user-function.png", title: "Nouvelle aide pour "+User["function"].view}), DOM.br({}),
              buttons.newUser     = DOM.img({style: "", src: "images/icons/user.png"         , title: "Nouvelle aide pour "+User.view})
            ),
            buttons.createIcon = DOM.img({src: "images/icons/new.png", title: "Nouvelle aide"})
          ),
          buttons.owner     = DOM.a({href: "#1"}, DOM.img({src: "images/icons/user-glow.png", title: this.options.defaultUserView})).setVisible(Preferences.aideOwner == '1'),
          buttons.timestamp = DOM.a({href: "#1"}, DOM.img({src: "images/icons/timestamp.png", title: "Ajouter un horodatage"})).setVisible(Preferences.aideTimestamp == '1'),
          buttons.valid     = DOM.a({href: "#1"}, DOM.img({src: "style/mediboard/images/buttons/submit.png", title: "Valider"})).setVisible(this.options.validate)
        ).hide(),
        list = $(this.searchField.id + "_auto_complete").setStyle({marginLeft: "-2px"})
      );
      
      toolbar.doShow = function() {
        if (toolbar.timeout) {
          window.clearTimeout(toolbar.timeout);
          toolbar.timeout = null;
        }
        //toolbar.show();
      };
      
      toolbar.doHide = function() {
        if (toolbar.timeout) {
          return;
        }
        
        toolbar.timeout = (function() {
          toolbar.hide();
          toolbar.select(".sub-toolbar").invoke("hide");
          toolbar.canHide = false;
        }).delay(0.5);
      };
      
      this.searchField.up().
        observe(Preferences.aideShowOver == '1' ? 'mousemove' : 'dblclick', toolbar.doShow).
        observe('mouseout', toolbar.doHide)/*.
        observe('click'   , toolbar.doHide).
        observe('keydown' , toolbar.doHide)*/;
      
      // to prevent mousemove on the list to trigger toolbar.show
      list.observe("mousemove", Event.stop);
      
      if(Preferences.aideShowOver == '0') {
        toolbar.observe('mousemove', toolbar.doShow);
      }
      
      //buttons.invoke('observe', 'mouseover', Event.stop);
      
      var validate = this.options.validate ? function(){
        this.text = $V(this.searchField);
        this.options.validate(this.text);
        
        if (this.options.resetDependFields) {
          $V(this.options.dependField1, '');
          $V(this.options.dependField2, '');
        }
        if (this.options.resetSearchField) {
          $V(this.searchField, '');
        }
      }.bind(this) : Prototype.emptyFunction;
      
      var autocompleteDelays = {
        "short": 0.5,
        "medium": 1.0,
        "long": 1.5
      };
      
      // Setup the autocompleter
      var autocomplete = url.autoComplete(this.searchField, list, {
        minChars: Preferences.aideAutoComplete == '0' ? 65536 : 2,
        tokens: "\n",
        indicator: throbber,
        select: "value", 
        paramName: "_search",
        caretBounds: true,
        frequency: autocompleteDelays[Preferences.autocompleteDelay],
        callback: function(input, query){
          if (options.filterWithDependFields) {
            query += options.dependField1 ? ("&depend_value_1=" + ($V(options.dependField1) || "")) : '';
            query += options.dependField2 ? ("&depend_value_2=" + ($V(options.dependField2) || "")) : '';
          }
          return query+"&hide_empty_list=1&hide_exact_match=1&strict="+options.strict;
        },
        dontSelectFirst: true,
        onAfterShow: function(element, update){
          if (update.select("li").length == 0) {
            autocomplete.active = false;
            autocomplete.hasFocus = false;
            autocomplete.hide();
            return;
          }
          
          /*update.down('ul').observe("click", function(event){
            autocomplete.tokenBoundsBlurIE = autocomplete.element.getInputSelection();
            Console.debug(autocomplete.tokenBoundsBlurIE);
          });*/
        },
        afterUpdateElement: this.updateDependFields.bind(this)
      });
      
      // The blur event must not hide the list
      Event.stopObserving(this.element, 'blur');
      Event.observe(this.element, 'blur', function() {
        // needed to make click events working
        //setTimeout(this.hide.bind(this), 2500);
        this.hasFocus = false;
        this.active = false;
      }.bindAsEventListener(autocomplete));
      
      document.observe("click", function(e){
        // if click outside the container
        var element = Event.element(e); // Sometimes, element is null (maybe when it is <html>)
        if (element && !element.descendantOf(container)) {
          autocomplete.hasFocus = false;
          autocomplete.active = false;
          autocomplete.hide();
        }
      });
      
      // Grid mode 
      var gridMode = function(e) {
        var options = this.options, 
            fragment = "", 
            dependValue,
            url = new Url('dPcompteRendu', 'aides_saisie_grid');
        
        dependValue = $V(options.dependField1);
        if (dependValue) {
          fragment += options.objectClass+"-"+dependValue;
        }
        
        dependValue = $V(options.dependField2);
        if (dependValue) {
          fragment += (fragment ? "," : "") + options.objectClass+"-"+dependValue;
        }
        
        url.addParam('object_class', options.objectClass);
        url.addParam('user_id', options.defaultUserId);
        url.addParam('property', this.element.name);
        url.setFragment(fragment);
        url.popup(900, 600, "Grille d'aides à la saisie");
        
        url.oWindow.applyHelper = function(title, text){
          this.element.value += text+"\n";
        }.bind(this);
      }.bindAsEventListener(this);
      
      // quick creation
      var createQuick = function(owner, id) {
        var text = this.text || this.element.value;
        var name = text.split(/\s+/).splice(0, 3).join(" ");
        
        var url = new Url()
          .addParam("m", "dPcompteRendu")
          .addParam("@class", "CAideSaisie")
          .addParam("del", 0)
          .addParam("class", options.objectClass)
          .addParam("field", options.property || this.element.name)
          
          .addParam("name", name)
          .addParam("text", text)
          
          .addParam("depend_value_1", $V(options.dependField1))
          .addParam("depend_value_2", $V(options.dependField2))
          .addParam(owner, id);
          
        url.requestUpdate("systemMsg", {method: "post"});
      }.bind(this);
      
      buttons.newUser    .observe('click', createQuick.curry("user_id", User.id));
      //buttons.newFunction.observe('click', createQuick.curry("function_id", User["function"].id));
      buttons.newGroup   .observe('click', createQuick.curry("group_id", User["group"].id));
      
      // Toolbar buttons actions
      if (!this.isContextOwner) {
        buttons.owner.observe('click', function (e) {
          if(this.options.defaultUserId == this.options.userId) {
            this.options.defaultUserId = this.options.contextUserId;
            this.options.defaultUserView = this.options.contextUserView;
            buttons.owner.down().src = "images/icons/user-glow.png";
            buttons.owner.down().title = this.options.contextUserView;
          } else {
            this.options.defaultUserId = this.options.userId;
            this.options.defaultUserView = this.options.userView;
            buttons.owner.down().src = "images/icons/user.png";
            buttons.owner.down().title = this.options.userView;
          }

          var params = autocomplete.url.toQueryParams();
          params.user_id = this.options.defaultUserId;
          autocomplete.url = "?"+Object.toQueryString(params);
          autocomplete.hide();

        }.bind(this));
      }
      
      var activate = function(){
        this.changed = false;
        this.hasFocus = true;
        // We save the default params, change it so that _search 
        // is empty to have all the entries and restore it after
        var oldDefaultParams = this.options.defaultParams;
        
        this.options.defaultParams = 
          "_search=" + 
          (options.dependField1 ? ("&depend_value_1=" + ($V(options.dependField1) || "")) : '') + 
          (options.dependField2 ? ("&depend_value_2=" + ($V(options.dependField2) || "")) : '');
          
        this.getUpdatedChoices();
        this.options.defaultParams = oldDefaultParams;
      }.bind(autocomplete);
      
      buttons.down.observe('click', activate);
      //buttons.grid.observe('mousedown', gridMode);
      buttons.valid.observe('click', validate);
      if(Preferences.aideFastMode == '1') {
        buttons.create.observe('mouseover', function(e){
          buttons.create.down('.sub-toolbar').show();
        });
        buttons.create.observe('mouseout', function(e){
          buttons.create.down('.sub-toolbar').hide();
        });
      }
      
      buttons.createIcon.observe('click', function(e){
        AideSaisie.create(
          this.options.objectClass, 
          this.element, 
          this.options.property, 
          $V(this.options.dependField1),
          $V(this.options.dependField2), 
          this.text,
          this.options.defaultUserId,
          this.options.classDependField1,
          this.options.classDependField2
        );
      }.bindAsEventListener(this));

      buttons.timestamp.observe('click', function(){
        var timestamp = DateFormat.format(new Date(), this.options.timestamp);
        var parts = this.options.userView.split(" ");
  
        timestamp = timestamp.replace(/%p/g, parts[1]);
        timestamp = timestamp.replace(/%n/g, parts[0]);
        timestamp = timestamp.replace(/%i/g, parts[1].charAt(0) + ". " + parts[0].charAt(0) + ". ");
        
        if(this.element.value[this.element.value.length -1] != '\n' && this.element.value.length != 0) {
          timestamp = '\n' + timestamp;
        }
        
        this.element.value += timestamp + '\n';
        this.element.scrollTop = this.element.scrollHeight;
        this.element.tryFocus();
      }.bindAsEventListener(this));
      
      // We wrap the textarea with the new container
      this.searchField.insert({before: container});
      
      // We simulate the blur catch
      if (this.options.validateOnBlur) {
        document.observe("click", function(e){
          // if click outside the container
          if (this.searchField.value && !Event.element(e).descendantOf(container))
            validate();
        }.bindAsEventListener(this));
        
        document.observe("keydown", function(e){
          // if TAB key pressed
          if (this.searchField.value && Event.key(e) == Event.KEY_TAB)
            validate();
        }.bindAsEventListener(this));
      }
    }
  }),
  
  create: function (objectClass, field, name, dependValue1, dependValue2, text, userId, class_depend_value_1, class_depend_value_2) {
    var url = new Url("dPcompteRendu", "edit_aide");
    url.addParam("user_id"     , userId);
    url.addParam("class"       , objectClass);
    url.addParam("field"       , name || field.name);
    url.addParam("text"        , text || field.value);
    url.addParam("depend_value_1", dependValue1 || null);
    url.addParam("depend_value_2", dependValue2 || null);
    url.addParam("class_depend_value_1", class_depend_value_1 || null);
    url.addParam("class_depend_value_2", class_depend_value_2 || null);
    url.popup(600, 400, "AidesSaisie");
  }
};
