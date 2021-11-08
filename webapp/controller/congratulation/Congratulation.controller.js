sap.ui.define(
  [
    'sap/ui/model/json/JSONModel',
    '../../model/formatter',
    'sap/ui/yesco/common/EmpInfo',
    '../BaseController',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/extension/moment',
  ],
  (
    JSONModel,
    formatter,
    EmpInfo,
    BaseController,
    ServiceNames,
    AttachFileAction
  ) => {
    'use strict';

    class Congratulation extends BaseController {
      constructor() {
        super();
        this.formatter = formatter;
        this.AttachFileAction = AttachFileAction;
        this.TypeCode = 'HR01'
      }

      onBeforeShow() {
        const oViewModel = new JSONModel({ Data: [] });
        this.setViewModel(oViewModel);

        EmpInfo.get.call(this, true);

        const oSearchDate = this.byId('SearchDate');
        const dDate = moment(new Date()).hours(10).toDate();
        const dDate2 = moment(new Date(dDate.getFullYear(), dDate.getMonth() - 1, dDate.getDate() + 1)).hours(10).toDate();

        oSearchDate.setDateValue(dDate2);
        oSearchDate.setSecondDateValue(dDate);
      }

      onAfterShow() {
        this.onSearch();
        this.getTotalPay();
        super.onAfterShow();
      }

      onClick() {
        this.getRouter().navTo('congDetail', { oDataKey: 'N' });
      }

      formatNumber(vNum) {
        if (!vNum || vNum === '') return '0';

        return vNum;
      }

      formatPay(vPay) {
        if (!vPay || vPay === '0') return '0';

        return `${vPay}만원`;
      }

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
      }

      onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oSearchDate = this.byId('SearchDate');
        const oListModel = this.getViewModel();
        const oController = this;

        oModel.read('/ConExpenseApplSet', {
          filters: [
            new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'),
            new sap.ui.model.Filter('Actty', sap.ui.model.FilterOperator.EQ, 'E'),
            new sap.ui.model.Filter('Apbeg', sap.ui.model.FilterOperator.EQ, oSearchDate.getDateValue()),
            new sap.ui.model.Filter('Apend', sap.ui.model.FilterOperator.EQ, oSearchDate.getSecondDateValue()),
          ],
          success: function (oData) {
            if (oData) {
              // Common.log(oData);
              const oList = oData.results;
              let vNo = 0;
              let vNum1 = 0;
              let vNum2 = 0;
              let vNum3 = 0;
              let vNum4 = 0;
              let vNum5 = 0;

              oList.forEach((e) => {
                vNo = vNo + 1;
                e.No = vNo;
              });

              oList.forEach((e) => {
                switch (e.ZappStatAl) {
                  case '10':
                  case '90':
                    return (vNum1 = vNum1 + 1);
                  case '20':
                  case '30':
                  case '50':
                    return (vNum2 = vNum2 + 1);
                  case '40':
                    return (vNum3 = vNum3 + 1);
                  case '45':
                  case '65':
                    return (vNum4 = vNum4 + 1);
                  case '60':
                    return (vNum5 = vNum5 + 1);
                  default:
                    return null;
                }
              });

              oListModel.setProperty('/Writing', `작성중 ${vNum1}`);
              oListModel.setProperty('/Apply', `신청 ${vNum2}`);
              oListModel.setProperty('/Approval', `승인 ${vNum3}`);
              oListModel.setProperty('/Reject', `반려 ${vNum4}`);
              oListModel.setProperty('/Complete', `완료 ${vNum5}`);
              oListModel.setProperty('/CongList', oList);

              oController.byId('conguTable').setVisibleRowCount(oList.length);
            }
          },
          error: function (oRespnse) {
            // Common.log(oResponse);
          },
        });
      }

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getRouter().navTo('congDetail', { oDataKey: oRowData.Appno });
      }
    }

    return Congratulation;
  }
);
