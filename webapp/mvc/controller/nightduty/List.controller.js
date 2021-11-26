sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AttachFileAction,
    EmpInfo,
    TableUtils,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.nightduty.List', {
      constructor: function () {
        this.AttachFileAction = AttachFileAction;
        this.TableUtils = TableUtils;
        this.TYPE_CODE = 'HR01';
      },

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          Data: [],
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

        const oSearchDate = this.byId('SearchDate');
        const dDate = new Date();
        const dDate2 = new Date(dDate.getFullYear(), dDate.getMonth() - 1, dDate.getDate() + 1);

        oSearchDate.setDateValue(dDate2);
        oSearchDate.setSecondDateValue(dDate);
      },

      onAfterShow() {
        this.onSearch();
        this.getTotalPay();
        super.onAfterShow();
      },

      onClick() {
        this.getRouter().navTo('congratulation-detail', { oDataKey: 'N' });
      },

      onExelDownload() {
        const oTable = this.byId('conguTable');
        const mTableData = this.getViewModel().getProperty('/CongList');
        const sFileName = '경조금신청_목록';

        TableUtils.export({ oTable, mTableData, sFileName });
      },

      formatNumber(vNum) {
        if (!vNum || vNum === '') return '0';

        return vNum;
      },

      formatPay(vPay) {
        if (!vPay || vPay === '0') return '0';

        return `${vPay}만원`;
      },

      getTotalPay() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oTotalModel = this.getViewModel();

        oModel.read('/ConExpenseMyconSet', {
          success: function (oData) {
            if (oData) {
              // Common.log(oData);
              const oTotal = oData.results[0];

              oTotalModel.setProperty('/Total', oTotal);
            }
          },
          error: function (oRespnse) {
            // Common.log(oResponse);
          },
        });
      },

      onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oSearchDate = this.byId('SearchDate');
        const oListModel = this.getViewModel();
        const oController = this;
        const dDate = moment(oSearchDate.getDateValue()).hours(10).toDate();
        const dDate2 = moment(oSearchDate.getSecondDateValue()).hours(10).toDate();

        oListModel.setProperty('/busy', true);

        oModel.read('/ConExpenseApplSet', {
          filters: [
            new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'),
            new sap.ui.model.Filter('Actty', sap.ui.model.FilterOperator.EQ, 'E'),
            new sap.ui.model.Filter('Apbeg', sap.ui.model.FilterOperator.EQ, dDate),
            new sap.ui.model.Filter('Apend', sap.ui.model.FilterOperator.EQ, dDate2),
          ],
          success: function (oData) {
            if (oData) {
              // Common.log(oData);
              const oList = oData.results.map((o) => {
                return {
                  ...o,
                  Pernr: parseInt(o.Pernr, 10),
                };
              });
              // let vNo = 0;

              // oList.forEach((e) => {
              //   vNo = vNo + 1;
              //   e.No = vNo;
              // });

              TableUtils.count.call(oController, oList);
              oListModel.setProperty('/CongList', oList);
              oController.byId('conguTable').setVisibleRowCount(oList.length);
              oListModel.setProperty('/busy', false);
            }
          },
          error: function (oRespnse) {
            // Common.log(oResponse);
            oListModel.setProperty('/busy', false);
          },
        });
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getRouter().navTo('congratulation-detail', { oDataKey: oRowData.Appno });
        // this.getRouter().getTargets().display('congDetail', { oDataKey: oRowData.Appno });
      },
    });
  }
);
