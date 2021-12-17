sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    AppUtils,
    ODataReadError,
    ServiceNames,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.performance.List', {
      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          listInfo: {
            rowCount: 1,
          },
          list: [],
          parameter: {
            rowData: {},
          },
        });
        this.setViewModel(oViewModel);
      },

      async onObjectMatched() {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const aTableData = await this.readAppraisalPeeList({ oModel });

          this.setTableData({ oViewModel, aTableData });
        } catch (oError) {
          this.debug('Controller > Performance List > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTableData({ oViewModel, aTableData }) {
        const oTable = this.byId('performanceTable');

        oViewModel.setProperty('/list', [...aTableData]);
        oViewModel.setProperty('/listInfo/rowCount', TableUtils.count({ oTable, aRowData: aTableData }).rowCount);
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = oViewModel.getProperty(sPath);

        oViewModel.setProperty('/parameter/rowData', { ...oRowData });
        this.getRouter().navTo('performance-detail', { pid: oRowData.Zzappid, docid: oRowData.Zdocid, partid: oRowData.Partid });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
      /**
       * @param  {JSONModel} oModel
       */
      readAppraisalPeeList({ oModel }) {
        const mAppointee = this.getAppointeeData();
        const sMenid = this.getCurrentMenuId();
        const sUrl = '/AppraisalPeeListSet';

        return new Promise((resolve, reject) => {
          oModel.read(sUrl, {
            filters: [
              new Filter('Menid', FilterOperator.EQ, sMenid), //
              new Filter('Prcty', FilterOperator.EQ, 'L'),
              new Filter('Werks', FilterOperator.EQ, mAppointee.Werks),
              new Filter('Zzappgb', FilterOperator.EQ, 'ME'),
              new Filter('Zzappee', FilterOperator.EQ, mAppointee.Pernr),
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results ?? []);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },
    });
  }
);
