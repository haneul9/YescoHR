sap.ui.define([], function () {
  'use strict';

  return {
    getDevice() {
      return sap.ui.Device.system.desktop === true // prettier 방지용 주석
        ? sap.ui.Device.system.SYSTEMTYPE.DESKTOP
        : sap.ui.Device.system.phone === true
        ? sap.ui.Device.system.SYSTEMTYPE.PHONE
        : sap.ui.Device.system.tablet === true
        ? sap.ui.Device.system.SYSTEMTYPE.PHONE
        : '';
    },

    /**
     * Service URL for Model
     * @public
     * @param {string} sServiceName the service name. e.g. ZHR_COMMON_SRV
     * @param {object} oUIComponent component object
     * @returns {string} the service URL. e.g. /sap/opu/odata/sap/ZHR_COMMON_SRV
     */
    getServiceUrl(sServiceName, oUIComponent) {
      const oUrlPrefix = oUIComponent.getMetadata().getConfig().urlPrefix;
      const sUrlPrefix = (window.location.hostname === 'localhost' ? oUrlPrefix.local : '') + oUrlPrefix.SICF;

      return sUrlPrefix + (sServiceName || '').replace(/^[/\s]+/, '');
    },

    debug(...args) {
      setTimeout(() => console.log(...args), 0);
    },
  };
});
