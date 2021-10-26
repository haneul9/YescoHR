sap.ui.define(
  [
    // prettier 방지용 주석
  ],
  () => {
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

      setAppBusy(state, oController) {
        setTimeout(() => {
          oController.getModel('app').setProperty('/busy', state);
        }, 0);
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

      parseError(oError) {
        if (!oError || !oError.response || !oError.response.body) {
          throw new Error('AppUtils.parseError : 에러 데이터 오류!');
        }

        try {
          if (oError.response.statusCode && oError.response.statusCode === 503) {
            return {
              code: 'E',
              message: 'Session expired.\nPlease refresh and try again.',
            };
          }

          const mErrorData = {
            code: 'E',
          };
          const errorJSON = JSON.parse(oError.response.body);

          if (errorJSON.error.innererror.errordetails && errorJSON.error.innererror.errordetails.length) {
            mErrorData.message = errorJSON.error.innererror.errordetails[0].message;
          } else if (errorJSON.error.message) {
            mErrorData.message = errorJSON.error.message.value;
          } else {
            mErrorData.message = 'Unkown error.';
          }
          return mErrorData;
        } catch (ex) {
          return {
            code: 'E',
            message: oError.message,
          };
        }
      },

      debug(...args) {
        setTimeout(() => console.log(...args), 0);
      },
    };
  }
);
