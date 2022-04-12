sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/EmployeeSearch',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/nightduty/SummaryBoxHandler',
    'sap/ui/yesco/mvc/controller/nightduty/SearchBoxHandler',
    'sap/ui/yesco/mvc/model/type/Currency', // XML expression binding용 type preloading
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Month',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    EmployeeSearch,
    TableUtils,
    BaseController,
    SummaryBoxHandler,
    SearchBoxHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.nightduty.mobile.RequestList', {
      TableUtils: TableUtils,
      EmployeeSearch: EmployeeSearch,

      sRequestListTableId: 'requestListTable',
      oSummaryBoxHandler: null,
      oSearchBoxHandler: null,

      sRouteName: '',

      onBeforeShow() {
        TableUtils.adjustRowSpan({
          oTable: this.byId(this.sRequestListTableId),
          aColIndices: [0, 1, 2, 3, 4, 5, 14, 15],
          sTheadOrTbody: 'thead',
        });
      },

      async onObjectMatched(oParameter, sRouteName) {
        try {
          this.sRouteName = sRouteName;

          this.oSummaryBoxHandler ||= new SummaryBoxHandler(this);
          this.oSearchBoxHandler ||= new SearchBoxHandler(this, this.sRequestListTableId);

          this.onPressSearchBoxIcon();
        } catch (oError) {
          this.debug('Controller > Nightduty List > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        }
      },

      callbackAppointeeChange() {
        this.oSummaryBoxHandler.showData();
        this.oSearchBoxHandler.onPressIcon();
      },

      onPressSummaryBoxIcon(oEvent) {
        this.oSummaryBoxHandler.onPressIcon(oEvent);
      },

      onPressSearchBoxIcon(oEvent) {
        this.oSearchBoxHandler.onPressIcon(oEvent);
      },

      onPressNewRequest() {
        this.getRouter().navTo(`${this.sRouteName}-detail`, { sAppno: 0 });
      },

      onPressExelDownload() {
        const oTable = this.byId(this.sRequestListTableId);
        const aTableData = this.oSearchBoxHandler.getRequestListTableData();
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_06001'); // {당직변경신청}_목록

        TableUtils.export({ oTable, aTableData, sFileName });
      },

      onSelectRow(oEvent) {
        const sPath = oEvent.getParameter('rowBindingContext').getPath();
        const sAppno = oEvent.getSource().getModel().getProperty(`${sPath}/Appno`);

        this.getRouter().navTo(`${this.sRouteName}-detail`, { sAppno });
        // this.getRouter().getTargets().display('nightdutyDetail', { appno: sAppno });
      },
    });
  }
);