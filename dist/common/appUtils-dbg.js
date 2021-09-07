sap.ui.define([], function () {
  'use strict';

  return {
    getDevice() {
      return sap.ui.Device.system.desktop === true
        ? sap.ui.Device.system.SYSTEMTYPE.DESKTOP
        : sap.ui.Device.system.phone === true
        ? sap.ui.Device.system.SYSTEMTYPE.PHONE
        : sap.ui.Device.system.tablet === true
        ? sap.ui.Device.system.SYSTEMTYPE.PHONE
        : '';
    },

    log(...args) {
      setTimeout(function () {
        if (typeof console !== 'undefined' && typeof console.log === 'function') {
          console.log(args);
        }
      }, 0);
    },
  };
});
