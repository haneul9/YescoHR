sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/approvalRequest/ListController',
    'sap/ui/yesco/mvc/controller/nightduty/OverviewBoxHandler',
    'sap/ui/yesco/mvc/controller/nightduty/SearchBoxHandler',
  ],
  (
    // prettier 방지용 주석
    ApprovalRequestListController,
    OverviewBoxHandler,
    SearchBoxHandler
  ) => {
    'use strict';

    return ApprovalRequestListController.extend('sap.ui.yesco.mvc.controller.nightduty.ApprovalRequestList', {
      onBeforeShow() {
        this.TableUtils.adjustRowSpan({
          oTable: this.byId(this.getApprovalRequestListTableId()),
          aColIndices: [0, 1, 2, 3, 4, 5, 14, 15],
          sTheadOrTbody: 'thead',
        });
      },

      getOverviewBoxHandler() {
        return new OverviewBoxHandler(this);
      },

      getSearchBoxHandler() {
        return new SearchBoxHandler(this);
      },

      getExcelFileName() {
        return this.getBundleText('LABEL_00282', 'LABEL_06001'); // {당직변경신청}_목록
      },
    });
  }
);
