sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/Button',
    'sap/m/ButtonType',
    'sap/m/OverflowToolbarLayoutData',
    'sap/m/OverflowToolbarPriority',
  ],
  (
    // prettier 방지용 주석
    Button,
    ButtonType,
    OverflowToolbarLayoutData,
    OverflowToolbarPriority
  ) => {
    'use strict';

    return Button.extend('sap.ui.yesco.control.HomeMenuItemTest', {
      constructor: function (...args) {
        Button.apply(this, args);

        this.submenuPopover = false;

        this.setType(ButtonType.Transparent);
        this.setLayoutData(
          new OverflowToolbarLayoutData({
            priority: OverflowToolbarPriority.Low,
          })
        );

        const menuProperties = this.data('menuProperties');
        if (menuProperties.Mnnm1 === 'MSS') {
          this.addStyleClass('px-5-px font-bold menu-mss');
        } else if (menuProperties.Mnnm1 === 'HASS') {
          this.addStyleClass('px-5-px font-bold menu-hass');
        } else {
          this.addStyleClass('px-5-px font-bold');
        }
      },

      onmouseover(oEvent) {
        console.log('sap.ui.yesco.control.HomeMenuItemTest.onmouseover', this.data('menuProperties'), oEvent);
      },

      onmouseout(oEvent) {
        console.log('sap.ui.yesco.control.HomeMenuItemTest.onmouseout', this.data('menuProperties'), oEvent);
      },
    });
  }
);
