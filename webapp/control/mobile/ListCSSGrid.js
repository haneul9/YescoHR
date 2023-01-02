sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/FlexItemData',
    'sap/ui/layout/cssgrid/CSSGrid',
  ],
  (
    // prettier 방지용 주석
    FlexItemData,
    CSSGrid
  ) => {
    'use strict';

    return CSSGrid.extend('sap.ui.yesco.control.mobile.ListCSSGrid', {
      renderer: {},

      constructor: function (...aArgs) {
        CSSGrid.apply(this, aArgs);

        this.setGridTemplateColumns('1fr 1fr') // prettier 방지용 주석
          .setGridGap('6px 0')
          .setLayoutData(
            new FlexItemData({
              styleClass: 'approval-request-list-item-detail',
            })
          );
      },
    });
  }
);
