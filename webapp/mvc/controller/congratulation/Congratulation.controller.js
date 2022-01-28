sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/EmployeeSearch',
    'sap/ui/yesco/common/FileListDialogHandler',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    AppUtils,
    EmployeeSearch,
    FileListDialogHandler,
    TableUtils,
    ServiceNames,
    ODataReadError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.congratulation.Congratulation', {
      FileListDialogHandler: null,
      EmployeeSearch: EmployeeSearch,
      TableUtils: TableUtils,
      AppUtils: AppUtils,

      onBeforeShow() {
        this.FileListDialogHandler = new FileListDialogHandler(this);

        const oViewModel = new JSONModel({
          busy: false,
          Data: [],
          searchDate: {
            date: moment().hours(9).toDate(),
            secondDate: moment().subtract(1, 'month').add(1, 'day').hours(9).toDate(),
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
        this.getTotalPay();
        this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR01';
      },

      // 대상자 정보 사원선택시 화면 Refresh
      onRefresh() {
        this.onSearch();
        this.getTotalPay();
        this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
      },

      onClick() {
        this.getRouter().navTo(this.isHass() ? 'h/congratulation-detail' : 'congratulation-detail', { oDataKey: 'N' });
      },

      formatNumber(vNum) {
        if (!vNum || vNum === '') return '0';

        return vNum;
      },

      formatPay(vPay) {
        if (!vPay || vPay === '0') return '0';

        return vPay;
      },

      getTotalPay() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oTotalModel = this.getViewModel();
        const sUrl = '/ConExpenseMyconSet';
        const aFilters = [];

        if (this.isHass()) {
          const sPernr = this.getAppointeeProperty('Pernr');

          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
        }

        oModel.read(sUrl, {
          filters: aFilters,
          success: (oData) => {
            if (oData) {
              this.debug(`${sUrl} success.`, oData);
              const oTotal = oData.results[0];

              oTotalModel.setProperty('/Total', oTotal);
            }
          },
          error: (oError) => {
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
      },

      onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();
        const oTable = this.byId('conguTable');
        const oSearchDate = oListModel.getProperty('/searchDate');
        const dDate = moment(oSearchDate.secondDate).hours(9).toDate();
        const dDate2 = moment(oSearchDate.date).hours(9).toDate();
        const sMenid = this.getCurrentMenuId();
        const aFilters = [
          new Filter('Prcty', FilterOperator.EQ, 'L'), // prettier 방지용 주석
          new Filter('Menid', FilterOperator.EQ, sMenid),
          new Filter('Apbeg', FilterOperator.EQ, dDate),
          new Filter('Apend', FilterOperator.EQ, dDate2),
        ];

        oListModel.setProperty('/busy', true);

        if (this.isHass()) {
          const sPernr = this.getAppointeeProperty('Pernr');

          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
          this.getTotalPay();
        }

        oModel.read('/ConExpenseApplSet', {
          filters: aFilters,
          success: (oData) => {
            if (oData) {
              const oList = oData.results;

              oListModel.setProperty('/CongList', oList);
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

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getRouter().navTo(this.isHass() ? 'h/congratulation-detail' : 'congratulation-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('conguTable');
        const aTableData = this.getViewModel().getProperty('/CongList');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_02022');

        TableUtils.export({ oTable, aTableData, sFileName });
      },

      onPressFileListDialogOpen(oEvent) {
        this.FileListDialogHandler.openDialog(oEvent);
      },
    });
  }
);
