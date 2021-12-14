sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/nightduty/SummaryBoxHandler',
    'sap/ui/yesco/mvc/controller/nightduty/SearchBoxHandler',
    'sap/ui/yesco/mvc/model/type/Currency', // Expression binding용 type preloading
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Month',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    TableUtils,
    BaseController,
    SummaryBoxHandler,
    SearchBoxHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.nightduty.RequestList', {
      sRequestListTableId: 'requestListTable',
      oTableUtils: TableUtils,
      oSummaryBoxHandler: null,
      oSearchBoxHandler: null,

      onBeforeShow() {
        TableUtils.adjustRowSpan({
          table: this.byId(this.sRequestListTableId),
          colIndices: [0, 1, 2, 3, 4, 5, 14, 15],
          theadOrTbody: 'thead',
        });
      },

      async onObjectMatched() {
        try {
          this.oSummaryBoxHandler = new SummaryBoxHandler(this);
          this.oSearchBoxHandler = new SearchBoxHandler(this, this.sRequestListTableId);

          this.onPressSearchBoxIcon();
        } catch (oError) {
          this.debug('Controller > Nightduty List > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onPressSummaryBoxIcon(oEvent) {
        this.oSummaryBoxHandler.onPressIcon(oEvent);
      },

      onPressSearchBoxIcon(oEvent) {
        this.oSearchBoxHandler.onPressIcon(oEvent);
      },

      onPressNewRequest() {
        this.getRouter().navTo('nightduty-detail', { sAppno: false });
      },

      onPressExelDownload() {
        const oTable = this.byId(this.sRequestListTableId);
        const aTableData = this.oSearchBoxHandler.getRequestListTableData();
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_06001'); // {당직변경신청}_목록

        TableUtils.export({ oTable, aTableData, sFileName });
      },

      onSelectRow(oEvent) {
        const sPath = oEvent.getParameter('rowBindingContext').getPath();
        const sAppno = this.getViewModel().getProperty(`${sPath}/Appno`);

        this.getRouter().navTo('nightduty-detail', { sAppno });
        // this.getRouter().getTargets().display('nightdutyDetail', { appno: sAppno });
      },
    });
  }
);
