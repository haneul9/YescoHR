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
        events: {
          scroll: {},
        },
      },

      renderer: {},

      init(...aArgs) {
        Popover.prototype.init.apply(this, aArgs);

        this.oPopup.setAutoClose(false);
      },

      onAfterRendering() {
        Popover.prototype.init.apply(this);

        this.$('cont')[0].addEventListener(
          'scroll',
          _.throttle((oEvent) => {
            this.fireScroll(oEvent);
          }, 1000)
        );
      },
    });
  }
);
