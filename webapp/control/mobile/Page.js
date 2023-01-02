sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Page',
  ],
  (
    // prettier 방지용 주석
    Page
  ) => {
    'use strict';

    return Page.extend('sap.ui.yesco.control.mobile.Page', {
      renderer: {},

      constructor: function (...aArgs) {
        Page.apply(this, aArgs);

        this.bindProperty('title', 'menuModel>/current/currentLocationText') // prettier 방지용 주석
          .bindProperty('showNavButton', 'menuModel>/current/hasPrevious')
          .setProperty('enableScrolling', false)
          .addStyleClass('approval-request-detail');
      },
    });
  }
);
