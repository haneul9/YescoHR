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
      constructor: function (controller, requestListTableId) {
        this.oController = controller;
        this.oBoxModel = new JSONModel();

        this.init(requestListTableId);
      },

      /**
       * @abstract
       */
      init() {},

      /**
       * @abstract
       */
      onPressIcon() {},

      setController(controller) {
        this.oController = controller;
        return this;
      },

      getController() {
        return this.oController;
      },

      setBoxModel(boxModel) {
        this.oBoxModel = boxModel;
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
