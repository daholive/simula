var ExObject = {
  container: null,
  classes: {},
  refreshSelf: {},
  defaultProperties: {},
  pixelPositionning: false,
  register: function(container, options) {
    this.container = $(container);
    
    if (!this.container) {
      return;
    }
    
    options = Object.extend({
      ex_class_id: null,
      object_guid: null,
      event_name:  null
    }, options);
    
    var url = new Url("forms", "ajax_widget_ex_classes_new");
    url.addParam("object_guid", options.object_guid);
    url.addParam("ex_class_id", options.ex_class_id);
    url.addParam("event_name",  options.event_name);
    url.addParam("_element_id", this.container.identify());
    url.requestUpdate(container, options);
  },
  
  refresh: function(){
    ExObject.register(ExObject.container);
  },
  
  trigger: function(object_guid, event_name, options) {
    options = Object.extend({
      onTriggered: function(){}
    }, options);
    
    // Multiple objects
    if (Object.isArray(object_guid)) {
      var url = new Url("forms", "ajax_trigger_ex_classes_multiple");
      url.addParam("object_guids[]", object_guid, true);
      url.addParam("event_name", event_name);
      url.requestJSON(function(datas){
        datas.reverse(false).each(function(data){
          showExClassForm(data.ex_class_id, data.object_guid, data.object_guid+"_"+data.event_name+"_"+data.ex_class_id, "", data.event_name);
        });
        
        options.onTriggered(datas, event_name);
      });
    }
    
    // Single objects
    else {
      var url = new Url("forms", "ajax_trigger_ex_classes");
      url.addParam("object_guid", object_guid);
      url.addParam("event_name", event_name);
      url.requestJSON(function(datas){
        datas.reverse(false).each(function(data){
          showExClassForm(data.ex_class_id, data.object_guid, data.event_name+"_"+data.ex_class_id, "", data.event_name);
        });
        
        options.onTriggered(object_guid, event_name);
      });
    }
  },
  
  triggerMulti: function(forms) {
    $A(forms).each(function(data){
      showExClassForm(data.ex_class_id, data.object_guid, data.object_guid+"_"+data.event_name+"_"+data.ex_class_id, "", data.event_name);
    });
  },
  
  initTriggers: function(triggers, form, elementName, parent_view){
    var inputs = Form.getInputsArray(form[elementName]);
    
    var triggerFunc = function(input, triggers) {
      var isSetCheckbox = input.hasClassName("set-checkbox");
      
      if (isSetCheckbox && !input.checked) {
        return;
      }
      
      var value = (isSetCheckbox ? input.value : $V(input));
      var ex_class_id = triggers[value];
      triggers[value] = null;
      
      if (ex_class_id) {
        var object_guid = ExObject.current.object_guid;
        var event_name = ExObject.current.event_name;
        showExClassForm(ex_class_id, object_guid, /*object_guid+"_"+*/event_name+"_"+ex_class_id, "", event_name, null, parent_view);
      }
    };
    
    inputs.each(function(input){
      var callback = triggerFunc.curry(input, triggers);
      input.observe("change", callback)
           .observe("ui:change", callback)
           .observe("click", callback);
    });
  },
  
  show: function(mode, ex_object_id, ex_class_id, object_guid, element_id){
    var url = new Url("forms", "view_ex_object_form");
    url.addParam("ex_object_id", ex_object_id);
    url.addParam("ex_class_id", ex_class_id);
    url.addParam("object_guid", object_guid);
    
    if (element_id) {
      url.addParam("_element_id", element_id);
    }
    
    if (mode == "display" || mode == "print") {
      url.addParam("readonly", 1);
    }
    if (mode == "preview") {
      url.addParam("preview", 1);
    }
    
    /*else {
      window["callback_"+ex_class_id] = function(ex_class_id, object_guid){
        ExObject.register(this.container, {
          ex_class_id: ex_class_id, 
          object_guid: object_guid, 
          event_name: event_name
        });
      }.bind(this).curry(ex_class_id, object_guid);
    }*/
    
    if (mode == "print") {
      url.addParam("print", 1);
      url.addParam("only_filled", 1);
    }
    
    url.pop("100%", "100%", mode+"-"+ex_object_id);
  },
  
  print: function(ex_object_id, ex_class_id, object_guid){
    ExObject.show("print", ex_object_id, ex_class_id, object_guid);
  },
  
  display: function(ex_object_id, ex_class_id, object_guid){
    ExObject.show("display", ex_object_id, ex_class_id, object_guid);
  },
  
  edit: function(ex_object_id, ex_class_id, object_guid, element_id){
    ExObject.show("edit", ex_object_id, ex_class_id, object_guid, element_id);
  },
  
  preview: function(ex_class_id, object_guid){
    ExObject.show("preview", null, ex_class_id, object_guid);
  },
  
  history: function(ex_object_id, ex_class_id){
    var url = new Url("system", "view_history");
    url.addParam("object_class", "CExObject");
    url.addParam("object_id", ex_object_id);
    url.addParam("ex_class_id", ex_class_id);
    url.addParam("user_id", "");
    url.addParam("type", "");
    url.popup(900, 600, "history");
  },
  
  loadExObjects: function(object_class, object_id, target, detail, ex_class_id, options) {
    detail = detail || 0;
    ex_class_id = ex_class_id || "";
    
    options = Object.extend({
      print: 0,
      start: 0,
      search_mode: null,
      onComplete: function(){}
    }, options);
    
    target = $(target);
    
    target.writeAttribute("data-reference_class", object_class);
    target.writeAttribute("data-reference_id",    object_id);
    target.writeAttribute("data-ex_class_id",     ex_class_id);
    target.writeAttribute("data-detail",          detail);
    
    var url = new Url("forms", "ajax_list_ex_object");
    url.addParam("detail",          detail);
    url.addParam("reference_id",    object_id);
    url.addParam("reference_class", object_class);
    url.addParam("ex_class_id",     ex_class_id);
    url.addParam("target_element",  target.identify());
    url.mergeParams(options);
    url.requestUpdate(target, {onComplete: options.onComplete});
  },
  
  getCastedInputValue: function(value, input){
    // input may be a nodeList (bool, etc)
    try {
      if (input.hasClassName("float") ||
          input.hasClassName("currency") ||
          input.hasClassName("pct")) {
        return parseFloat(value);
      }
  
      if (input.hasClassName("num") ||
          input.hasClassName("numchar") ||
          input.hasClassName("pct")) {
        return parseInt(value, 10);
      }
    } catch(e) {}
    
    return value;
  },
  
  checkPredicate: function(predicate, triggerField) {
    var refValue = predicate.value;
    var triggerValue = $V(triggerField);
    var firstInput = Form.getInputsArray(triggerField)[0];
    
    if (Object.isArray(triggerValue)) {
      triggerValue = triggerValue.join("|");
    }
    else {
      triggerValue += "";
    }

    // Consider "set"s differently:
    // when operator is "="  -> interesetion
    // when operator is "!=" -> !intersection
    if (firstInput.hasClassName("set")) {
      var triggerValues = triggerValue.split(/\|/g).without("");
      var predicateValues = predicate.value.split(/\|/g).without("");

      switch (predicate.operator) {
        case "=":
          return triggerValues.intersect(predicateValues).length > 0;

        case "!=":
          return triggerValues.intersect(predicateValues).length == 0;

        default:
          return false;
      }
    }
    
    if (["=", "!=", ">", ">=", "<", "<="].indexOf(predicate.operator) > -1) {
      refValue     = ExObject.getCastedInputValue(predicate.value, triggerField);
      triggerValue = ExObject.getCastedInputValue(triggerValue, triggerField);
    }

    // An empty value hides the target
    if (triggerValue === ""/* || isNaN(triggerValue)*/) { // pas isNaN car on peut avoir des dates ou du texte!!
      return false;
    }

    switch (predicate.operator) {
      case "=":
        if (triggerValue == predicate.value) return true;
        break;

      case "!=":
        if (triggerValue != predicate.value) return true;
        break;

      case ">":
        if (triggerValue > refValue) return true;
        break;

      case ">=":
        if (triggerValue >= refValue) return true;
        break;

      case "<":
        if (triggerValue < refValue) return true;
        break;

      case "<=":
        if (triggerValue <= refValue) return true;
        break;

      case "startsWith":
        if (triggerValue.indexOf(predicate.value) == 0) return true;
        break;

      case "endsWith":
        if (triggerValue.substr(-predicate.value.length) == predicate.value) return true;
        break;

      case "contains":
        if (triggerValue.indexOf(predicate.value) > -1) return true;
        break;

      case "hasValue":
        if (triggerValue != "") return true;
        break;

      default: return true;
    }

    return false;
  },
  
  getStyledElement: function(input) {
    var visual;
    
    if (visual = input.get("visual-element")) {
      return input.form[visual];
    }

    if (input.hasAttribute("defaultstyle")) {
      return input;
    }

    return input.up("[defaultstyle]");
  },
  
  handlePredicate: function(predicate, input, form){
    var result = ExObject.checkPredicate(predicate, input);

    // Display fields
    predicate.display.fields.each(function(name){
      ExObject.toggleField(name, result, form.elements[name]);
    });

    // Display messages
    predicate.display.messages.each(function(guid){
      var message = $("message-"+guid);

      if (!message) {
        return;
      }

      message.setVisible(result);
    });

    if (ExObject.pixelPositionning) {
      // Display subgroups
      predicate.display.subgroups.each(function(guid){
        $("subgroup-"+guid).setVisible(result);
      });
    }
    
    // TODO To be optimized
    
    // Style
    if (result) {
      predicate.style.fields.each(function(style){
        var input = Form.getInputsArray(form.elements[style.name])[0];
        var styled = ExObject.getStyledElement(input);
        styled.style[style.camelized] = style.value;
      });

      predicate.style.messages.each(function(style){
        var message = $("message-"+style.guid);

        if (!message) {
          return;
        }

        message.style[style.camelized] = style.value;
      });

      if (ExObject.pixelPositionning) {
        predicate.style.subgroups.each(function(style){
          $("subgroup-"+style.guid).down("fieldset").style[style.camelized] = style.value;
        });
      }
    }
  },
  
  initPredicates: function(defaultProperties, fieldPredicates, form){
    ExObject.defaultProperties = defaultProperties;

    $H(fieldPredicates).each(function(pair){
      var element = form.elements[pair.key];
      var inputs = Form.getInputsArray(element);
      var affects = pair.value.affects;

      var resetStyle = (function(affects, form){
        if (!affects) {
          return;
        }

        $H(affects).each(function(p){
          var guid = p.key;
          var affected = p.value;
          var css = ExObject.defaultProperties[guid];

          if (!css) {
            return;
          }

          var styledElement;

          switch(affected.type) {
            case "field":
              var input = Form.getInputsArray(form.elements[affected.name])[0];
              styledElement = ExObject.getStyledElement(input);
              break;

            case "message":
              styledElement = $("message-"+guid);
              break;

            case "subgroup":
              styledElement = $("subgroup-"+guid).down("fieldset");
              break;
          }

          if (!styledElement) {
            return;
          }

          // Firefox: do not use setStyle (needs camelcase)
          $H(css).each(function(pair){
            styledElement.style[pair.key.camelize()] = pair.value;
          });
        });
      }).curry(affects, form);

      resetStyle();
      
      inputs.each(function(input){
        input.observe("change", resetStyle)
             .observe("ui:change", resetStyle)
             .observe("click", resetStyle);
      });
    
      pair.value.predicates.each(function(predicate) {
        var callback = (function(){
          (function(){ 
            ExObject.handlePredicate(predicate, element, form); 
          }).defer();
        }).curry(predicate, element, form);
        
        callback();
  
        inputs.each(function(input){
          input.observe("change", callback)
               .observe("ui:change", callback)
               .observe("click", callback);
        });
      });
    });
  },
  
  toggleField: function(name, v, targetField) {
    $$("div.field-"+name).each(function(container){
      //container.setClassName("opacity-20", !v);
      container.setVisibility(v);
      
      Form.getInputsArray(targetField).each(function(input){
        input.disabled = !v;
      });
      
      if (!v) {
        $V(targetField, "");
      }
    });
  }
};

