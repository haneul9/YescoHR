sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/model/json/JSONModel',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    JSONModel
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.common.BoxHandler', {
      /**
       * @override
       */
      constructor: function (oController, sRequestListTableId) {
        this.oController = oController;
        this.oBoxModel = new JSONModel();

        this.init(sRequestListTableId);
      },

      /**
       * @abstract
       */
      init() {},

      /**
       * @abstract
       */
      onPressIcon() {},

      setController(oController) {
        this.oController = oController;
        return this;
      },

      getController() {
        return this.oController;
      },

      setBoxModel(oBoxModel) {
        this.oBoxModel = oBoxModel;
        return this;
      },

      getBoxModel() {
        return this.oBoxModel;
      },

      setBusy(bBusy = true, sPath = '/busy') {
        setTimeout(() => {
          this.oBoxModel.setProperty(sPath, bBusy);
        });
        return this;
      },
    });
  }
);
