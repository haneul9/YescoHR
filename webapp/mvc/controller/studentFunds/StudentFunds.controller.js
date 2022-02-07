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

    return BaseController.extend('sap.ui.yesco.mvc.controller.studentFunds.StudentFunds', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      EmployeeSearch: EmployeeSearch,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const dDate = new Date();
        const oViewModel = new JSONModel({
          detailName: this.isHass() ? 'h/studentFunds-detail' : 'studentFunds-detail',
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
        this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
      },

      // 대상자 정보 사원선택시 화면 Refresh
      onRefresh() {
        this.onSearch();
        this.totalCount();
        this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR02';
      },

      onClick() {
        this.getRouter().navTo(this.getViewModel().getProperty('/detailName'), { oDataKey: 'N' });
      },

      formatNumber(vNum = '0') {
        return vNum;
      },

      formatPay(vPay = '0') {
        return this.TextUtils.toCurrency(vPay);
      },

      thisYear(sYear = String(moment().format('YYYY'))) {
        return this.getBundleText('MSG_03012', sYear);
      },

      onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();
        const oTable = this.byId('studentTable');
        const oSearchDate = oListModel.getProperty('/searchDate');
        const dDate = moment(oSearchDate.secondDate).hours(9).toDate();
        const dDate2 = moment(oSearchDate.date).hours(9).toDate();
        const sMenid = this.getCurrentMenuId();

        oListModel.setProperty('/busy', true);

        const aFilters = [
          // prettier 방지용 주석
          new Filter('Prcty', FilterOperator.EQ, 'L'),
          new Filter('Menid', FilterOperator.EQ, sMenid),
          new Filter('Apbeg', FilterOperator.EQ, dDate),
          new Filter('Apend', FilterOperator.EQ, dDate2),
        ];

        if (this.isHass()) {
          const sPernr = this.getAppointeeProperty('Pernr');

          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
          this.totalCount();
        }

        oModel.read('/SchExpenseApplSet', {
          filters: aFilters,
          success: (oData) => {
            if (oData) {
              const oList = oData.results;

              oListModel.setProperty('/StudentList', oList);
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
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();
        const aFilters = [];

        if (this.isHass()) {
          const sPernr = this.getAppointeeProperty('Pernr');

          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
        }

        oModel.read('/SchExpenseMyschSet', {
          filters: aFilters,
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
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
      },

      onSelectRow(oEvent) {
        const oListModel = this.getViewModel();
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = oListModel.getProperty(vPath);

        this.getRouter().navTo(oListModel.getProperty('/detailName'), { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('studentTable');
        const aTableData = this.getViewModel().getProperty('/StudentList');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_03028');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