var ExObjectFormula = Class.create({
  tokenData: null,
  form: null,
  customOps: {
    Min: function (ms) { return Math.ceil(ms / Date.minute) },
    H:   function (ms) { return Math.ceil(ms / Date.hour) },
    J:   function (ms) { return Math.ceil(ms / Date.day) },
    Sem: function (ms) { return Math.ceil(ms / Date.week) },
    M:   function (ms) { return Math.ceil(ms / Date.month) },
    A:   function (ms) { return Math.ceil(ms / Date.year) }
  },
  
  initialize: function(tokenData, form) {
    this.tokenData = tokenData;
    this.form = form;
    this.parser = new Parser;
    
    // Extend Parser with cutom operators (didn't find a way to do this on the prototype) 
    this.parser.ops1 = Object.extend(this.customOps, this.parser.ops1);
    
    var allFields = Object.keys(this.tokenData);
    
    $H(this.tokenData).each(function(token){
      var field = token.key;
      var data = token.value;
      var formula = data.formula;
      
      if (!formula) return;
      
      var fieldElement = this.form[field];
      var compute, variables = [], expr;
      
      // concatenation
      if (fieldElement.hasClassName("text")) {
        fieldElement.value = formula;
        
        allFields.each(function(v){
          if (formula.indexOf("[" + v + "]") != -1) {
            variables.push(v);
          }
        });
        
        expr = {
          evaluate: (function(formula, values){
            var result = formula;
            
            $H(values).each(function(pair){
              result = result.replace(new RegExp("(\\[" + pair.key + "\\])", "g"), pair.value);
            });
            
            return result;
          }).curry(formula)
        };
      }
      
      // arithmetic
      else {
        formula = formula.replace(/[\[\]]/g, "");
        
        try {
          expr = this.parser.parse(formula);
          variables = expr.variables();
        } 
        catch (e) {
          fieldElement.insert({
            after: DOM.div({
              className: 'small-error'
            }, "Formule invalide: <br /><strong>" + data.formulaView + "</strong>")
          });
          return;
        }
      }
      
      this.tokenData[field].parser = expr;
      this.tokenData[field].variables = variables;
      
      compute = this.computeResult.bind(this).curry(fieldElement);
      compute();
      
      variables.each(function(v){
        if (!this.form[v]) 
          return;
        
        var inputs = Form.getInputsArray(this.form[v]);
        
        inputs.each(function(input){
          if (input.hasClassName("date") || 
              input.hasClassName("dateTime") || 
              input.hasClassName("time")) {
            input.onchange = compute;
          }
          else {
            input.observe("change", compute).observe("ui:change", compute).observe("click", compute);
          }
        });
      }, this);
    }, this);
  },
  
  //get the input value : coded or non-coded
  getInputValue: function(element, isConcat){
    if (!element) {
      return false;
    }
    
    var value = $V(element);
    
    element = Form.getInputsArray(element)[0];
    
    var name = element.name;
    var result = this.tokenData[name].values;

    if (element.hasClassName("date") || 
        element.hasClassName("dateTime") ||
        element.hasClassName("time")) {
          
      if (!value) {
        return isConcat ? "" : NaN;
      }
      
      if (element.hasClassName("date")) {
        var date = Date.fromDATE(value);
        date.resetTime();
        
        if (isConcat) {
          return date.toLocaleDate();
        }
      }

      if (element.hasClassName("dateTime")) {
        var date = Date.fromDATETIME(value);
        
        if (isConcat) {
          return date.toLocaleDateTime();
        }
      }
      
      if (element.hasClassName("time")) {
        var date = Date.fromDATETIME("1970-01-01 "+value);
        date.resetDate();
        
        if (isConcat) {
          return date.toLocaleTime();
        }
      }
      
      return date.getTime();
    }
    
    // non-coded
    if (result === true) {
      return value;
    }

    // coded
    return this.tokenData[name].values[value];
  },

  //computes the result of a form + exGroup(formula, resultField)
  computeResult: function(target){
    var data = this.tokenData[target.name];
    if (!data) return;
    
    var form = target.form;
    
    var date = new Date();
    date.resetTime();
    date = date.getTime();
    
    var time = new Date();
    time.resetDate();
    time = time.getTime();
    
    var now = (new Date()).getTime();
    
    var constants = {
      DateCourante: date,
      HeureCourante: time,
      DateHeureCourante: now
    };
    var values = {};
    var isConcat = target.hasClassName("text");

    data.variables.each(function(v){
      var val = constants[v] || this.getInputValue(form[v], isConcat);
      
      // functions are considered like variables
      if (val === false) {
        return;
      }
      
      values[v] = val;
      
      if (!isConcat && values[v] === "") {
        values[v] = NaN;
      }
    }, this);
    
    var result = data.parser.evaluate(values);
    if (!isConcat && !isFinite(result)) {
      result = "";
    }
    else {
      var props = target.getProperties();
      if (props.decimals) {
        result = parseFloat(result).toFixed(props.decimals);
      }
    }
    
    result += "";
    $V(target, result);
    
    if (isConcat) {
      target.rows = result.split("\n").length;
    }
  }
});

