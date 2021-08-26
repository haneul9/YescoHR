sap.ui.define([], function () {
  'use strict';

  return {
    getDevice: function () {
      return sap.ui.Device.system.desktop === true
        ? sap.ui.Device.system.SYSTEMTYPE.DESKTOP
        : sap.ui.Device.system.phone === true
        ? sap.ui.Device.system.SYSTEMTYPE.PHONE
        : sap.ui.Device.system.tablet === true
        ? sap.ui.Device.system.SYSTEMTYPE.PHONE
        : '';
    },
  };
});
