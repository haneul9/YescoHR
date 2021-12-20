sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
	AppUtils,
	AttachFileAction,
	FragmentEvent,
	TableUtils,
	TextUtils,
	ServiceNames,
	ODataReadError,
	BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.familyInfo.FamilyInfo', {
      TYPE_CODE: 'HR03',

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
      },

      onObjectMatched() {
        this.onSearch();
        this.totalCount();
      },

      onClick() {
        this.getRouter().navTo('familyInfo-detail', { oDataKey: 'N' });
      },

      formatNumber(vNum = '0') {
        return `${vNum}${this.getBundleText('LABEL_00159')}`;
      },

      formatPay(vPay = '0') {
        return `${vPay}${this.getBundleText('LABEL_00158')}`;
      },

      thisYear(sYear = String(moment().format('YYYY'))) {
        return this.getBundleText('MSG_03012', sYear);
      },

      onSearch() {
        const oModel = this.getModel(ServiceNames.PA);
        const oListModel = this.getViewModel();
        const oTable = this.byId('familyTable');
        const oSearchDate = oListModel.getProperty('/searchDate');
        const dDate = moment(oSearchDate.secondDate).hours(10).toDate();
        const dDate2 = moment(oSearchDate.date).hours(10).toDate();

        oListModel.setProperty('/busy', true);

        oModel.read('/FamilyInfoApplSet', {
          filters: [new sap.ui.model.Filter('Begda', sap.ui.model.FilterOperator.EQ, dDate), new sap.ui.model.Filter('Endda', sap.ui.model.FilterOperator.EQ, dDate2)],
          success: (oData) => {
            if (oData) {
              const oList = oData.results;

              oListModel.setProperty('/FamilyList', oList);
              oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: oList }));
              oListModel.setProperty('/busy', false);
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
            oListModel.setProperty('/busy', false);
          },
        });
      },

      totalCount() {
        const oModel = this.getModel(ServiceNames.PA);
        const oListModel = this.getViewModel();

        oModel.read('/FamInfoSummarySet', {
          filters: [],
          success: (oData) => {
            if (oData) {
              const oList = oData.results[0];

              oListModel.setProperty('/Total', oList);
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);

        oListModel.setProperty('/parameter', oRowData);
        this.getRouter().navTo('familyInfo-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('familyTable');
        const aTableData = this.getViewModel().getProperty('/FamilyList');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_05001');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