// TODO put this in the object
function selectExClass(element, object_guid, event_name, _element_id) {
  var view = element.options ? element.options[element.options.selectedIndex].innerHTML : element.innerHTML;
  showExClassForm($V(element) || element.value, object_guid, view, null, event_name, _element_id);
  element.selectedIndex = 0;
}

function showExClassForm(ex_class_id, object_guid, title, ex_object_id, event_name, _element_id, parent_view, ajax_container) {
  var url = new Url("forms", "view_ex_object_form");
  url.addParam("ex_class_id",  ex_class_id);
  url.addParam("object_guid",  object_guid);
  url.addParam("ex_object_id", ex_object_id);
  url.addParam("event_name",   event_name);
  url.addParam("_element_id",  _element_id);
  url.addParam("parent_view",  parent_view);

  /*window["callback_"+ex_class_id] = function(){
    ExObject.register(_element_id, {
      ex_class_id: ex_class_id, 
      object_guid: object_guid, 
      event: event, 
      _element_id: _element_id
    });
  }*/
    
  var _popup = true;//Control.Overlay.container && Control.Overlay.container.visible();

  ajax_container = null;
  
  if (ajax_container) {
    url.requestUpdate(ajax_container);
    return;
  }
  
  if (_popup) {
    url.popup("100%", "100%", title);
  }
  else {
    url.modal();
  }
}
