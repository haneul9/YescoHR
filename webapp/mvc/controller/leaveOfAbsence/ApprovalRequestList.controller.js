sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/approvalRequest/ListController',
    'sap/ui/yesco/mvc/controller/leaveOfAbsence/OverviewBoxHandler',
    'sap/ui/yesco/mvc/controller/leaveOfAbsence/SearchBoxHandler',
  ],
  (
    // prettier 방지용 주석
    ApprovalRequestListController,
    OverviewBoxHandler,
    SearchBoxHandler
  ) => {
    'use strict';

    return ApprovalRequestListController.extend('sap.ui.yesco.mvc.controller.leaveOfAbsence.ApprovalRequestList', {
      getApprovalRequestConfig() {
        return {
          ApprovalType: 'HR20',
          StatusFieldName: 'ZappStatAl',
        };
      },

      getOverviewBoxHandler() {
        return new OverviewBoxHandler(this);
      },

      getSearchBoxHandler() {
        return new SearchBoxHandler(this);
      },

      useFileListDialog() {
        return true;
      },

      getExcelFileName() {
        return this.getBundleText('LABEL_00282', 'LABEL_50001'); // {휴/복직 신청}_목록
      },
    });
  }
);
