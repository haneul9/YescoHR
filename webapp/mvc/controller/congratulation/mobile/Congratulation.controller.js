sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    ServiceNames,
    AppUtils,
    TableUtils,
    FragmentEvent,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.congratulation.mobile.Congratulation', {
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,
      AppUtils: AppUtils,

      initializeModel() {
        return {
          busy: false,
          Data: [],
        };
      },

      onObjectMatched() {
        this.getViewModel().setData(this.initializeModel());

        this.onSearch();
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR01';
      },

      onClick() {
        this.getRouter().navTo('m/congratulation-detail', { oDataKey: 'N' });
      },

      onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();
        const sMenid = this.getCurrentMenuId();

        oListModel.setProperty('/busy', true);

        oModel.read('/ConExpenseApplSet', {
          filters: [new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'), new sap.ui.model.Filter('Menid', sap.ui.model.FilterOperator.EQ, sMenid)],
          success: (oData) => {
            if (oData) {
              const oList = oData.results;

              oListModel.setProperty('/CongList', oList);
              oListModel.setProperty('/busy', false);
            }
          },
          error: (oError) => {
            AppUtils.handleError(oError);

            oListModel.setProperty('/busy', false);
          },
        });
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getRouter().navTo('m/congratulation-detail', { oDataKey: oRowData.Appno });
      },
    });
  }
);
