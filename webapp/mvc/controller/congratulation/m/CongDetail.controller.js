sap.ui.define(
    [
      // prettier 방지용 주석
      'sap/ui/yesco/mvc/controller/BaseController',
      'sap/ui/yesco/mvc/model/ODataDate', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
    ],
    (
      BaseController,
    ) => {
      'use strict';
  
      return BaseController.extend('sap.ui.yesco.mvc.controller.congratulation.m.CongDetail', {

      });
    }
);