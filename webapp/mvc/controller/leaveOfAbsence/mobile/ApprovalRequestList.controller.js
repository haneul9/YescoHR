sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/approvalRequest/mobile/ListController',
    'sap/ui/yesco/mvc/controller/leaveOfAbsence/mobile/SearchBoxHandler',
  ],
  (
    // prettier 방지용 주석
    ApprovalRequestListController,
    SearchBoxHandler
  ) => {
    'use strict';

    return ApprovalRequestListController.extend('sap.ui.yesco.mvc.controller.leaveOfAbsence.mobile.ApprovalRequestList', {
      getApprovalRequestConfig() {
        return {
          ApprovalType: 'HR20',
          StatusFieldName: 'ZappStatAl',
        };
      },

      getSearchBoxHandler() {
        return new SearchBoxHandler(this);
      },
    });
  }
);
