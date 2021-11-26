sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/MessageToast',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    MessageToast,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.zample.DonutChart', {
      onSelectionChanged(oEvent) {
        var oSegment = oEvent.getParameter('segment');
        MessageToast.show('The selection changed: ' + oSegment.getLabel() + ' ' + (oSegment.getSelected() ? 'selected' : 'not selected'));
      },
    });
  }
);
