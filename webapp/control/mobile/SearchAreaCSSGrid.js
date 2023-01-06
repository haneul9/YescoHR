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

    return CSSGrid.extend('sap.ui.yesco.control.mobile.SearchAreaCSSGrid', {
      metadata: {
        properties: {
          rowCount: { type: 'int', group: 'Misc', defaultValue: 1 },
        },
      },

      renderer: {},

      constructor: function (...aArgs) {
        CSSGrid.apply(this, aArgs);

        const iRowCount = this.getRowCount();

        this.setGridGap('16px 8px') // prettier 방지용 주석
          .addStyleClass('complex-search')
          .setLayoutData(new FlexItemData({ styleClass: `search-area row-${iRowCount}` }));
      },
    });
  }
);
