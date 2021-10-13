sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/UIComponent',
    'sap/ui/Device',
    'sap/ui/model/odata/v2/ODataModel',
    'sap/ui/yesco/common/AppUtils',
    './model/models',
    './controller/ErrorHandler',
    './controller/ListSelector',
  ],
  (
    // prettier 방지용 주석
    UIComponent,
    Device,
    ODataModel,
    AppUtils,
    models,
    ErrorHandler,
    ListSelector
  ) => {
    'use strict';

    const urlPrefix = (window.location.hostname === 'localhost' ? '/proxy' : '') + '/sap/opu/odata/sap/';

    return UIComponent.extend('sap.ui.yesco.Component', {
      metadata: {
        manifest: 'json',
        properties: {
          urlPrefix: {
            name: 'urlPrefix',
            type: 'string',
            defaultValue: urlPrefix,
          },
          odataServiceNames: {
            name: 'odataServiceNames',
            type: 'array',
            defaultValue: [
              // prettier 방지용 주석
              { serviceName: 'ZHR_COMMON_SRV' },
              { serviceName: 'ZHR_BENEFIT_SRV', modelName: 'benefit' },
            ],
          },
        },
      },

      /**
       * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
       * In this method, the device models are set and the router is initialized.
       * @public
       * @override
       */
      init(...args) {
        // set the device model
        this.setModel(models.createDeviceModel(), 'device');

        // model preload
        const aServiceNames = this.getOdataServiceNames();
        aServiceNames.forEach(({ serviceName: sServiceName, modelName: sModelName }) => {
          const sServiceUrl = AppUtils.getServiceUrl(sServiceName, this);
          this.setModel(new ODataModel(sServiceUrl), sModelName);
        });

        this.oListSelector = new ListSelector();
        this._oErrorHandler = new ErrorHandler(this);

        // call the base component's init function and create the App view
        UIComponent.prototype.init.apply(this, args);

        // create the views based on the url/hash
        this.getRouter().initialize();
      },

      /**
       * The component is destroyed by UI5 automatically.
       * In this method, the ListSelector and ErrorHandler are destroyed.
       * @public
       * @override
       */
      destroy(...args) {
        this.oListSelector.destroy();
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
