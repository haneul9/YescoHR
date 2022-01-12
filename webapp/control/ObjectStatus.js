sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/ObjectStatus',
  ],
  (
    // prettier 방지용 주석
    ObjectStatus
  ) => {
    'use strict';

    return ObjectStatus.extend('sap.ui.yesco.control.ObjectStatus', {
      metadata: {
        events: {
          hover: {},
        },
      },

      renderer: {},

      onmouseover() {
        this.fireHover();
      },
    });
  }
);
