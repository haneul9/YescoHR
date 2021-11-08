sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/Device',
    'sap/ui/core/UIComponent',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceManager',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/controller/ErrorHandler',
    'sap/ui/yesco/model/models',
  ],
  (
    // prettier 방지용 주석
    Device,
    UIComponent,
    JSONModel,
    AppUtils,
    ServiceManager,
    ServiceNames,
    ErrorHandler,
    models
  ) => {
    'use strict';

    // class Component extends UIComponent 선언으로 실행하면 new 키워드 사용없이 invoke 할 수 없다는 에러가 발생함
    return UIComponent.extend('sap.ui.yesco.Component', {
      metadata: {
        manifest: 'json',
      },

      /**
       * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
       * In this method, the device models are set and the router is initialized.
       * @public
       * @override
       */
      init(...args) {
        // set the device model.
        this.setModel(models.createDeviceModel(), 'device');

        // set busy indicator value model.
        this.setModel(new JSONModel({ isAppBusy: true, delay: 0 }), 'appModel');

        // S4HANA odata model preload.
        const aServiceNames = ServiceManager.getServiceNames();
        aServiceNames.forEach((sServiceName) => {
          const oServiceModel = ServiceManager.getODataModel(sServiceName);
          this.setModel(oServiceModel, sServiceName);
        });

        const sUrl = '/EmpLoginInfoSet';
        this.getModel(ServiceNames.COMMON).read(sUrl, {
          success: (oData, oResponse) => {
            AppUtils.debug(`${sUrl} success.`, oData, oResponse);

            const sessionData = (oData.results || [])[0] || {};
            delete sessionData.__metadata;

            if (sessionData.Werks === '1000') {
              sessionData.Logo = 'yesco-holdings';
            } else if (sessionData.Werks === '2000') {
              sessionData.Logo = 'yesco';
            } else if (sessionData.Werks === '3000') {
              sessionData.Logo = 'hanseong';
            } else {
              sessionData.Logo = 'unknown';
            }

            this.setModel(new JSONModel(sessionData), 'sessionModel');
          },
          error: (oError) => {
            AppUtils.debug(`${sUrl} error.`, oError);

            this.setModel(new JSONModel({ Logo: 'unknown' }), 'sessionModel');
          },
        });

        this._oErrorHandler = new ErrorHandler(this);

        // call the base component's init function and create the App view
        UIComponent.prototype.init.apply(this, args);

        // create the views based on the url/hash
        this.getRouter().initialize();
      },

      /**
       * The component is destroyed by UI5 automatically.
       * In this method, the ErrorHandler are destroyed.
       * @public
       * @override
       */
      destroy(...args) {
        this._oErrorHandler.destroy();

        // call the base component's destroy function
        UIComponent.prototype.destroy.apply(this, args);
      },

      /**
       * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
       * design mode class should be set, which influences the size appearance of some controls.
       * @public
       * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
       */
      getContentDensityClass() {
        if (!Object.prototype.hasOwnProperty.call(this, '_sContentDensityClass')) {
          // check whether FLP has already set the content density class; do nothing in this case
          if (document.body.classList.contains('sapUiSizeCozy') || document.body.classList.contains('sapUiSizeCompact')) {
            this._sContentDensityClass = '';
          } else if (!Device.support.touch) {
            // apply "compact" mode if touch is not supported
            this._sContentDensityClass = 'sapUiSizeCompact';
          } else {
            // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
            this._sContentDensityClass = 'sapUiSizeCozy';
          }
        }
        return this._sContentDensityClass;
      },
    });
  }
);
