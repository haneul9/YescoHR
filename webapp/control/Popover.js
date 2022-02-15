sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Popover',
  ],
  (
    // prettier 방지용 주석
    Popover
  ) => {
    'use strict';

    return Popover.extend('sap.ui.yesco.control.Popover', {
      metadata: {
        properties: {
          maxRows: { type: 'int', defaultValue: 5 },
        },
        events: {
          scroll: {},
        },
      },

      renderer: {},

      init(...aArgs) {
        Popover.prototype.init.apply(this, aArgs);

        this.oPopup.setAutoClose(false);
      },

      onAfterRendering(...aArgs) {
        Popover.prototype.onAfterRendering.apply(this, aArgs);

        const iMaxRows = this.getMaxRows();
        this.$('cont')
          .toggleClass(`max-${iMaxRows}-rows`, true)[0]
          .addEventListener('scroll', _.throttle(this.fireScroll.bind(this), 1000));
      },

      isScrollBottom() {
        const oPopoverScroll = this.$('cont')[0];
        const iScrollMarginBottom = oPopoverScroll.scrollHeight - oPopoverScroll.scrollTop;
        const iGrowHeight = this.getMaxRows() * 69;

        return oPopoverScroll.scrollTop > 0 && iScrollMarginBottom === iGrowHeight;
      },
    });
  }
);
