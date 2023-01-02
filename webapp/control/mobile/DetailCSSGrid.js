sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/layout/cssgrid/CSSGrid',
  ],
  (
    // prettier 방지용 주석
    CSSGrid
  ) => {
    'use strict';

    return CSSGrid.extend('sap.ui.yesco.control.mobile.DetailCSSGrid', {
      renderer: {},

      constructor: function (...aArgs) {
        CSSGrid.apply(this, aArgs);

        this.setGridGap('16px 0') // prettier 방지용 주석
          .addStyleClass('form-grid');
      },
    });
  }
);
