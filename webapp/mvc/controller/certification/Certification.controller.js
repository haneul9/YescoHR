sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils,
    FragmentEvent,
    TableUtils,
    TextUtils,
    ServiceNames,
    ODataReadError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.certification.Certification', {
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const dDate = new Date();
        const oViewModel = new JSONModel({
          busy: false,
          Data: [],
          LoanType: [],
          TargetCode: {},
          parameters: {},
          search: {
            date: new Date(),
            secondDate: new Date(dDate.getFullYear(), 0, 1),
          },
          listInfo: {
            isShowProgress: true,
            isShowApply: true,
            isShowApprove: true,
            isShowReject: true,
            isShowComplete: true,
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
        });
        this.setViewModel(oViewModel);
      },

      async onObjectMatched() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const aTableList = await this.tableList();

          oListModel.setProperty('/List', aTableList);

          // const aMyCertiList = await this.totalCount();

          // oListModel.setProperty('/Total', aMyCertiList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onClick() {
        this.getRouter().navTo('certification-detail', { oDataKey: 'N' });
      },

      tableList() {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.PA);
          const oListModel = this.getViewModel();
          const oSearch = oListModel.getProperty('/search');
          const dDate = moment(oSearch.secondDate).hours(9).toDate();
          const dDate2 = moment(oSearch.date).hours(9).toDate();
          const sMenid = this.getCurrentMenuId();

          oModel.read('/CertificateApplSet', {
            filters: [new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'), new sap.ui.model.Filter('Menid', sap.ui.model.FilterOperator.EQ, sMenid), new sap.ui.model.Filter('Apbeg', sap.ui.model.FilterOperator.EQ, dDate), new sap.ui.model.Filter('Apend', sap.ui.model.FilterOperator.EQ, dDate2)],
            success: (oData) => {
              if (oData) {
                const oTable = this.byId('certiTable');
                const aList = oData.results;

                oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aList }));
                oListModel.setProperty('/listInfo/infoMessage', this.getBundleText('MSG_17001'));
                oListModel.setProperty('/listInfo/isShowProgress', false);
                oListModel.setProperty('/listInfo/isShowApply', true);
                oListModel.setProperty('/listInfo/isShowApprove', false);
                oListModel.setProperty('/listInfo/isShowReject', false);
                oListModel.setProperty('/listInfo/isShowComplete', true);
                resolve(aList);
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const aTableList = await this.tableList();

          oListModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      totalCount() {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.PA);

          oModel.read('/MedExpenseMymedSet', {
            filters: [],
            success: (oData) => {
              if (oData) {
                resolve(oData.results);
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);

        oListModel.setProperty('/parameters', oRowData);
        this.getRouter().navTo('certification-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('certiTable');
        const aTableData = this.getViewModel().getProperty('/ZappStatAl');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_17001');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
