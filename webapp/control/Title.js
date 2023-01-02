sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Title',
    'sap/ui/core/TitleLevel',
  ],
  (
    // prettier 방지용 주석
    Title,
    TitleLevel
  ) => {
    'use strict';

    return Title.extend('sap.ui.yesco.control.Title', {
      renderer: {},

      constructor: function (...aArgs) {
        Title.apply(this, aArgs);

        this.setLevel(TitleLevel.H2);
      },
    });
  }
);
