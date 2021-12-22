sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils,
    Client,
    ServiceNames,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.performance.List', {
      APPRAISER_TYPE: { performance: 'ME', performanceEvalPry: 'MA', performanceEvalSry: 'MB' },

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          type: '',
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
          oViewModel.setProperty('/type', this.APPRAISER_TYPE[this.getRouter().getHashChanger().getHash()]);

          const aTableData = await Client.getEntitySet(oModel, 'AppraisalPeeList', { Menid: this.getCurrentMenuId(), Prcty: 'L', Werks: this.getAppointeeProperty('Werks'), Zzappgb: 'ME', Zzappee: this.getAppointeeProperty('Pernr') });

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
        const sType = oViewModel.getProperty('/type');

        if (oRowData.Zzapsts === '2') {
          if (oRowData.ZzapstsSub === 'A') {
            return;
          } else if (oRowData.ZzapstsSub === 'B') {
            if (sType !== this.APPRAISER_TYPE.performance) return;
          } else if (oRowData.ZzapstsSub === 'C') {
            if (sType === this.APPRAISER_TYPE.performanceEvalSry) return;
          }
        }

        oViewModel.setProperty('/parameter/rowData', { ...oRowData });
        this.getRouter().navTo('performance-detail', { type: sType, year: _.chain(oRowData.Zperiod).split('.', 1).head().value() });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
