sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/performance/constant/Constants',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
    'sap/ui/yesco/mvc/model/type/Pernr',
    'sap/ui/yesco/mvc/model/type/Decimal',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
    TableUtils,
    BaseController,
    Constants
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.performance.Grade', {
      initializeModel() {
        return {
          busy: false,
          type: '',
          listInfo: {
            rowCount: 1,
          },
          list: [],
          parameter: {
            rowData: {},
          },
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        try {
          const aRowData = await Client.getEntitySet(this.getModel(ServiceNames.APPRAISAL), 'Appraisal2GradeList', {
            Prcty: Constants.PROCESS_TYPE.LIST.code,
            Zzappgb: Constants.APPRAISER_TYPE.MB,
            Menid: this.getCurrentMenuId(),
            Werks: this.getAppointeeProperty('Werks'),
          });

          this.setTableData({ oViewModel, aRowData });
        } catch (oError) {
          this.debug(`Controller > m/performanceGrade Grade > onObjectMatched Error`, oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTableData({ oViewModel, aRowData }) {
        const oTable = this.byId('gradeTable');

        oViewModel.setProperty('/list', aRowData);
        oViewModel.setProperty('/listInfo/rowCount', _.get(TableUtils.count({ oTable, aRowData }), 'rowCount', 1));
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = oViewModel.getProperty(sPath);
        const sType = oViewModel.getProperty('/type');
        const sDetailRoute = _.get(Constants.LIST_PAGE, [sType, 'detail']);

        if (!_.isEqual(oRowData.Godetl, 'X')) {
          MessageBox.alert(this.getBundleText('MSG_10006')); // 현재 평가상태에서는 상세내역을 조회하실 수 없습니다.
          return;
        }

        oViewModel.setProperty('/parameter/rowData', { ...oRowData });
        this.getRouter().navTo(sDetailRoute, { sType, sYear: _.chain(oRowData.Zperiod).split('.', 1).head().value() });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
