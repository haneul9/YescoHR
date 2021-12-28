sap.ui.define(['sap/m/Input'], function (Input) {
  'use strict';

  return Input.extend('sap.ui.yesco.control.NumberInput', {
    metadata: {
      properties: {
        type: {
          defaultValue: 'Number',
        },
      },
      aggregations: {},
      events: {},
    },

    init: function () {
      this.attachBrowserEvent('mousewheel', (oEvent) => oEvent.preventDefault());

      if (sap.ui.core.Control.prototype.init) {
        sap.ui.core.Control.prototype.init.apply(this, arguments); //run the super class's method first
      }
    },

    renderer: function (oRM, oControl) {
      sap.m.InputRenderer.render(oRM, oControl);
    },
  });
});
