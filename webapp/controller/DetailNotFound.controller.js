sap.ui.define(
  [
    'sap/ui/yesco/controller/BaseController', // prettier 방지용 주석
  ],
  (
    BaseController // prettier 방지용 주석
  ) => {
    'use strict';

    // return BaseController.extend('sap.ui.yesco.controller.DetailNotFound', {});
    class DetailNotFound extends BaseController {}

    return DetailNotFound;
  }
);
