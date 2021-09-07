sap.ui.define(
  [
    'sap/ui/yesco/controller/BaseController', // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
  ],
  (
    BaseController, // prettier 방지용 주석
    Filter,
    FilterOperator
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.controller.Home', {
      onInit() {
        const oModel = this.getOwnerComponent().getModel();

        oModel.read('/EmpLoginInfoSet', {
          filters: [
            new Filter('Pernr', FilterOperator.EQ, '1'), //
          ],
          success: (oData, response) => {
            this.debug(oData, response);
          },
          error: (oError) => {
            this.debug(oError);
          },
        });
      },

      onNavToEmployees() {
        this.getRouter().navTo('employeeList');
      },
    });
  }
);
