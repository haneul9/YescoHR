sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/FlexItemData',
    'sap/m/ScrollContainer',
  ],
  function (
    // prettier 방지용 주석
    FlexItemData,
    ScrollContainer
  ) {
    'use strict';

    return ScrollContainer.extend('sap.ui.yesco.control.mobile.ScrollContainer', {
      metadata: {
        properties: {
          headerHeight: { type: 'int', defaultValue: '0' },
          footerHeight: { type: 'int', defaultValue: '60' },
          excludeBottomSelector: { type: 'string' },
        },
      },

      renderer: {},

      constructor: function (...aArgs) {
        ScrollContainer.apply(this, aArgs);

        this.setLayoutData(new FlexItemData({ styleClass: 'contents-scroller' }))
          .setHorizontal(false)
          .setVertical(true);
      },

      onAfterRendering: function () {
        // const iExcludeHeight = this.getExcludeBottomSelector() ? $(this.getExcludeBottomSelector()).outerHeight(true) : 0;
        // const iScrollHeight = screen.availHeight - this.$().offset().top - this.getHeaderHeight() - this.getFooterHeight() - iExcludeHeight;
        // this.setHeight(`${iScrollHeight}px`);

        const sHeight = this.getHeight();
        if (!sHeight || sHeight === 'auto') {
          this.setHeight('100%');
        }
      },
    });
  }
);
