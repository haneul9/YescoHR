sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AttachFileAction,
    EmpInfo,
    FragmentEvent,
    TableUtils,
    TextUtils,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.studentFunds.StudentFunds', {
      TYPE_CODE: 'HR02',

      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const dDate = new Date();
        const oViewModel = new JSONModel({
          busy: false,
          Data: [],
          searchDate: {
            date: dDate,
            secondDate: new Date(dDate.getFullYear(), dDate.getMonth() - 1, dDate.getDate() + 1),
          },
          listInfo: {
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

        EmpInfo.get.call(this, true);
      },

      onAfterShow() {
        this.onSearch();
        this.totalCount();
        this.onPageLoaded();
      },

      onClick() {
        this.getRouter().navTo('studentFunds-detail', { oDataKey: 'N' });
      },

      formatNumber(vNum = '0') {
        return vNum;
      },

      formatPay(vPay = '0') {
        return vPay === '0' ? parseInt(vPay) : `${parseInt(vPay)}${this.getBundleText('LABEL_00158')}`;
      },

      thisYear(sYear = String(moment().format('YYYY'))) {
        return this.getBundleText('MSG_03012', sYear);
      },

      onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();
        const oTable = this.byId('studentTable');
        const oSearchDate = oListModel.getProperty('/searchDate');
        const dDate = moment(oSearchDate.secondDate).hours(10).toDate();
        const dDate2 = moment(oSearchDate.date).hours(10).toDate();

        oListModel.setProperty('/busy', true);

        oModel.read('/SchExpenseApplSet', {
          filters: [
            new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'),
            new sap.ui.model.Filter('Actty', sap.ui.model.FilterOperator.EQ, 'E'),
            new sap.ui.model.Filter('Apbeg', sap.ui.model.FilterOperator.EQ, dDate),
            new sap.ui.model.Filter('Apend', sap.ui.model.FilterOperator.EQ, dDate2),
          ],
          success: (oData) => {
            if (oData) {
              const oList = oData.results;

              oListModel.setProperty('/StudentList', oList);

              setTimeout(() => {
                oListModel.setProperty('/listInfo', TableUtils.count({ oTable, mRowData: oList }));
                oListModel.setProperty('/busy', false);
              }, 100);
            }
          },
          error: (oError) => {
            this.debug(oError);
            oListModel.setProperty('/busy', false);
          },
        });
      },

      totalCount() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();

        oModel.read('/SchExpenseMyschSet', {
          filters: [],
          success: (oData) => {
            if (oData) {
              const oList = oData.results[0];
              const sYear = oList.Zyear;

              oList.Zbetrg = oList.Zbetrg.replace(/\./g, '');
              oList.Zyear = sYear === '0000' ? moment().format('YYYY') : sYear;

              oListModel.setProperty('/Total', oList);
            }
          },
          error: (oError) => {
            this.debug(oError);
          },
        });
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getRouter().navTo('studentFunds-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('studentTable');
        const mTableData = this.getViewModel().getProperty('/StudentList');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_03028');

        TableUtils.export({ oTable, mTableData, sFileName });
      },
    });
  }
);
