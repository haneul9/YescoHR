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

    return Popover.extend('sap.ui.yesco.common.Popover', {
      renderer: {},

      init(...aArgs) {
        Popover.prototype.init.apply(this, aArgs);

        this.oPopup.setAutoClose(false);
      },
    });
  }
);
