sap.ui.define(['sap/m/Label'], function (Label) {
  'use strict';

  return Label.extend('sap.ui.yesco.control.TopMenuItem', {
    metadata: {
      events: {
        hover: {},
        leave: {},
      },
    },
    onmouseover: function (oEvent) {
      this.fireHover(oEvent);
    },
    onmouseout: function (oEvent) {
      this.fireLeave(oEvent);
    },
    renderer: {},
  });
});
