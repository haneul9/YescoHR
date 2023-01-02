sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/List',
  ],
  (
    // prettier 방지용 주석
    List
  ) => {
    'use strict';

    return List.extend('sap.ui.yesco.control.mobile.List', {
      renderer: {},

      constructor: function (...aArgs) {
        List.apply(this, aArgs);

        this.setBusyIndicatorDelay(0) // prettier 방지용 주석
          .bindProperty('busy', '/busy')
          .addStyleClass('list-wrap wrap');
      },
    });
  }
);
