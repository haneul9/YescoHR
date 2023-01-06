sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Title',
    'sap/m/FlexItemData',
    'sap/ui/core/TitleLevel',
  ],
  (
    // prettier 방지용 주석
    Title,
    FlexItemData,
    TitleLevel
  ) => {
    'use strict';

    return Title.extend('sap.ui.yesco.control.Title', {
      metadata: {
        properties: {
          headerTitle: { type: 'boolean', group: 'Misc', defaultValue: false },
        },
      },

      renderer: {},

      constructor: function (...aArgs) {
        Title.apply(this, aArgs);

        this.setLevel(TitleLevel.H2);
        if (this.getHeaderTitle()) {
          this.setLayoutData(new FlexItemData({ styleClass: 'header-title' }));
        }
      },
    });
  }
);
