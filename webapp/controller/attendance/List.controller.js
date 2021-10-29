sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/controller/BaseController',
    '../../model/formatter',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    BaseController,
    formatter
  ) => {
    'use strict';

    class List extends BaseController {
      constructor() {
        super();

        this.formatter = formatter;
      }

      onInit() {
        const oViewModel = new JSONModel();
        oViewModel.loadData('localService/attendancedata.json');
        this.setViewModel(oViewModel);
      }
    }

    return List;
  }
);
