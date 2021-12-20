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
  (
    // prettier 방지용 주석
    JSONModel,
	AppUtils,
	AttachFileAction,
	ComboEntry,
	FragmentEvent,
	TableUtils,
	TextUtils,
	ServiceNames,
	ODataReadError,
	BaseController,
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.housingLoan.HousingLoan', {
      TYPE_CODE: 'HR07',

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
            secondDate: new Date(dDate.getFullYear() - 11, 1, 1),
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

      async onObjectMatched() {
        this.totalCount();
        await this.getTypeCode();
        await this.onSearch();
      },

      onClick() {
        this.getRouter().navTo('housingLoan-detail', { oDataKey: 'N' });
      },

      formatNumber(vNum = '0') {
        return parseInt(vNum);
      },

      formatPay(vPay = '0') {
        vPay = this.TextUtils.toCurrency(vPay);

        return `${vPay}${this.getBundleText('LABEL_00158')}`;
      },

      onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();
        const oTable = this.byId('loanTable');
        const oSearch = oListModel.getProperty('/search');
        const dDate = moment(oSearch.secondDate).hours(10).toDate();
        const dDate2 = moment(oSearch.date).hours(10).toDate();
        const vLoanType = !oSearch.Lntyp || oSearch.Lntyp === 'ALL' ? '' : oSearch.Lntyp;
        const sMenid = this.getCurrentMenuId();

        return new Promise((resolve) => {
          oListModel.setProperty('/busy', true);

          oModel.read('/LoanAmtApplSet', {
            filters: [
              new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'),
              new sap.ui.model.Filter('Menid', sap.ui.model.FilterOperator.EQ, sMenid),
              new sap.ui.model.Filter('Apbeg', sap.ui.model.FilterOperator.EQ, dDate),
              new sap.ui.model.Filter('Apend', sap.ui.model.FilterOperator.EQ, dDate2),
              new sap.ui.model.Filter('Lntyp', sap.ui.model.FilterOperator.EQ, vLoanType),
            ],
            success: (oData) => {
              if (oData) {
                const oList = oData.results;

                oListModel.setProperty('/List', oList);
                oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: oList, sStatCode: 'Lnsta' }));
                oListModel.setProperty('/busy', false);
              }

              resolve();
            },
            error: (oError) => {
              AppUtils.handleError(new ODataReadError(oError));
              oListModel.setProperty('/busy', false);
            },
          });
        });
      },

      getTypeCode() {
        return new Promise((resolve) => {
          const oModel = this.getModel(ServiceNames.BENEFIT);
          const oListModel = this.getViewModel();
          const oSessionData = this.getOwnerComponent().getSessionModel().getData();

          oModel.read('/BenefitCodeListSet', {
            filters: [
              new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0008'),
              new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oSessionData.Werks),
              new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
              new sap.ui.model.Filter('Grcod', sap.ui.model.FilterOperator.EQ, 'BE000004'),
              new sap.ui.model.Filter('Sbcod', sap.ui.model.FilterOperator.EQ, 'GRADE'),
            ],
            success: (oData) => {
              if (oData) {
                const aList = oData.results;

                oListModel.setProperty('/LoanType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));
                oListModel.setProperty('/search/Lntyp', 'ALL');
              }

              resolve();
            },
            error: (oError) => {
              this.debug(oError);
              AppUtils.handleError(new ODataReadError(oError));
              oListModel.setProperty('/busy', false);
            },
          });
        });
      },

      totalCount() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();

        oModel.read('/LoanAmtMyloanSet', {
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
        this.getRouter().navTo('housingLoan-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('loanTable');
        const aTableData = this.getViewModel().getProperty('/List');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_07001');

        TableUtils.export({ oTable, aTableData, sFileName, sStatCode: 'Lnsta', sStatTxt: 'Lnstatx' });
      },
    });
  }
);
