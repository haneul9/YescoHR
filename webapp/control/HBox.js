sap.ui.define(
  [
    'sap/m/HBox', //
  ],
  function (HBox) {
    'use strict';

    return HBox.extend('sap.ui.yesco.control.HBox', {
      metadata: {
        properties: {
          click: { type: 'function' },
          mouseover: { type: 'function' },
          mouseout: { type: 'function' },
        },
      },

      renderer: {},

      onclick() {
        const fnClick = this.getClick();

        if (fnClick instanceof Function) {
          return fnClick.apply(this, arguments);
        }
      },

      onmouseover() {
        const fnMouseover = this.getMouseover();

        if (fnMouseover instanceof Function) {
          return fnMouseover(this);
        }
      },

      onmouseout() {
        const fnMouseout = this.getMouseout();

        if (fnMouseout instanceof Function) {
          return fnMouseout(this);
        }
      },
    });
  }
);
