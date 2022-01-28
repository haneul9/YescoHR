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
    'sap/ui/yesco/mvc/model/type/Currency',
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

    return BaseController.extend('sap.ui.yesco.mvc.controller.clubJoin.ClubJoin', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const dDate = new Date();
        const oViewModel = new JSONModel({
          busy: false,
          Data: [],
          LoanType: [],
          search: {
            date: new Date(dDate.getFullYear(), 12, 0),
            secondDate: new Date(dDate.getFullYear(), 0, 1),
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
        this.totalCount();
        this.onSearch();
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR07';
      },

      onClick() {
        this.getRouter().navTo('clubJoin-detail', { oDataKey: 'N' });
      },

      thisYear(sYear = String(moment().format('YYYY'))) {
        return this.getBundleText('MSG_14001', sYear);
      },

      formatNumber(vNum = '0') {
        return parseInt(vNum);
      },

      formatPay(vPay = '0') {
        vPay = this.TextUtils.toCurrency(vPay);

        return vPay;
      },

      onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();
        const oTable = this.byId('clubTable');
        const oSearch = oListModel.getProperty('/search');
        const dDate = moment(oSearch.secondDate).hours(10).toDate();
        const dDate2 = moment(oSearch.date).hours(10).toDate();
        const sMenid = this.getCurrentMenuId();

        oListModel.setProperty('/busy', true);

        oModel.read('/ClubJoinApplSet', {
          filters: [new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'), new sap.ui.model.Filter('Menid', sap.ui.model.FilterOperator.EQ, sMenid), new sap.ui.model.Filter('Apbeg', sap.ui.model.FilterOperator.EQ, dDate), new sap.ui.model.Filter('Apend', sap.ui.model.FilterOperator.EQ, dDate2)],
          success: (oData) => {
            if (oData) {
              const oList = oData.results;

              oListModel.setProperty('/List', oList);
              oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: oList, sStatCode: 'Lnsta' }));
              oListModel.setProperty('/listInfo/Title', this.getBundleText('LABEL_14006'));
              oListModel.setProperty('/busy', false);
            }
          },
          error: (oError) => {
            this.debug(oError);
            AppUtils.handleError(new ODataReadError(oError));
            oListModel.setProperty('/busy', false);
          },
        });
      },

      totalCount() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();

        oModel.read('/ClubJoinMyclubSet', {
          filters: [],
          success: (oData) => {
            if (oData) {
              const oList = oData.results[0];

              oListModel.setProperty('/Total', oList);
            }
          },
          error: (oError) => {
            this.debug(oError);
            AppUtils.handleError(new ODataReadError(oError));
            oListModel.setProperty('/busy', false);
          },
        });
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);

        oListModel.setProperty('/parameters', oRowData);
        this.getRouter().navTo('clubJoin-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('clubTable');
        const aTableData = this.getViewModel().getProperty('/List');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_14014');

        TableUtils.export({ oTable, aTableData, sFileName, sStatCode: 'Lnsta', sStatTxt: 'Lnstatx' });
      },
    });
  }
);
