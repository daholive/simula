Configuration = {
  edit: function(module, inherit, container) {
    var url = new Url("system", "ajax_edit_configuration");

    if (module) {
      url.addParam("module", module);
    }

    if (inherit) {
      url.addParam("inherit", inherit);
    }

    if (container = $(container)) {
      url.requestUpdate(container);
    }
    else {
      url.requestModal(950, 700);
    }
  }
};
