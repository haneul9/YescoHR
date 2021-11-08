sap.ui.define([], () => {
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
        oController.getModel('appModel').setProperty('/isAppBusy', state);
      }, 0);
      return this;
    },

    setMenuBusy(state, oController) {
      setTimeout(() => {
        oController.getModel('appModel').setProperty('/isMenuBusy', state);
      }, 0);
      return this;
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
      setTimeout(() => console.log(...args));
      return this;
    },
  };
});
