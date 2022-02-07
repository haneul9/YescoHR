sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/EmployeeSearch',
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
    Filter,
    FilterOperator,
    JSONModel,
    AppUtils,
    AttachFileAction,
    EmployeeSearch,
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
      EmployeeSearch: EmployeeSearch,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      onInit() {
        BaseController.prototype.onInit.apply(this, arguments);

        const dDate = new Date();
        const oViewModel = new JSONModel({
          detailName: this.isHass() ? 'h/clubJoin-detail' : 'clubJoin-detail',
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
        this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
      },

      // 대상자 정보 사원선택시 화면 Refresh
      onRefresh() {
        this.totalCount();
        this.onSearch();
        this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR07';
      },

      onClick() {
        this.getRouter().navTo(this.getViewModel().getProperty('/detailName'), { oDataKey: 'N' });
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
        const aFilters = [
          // prettier 방지주석
          new Filter('Prcty', FilterOperator.EQ, 'L'),
          new Filter('Menid', FilterOperator.EQ, sMenid),
          new Filter('Apbeg', FilterOperator.EQ, dDate),
          new Filter('Apend', FilterOperator.EQ, dDate2),
        ];

        oListModel.setProperty('/busy', true);

        if (this.isHass()) {
          const sPernr = this.getAppointeeProperty('Pernr');

          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
        }

        oModel.read('/ClubJoinApplSet', {
          filters: aFilters,
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
        const aFilters = [];

        if (this.isHass()) {
          const sPernr = this.getAppointeeProperty('Pernr');

          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
        }

        oModel.read('/ClubJoinMyclubSet', {
          filters: aFilters,
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
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);

        oListModel.setProperty('/parameters', oRowData);
        this.getRouter().navTo(oListModel.getProperty('/detailName'), { oDataKey: oRowData.Appno });
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
