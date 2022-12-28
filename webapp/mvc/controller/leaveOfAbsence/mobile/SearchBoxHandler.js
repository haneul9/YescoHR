sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/approvalRequest/mobile/SearchBoxHandler',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    SearchBoxHandler,
    ServiceNames
  ) => {
    'use strict';

    return SearchBoxHandler.extend('sap.ui.yesco.mvc.controller.leaveOfAbsence.mobile.SearchBoxHandler', {
      getReadDataServiceName() {
        return ServiceNames.PA;
      },

      getReadDataEntitySetName() {
        return 'LeaveAbsAppl';
      },

      async onBeforeSetApprovalRequestListData(aApprovalRequestListData) {
        (aApprovalRequestListData || []).forEach((mData) => {
          mData.ApptytxSplited = (mData.Apptytx || '').split('-')[0];
        });
      },
    });
  }
);
