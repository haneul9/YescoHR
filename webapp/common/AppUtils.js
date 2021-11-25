sap.ui.define([], () => {
  'use strict';

  return {
    /**
     * @public
     */
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
     * @public
     */
    getAppController() {
      // <div data-sap-ui-component data-name="sap.ui.yesco" data-id="container" data-settings='{ "id": "ehr" }'></div>
      return sap.ui.getCore().getComponent('container-ehr').byId('app').getController();
    },

    /**
     * @public
     */
    getAppComponent() {
      return sap.ui.getCore().getComponent('container-ehr');
    },

    /**
     * Convenience method for getting the resource bundle text.
     * @public
     * @returns {string} The value belonging to the key, if found; otherwise the key itself.
     */
    getBundleText(...aArgs) {
      return this.getAppComponent().getBundleText(...aArgs);
    },

    /**
     * @public
     */
    setAppBusy(state) {
      setTimeout(() => {
        this.getAppComponent().getAppModel().setProperty('/isAppBusy', state);
      });
      return this;
    },

    /**
     * @public
     */
    setMenuBusy(state) {
      setTimeout(() => {
        this.getAppComponent().getAppModel().setProperty('/isMenuBusy', state);
      });
      return this;
    },

    /**
     * @public
     */
    setAtHome(state) {
      setTimeout(() => {
        this.getAppComponent().getAppModel().setProperty('/isAtHome', state);
      });
      return this;
    },

    /**
     * @public
     */
    isLOCAL() {
      return /^localhost/.test(location.hostname);
    },
    /**
     * @public
     */
    isDEV() {
      return /^yeshrsapdev/.test(location.hostname);
    },
    /**
     * @public
     */
    isQAS() {
      return /^yeshrsapqas/.test(location.hostname);
    },
    /**
     * @public
     */
    isPRD() {
      return /^yeshrsap/.test(location.hostname);
    },

    /**
     * @public
     */
    parseError(oError) {
      try {
        if (!oError || !oError.responseText) {
          throw new Error('AppUtils.parseError : 에러 데이터 오류!');
        }

        if (oError.statusCode && oError.statusCode === 503) {
          return {
            code: 'E',
            message: 'Session expired.\nPlease refresh and try again.',
          };
        }

        const mErrorData = {
          code: 'E',
        };
        const errorJSON = JSON.parse(oError.responseText);

        if (errorJSON.error.innererror.errordetails && errorJSON.error.innererror.errordetails.length) {
          // mErrorData.code = errorJSON.error.code;
          mErrorData.message = errorJSON.error.innererror.errordetails[0].message;
        } else if (errorJSON.error.message) {
          mErrorData.code = 'I';
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

    /**
     * @param {any[]}
     * @public
     */
    debug(...args) {
      setTimeout(() => console.log(...args));
      return this;
    },
  };
});
