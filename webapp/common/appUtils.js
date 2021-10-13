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
     * @description localhost인 경우 ui5.yaml에 세팅된 proxy server를 경유하여 SAP로 요청이 들어가야하므로 /sap/opu/odata/sap/ 앞에 /proxy를 붙여야하는데
     *              Component.js metadata에 properties를 추가하여 값을 불러옴
     */
    getServiceUrl(sServiceName, oUIComponent) {
      /*
      try {
        this.debug(oUIComponent.getMetadata().getProperties()); // { urlPrefix: P {name: 'urlPrefix', type: 'string', group: 'Misc', defaultValue: '/proxy/sap/opu/odata/sap/', bindable: false, …} }
        this.debug(oUIComponent.getUrlPrefix()); // '/proxy/sap/opu/odata/sap/'
      } catch (e) {}
      */
      const sUrlPrefix = oUIComponent.getUrlPrefix();
      return sUrlPrefix + (sServiceName || '').replace(/^[/\s]+/, '');
    },

    debug(...args) {
      setTimeout(() => console.log(...args), 0);
    },
  };
});
