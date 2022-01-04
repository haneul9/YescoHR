sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  function (JSONModel, AppUtils, AttachFileAction, ComboEntry, FragmentEvent, TableUtils, TextUtils, ServiceNames, ODataReadError, BaseController) {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.certification.Certification', {});
  }
);
