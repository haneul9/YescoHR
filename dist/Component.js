sap.ui.define(['sap/ui/core/UIComponent', 'sap/ui/Device', './model/models', './controller/ListSelector', './controller/ErrorHandler', 'sap/ui/model/odata/v2/ODataModel'], (t, e, s, o, i, n) => {
  'use strict';
  return t.extend('sap.ui.yesco.Component', {
    metadata: { manifest: 'json' },
    init() {
      this.setModel(s.createDeviceModel(), 'device');
      var e = this.getMetadata().getConfig();
      var a = new n(e.commonLocal);
      this.setModel(a);
      this.oListSelector = new o();
      this._oErrorHandler = new i(this);
      t.prototype.init.apply(this, arguments);
      this.getRouter().initialize();
    },
    destroy() {
      this.oListSelector.destroy();
      this._oErrorHandler.destroy();
      t.prototype.destroy.apply(this, arguments);
    },
    getContentDensityClass() {
      if (!Object.prototype.hasOwnProperty.call(this, '_sContentDensityClass')) {
        if (document.body.classList.contains('sapUiSizeCozy') || document.body.classList.contains('sapUiSizeCompact')) {
          this._sContentDensityClass = '';
        } else if (!e.support.touch) {
          this._sContentDensityClass = 'sapUiSizeCompact';
        } else {
          this._sContentDensityClass = 'sapUiSizeCozy';
        }
      }
      return this._sContentDensityClass;
    },
  });
});
