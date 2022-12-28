sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/exceptions/UI5Error',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Debuggable,
    UI5Error
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.common.approvalRequest.BoxHandler', {
      constructor: function (oController) {
        this.oController = oController;
        this.oBoxModel = oController.getViewModel();

        this.onInit();
      },

      /**
       * @abstract
       */
      onInit() {},

      getReadDataServiceName() {
        // {common.approvalRequest.SearchBoxHandler} {getReadDataServiceName} function을 구현하세요.
        throw new UI5Error({ message: AppUtils.getBundleText('MSG_APRV001', 'common.approvalRequest.SearchBoxHandler', 'getReadDataServiceName') });
      },

      getReadDataEntitySetName() {
        // {common.approvalRequest.SearchBoxHandler} {getReadDataEntitySetName} function을 구현하세요.
        throw new UI5Error({ message: AppUtils.getBundleText('MSG_APRV001', 'common.approvalRequest.SearchBoxHandler', 'getReadDataEntitySetName') });
      },

      getReadDataFilterMap() {
        // {common.approvalRequest.SearchBoxHandler} {getReadDataFilterMap} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.SearchBoxHandler', 'getReadDataFilterMap'));
        return {};
      },

      onPressIcon() {},

      _setBusy(bBusy = true, sPath) {
        setTimeout(() => {
          this.oBoxModel.setProperty(sPath, bBusy);
        });
        return this;
      },
    });
  }
);
