sap.ui.define(
  [
    'sap/m/FlexBox', //
  ],
  function (FlexBox) {
    'use strict';

    return FlexBox.extend('sap.ui.yesco.control.DayBox', {
      metadata: {
        properties: {
          mouseover: { type: 'function' },
          mouseout: { type: 'function' },
        },
      },

      renderer: {},

      onmouseover(oEvent) {
        const fnMouseover = this.getMouseover();

        if (fnMouseover instanceof Function) {
          return fnMouseover(oEvent);
        }
      },

      onmouseout(oEvent) {
        const fnMouseout = this.getMouseout();

        if (fnMouseout instanceof Function) {
          return fnMouseout(oEvent);
        }
      },
    });
  }
);
