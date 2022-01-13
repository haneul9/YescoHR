sap.ui.define(
  [
    'sap/m/FlexBox', //
  ],
  function (FlexBox) {
    'use strict';

    return FlexBox.extend('sap.ui.yesco.control.DayBox', {
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
          return fnClick(this);
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
