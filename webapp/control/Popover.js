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
          growCount: { type: 'int', defaultValue: 5 },
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

        const iGrowCount = this.getGrowCount();
        this.addStyleClass(`max-${iGrowCount}-rows`);

        this.$('cont')[0].addEventListener('scroll', _.throttle(this.fireScroll.bind(this), 1000));
      },
    });
  }
);
