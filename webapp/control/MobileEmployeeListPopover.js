sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/PlacementType',
    'sap/m/Popover',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    PlacementType,
    Popover,
    AppUtils
  ) => {
    'use strict';

    return Popover.extend('sap.ui.yesco.control.MobileEmployeeListPopover', {
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

        this.bindProperty('busy', '{busy}')
          .setBusyIndicatorDelay(0)
          .setModal(true) //
          .setPlacement(PlacementType.Top)
          .setShowArrow(false)
          .setShowHeader(false)
          .setHorizontalScrolling(false)
          .setVerticalScrolling(false)
          .addStyleClass('half-popover');

        this.oPopup.setAutoClose(false);
      },
    });
  }
);
