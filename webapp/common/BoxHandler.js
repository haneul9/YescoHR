sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
  ],
  (
    // prettier 방지용 주석
    BaseObject
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.common.BoxHandler', {
      /**
       * @override
       */
      constructor: function ({ oController, oViewModel }) {
        this.oController = oController;
        this.oViewModel = oViewModel;

        this.init();
      },

      init() {},

      setController(oController) {
        this.oController = oController;
      },

      getController() {
        return this.oController;
      },

      setViewModel(oViewModel) {
        this.oViewModel = oViewModel;
      },

      getViewModel() {
        return this.oViewModel;
      },

      setBusy(sPath = '/busy', bBusy) {
        setTimeout(() => {
          if (this.oViewModel) {
            this.oViewModel.setProperty(sPath, bBusy);
          }
        });
      },

      onPressIcon() {},
    });
  }
);
