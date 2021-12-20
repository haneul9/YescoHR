sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/EmployeeSearch',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
	ServiceNames,
	AppUtils,
	AttachFileAction,
	EmployeeSearch,
	ODataReadError,
	TableUtils,
	FragmentEvent,
	BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.congratulation.Congratulation', {
      TYPE_CODE: 'HR01',

      AttachFileAction: AttachFileAction,
      EmployeeSearch: EmployeeSearch,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,
      AppUtils: AppUtils,

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
        this.getTotalPay();
        this.getViewModel('appointeeModel').setProperty('/showChangeButton', this.isHass());
      },

      onClick() {
        this.getRouter().navTo('congratulation-detail', { oDataKey: 'N' });
      },

      formatNumber(vNum) {
        if (!vNum || vNum === '') return '0';

        return vNum;
      },

      formatPay(vPay) {
        if (!vPay || vPay === '0') return '0';

        return `${vPay}${this.getBundleText('LABEL_00158')}`;
      },

      getTotalPay() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oTotalModel = this.getViewModel();
        const sUrl = '/ConExpenseMyconSet';
        const aFilters = [];

        if (this.isHass()) {
          const sPernr = this.getViewModel('appointeeModel').getProperty('/Pernr');
          
          aFilters.push(new sap.ui.model.Filter('Pernr', sap.ui.model.FilterOperator.EQ, sPernr));
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
          new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'),
          new sap.ui.model.Filter('Menid', sap.ui.model.FilterOperator.EQ, sMenid),
          new sap.ui.model.Filter('Apbeg', sap.ui.model.FilterOperator.EQ, dDate),
          new sap.ui.model.Filter('Apend', sap.ui.model.FilterOperator.EQ, dDate2),
        ];

        oListModel.setProperty('/busy', true);

        if (this.isHass()) {
          const sPernr = this.getViewModel('appointeeModel').getProperty('/Pernr');

          aFilters.push(new sap.ui.model.Filter('Pernr', sap.ui.model.FilterOperator.EQ, sPernr));
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
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getRouter().navTo('congratulation-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('conguTable');
        const aTableData = this.getViewModel().getProperty('/CongList');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_02022');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
