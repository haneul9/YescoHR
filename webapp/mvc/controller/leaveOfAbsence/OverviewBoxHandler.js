sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/approvalRequest/OverviewBoxHandler',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    OverviewBoxHandler,
    ServiceNames
  ) => {
    'use strict';

    return OverviewBoxHandler.extend('sap.ui.yesco.mvc.controller.leaveOfAbsence.OverviewBoxHandler', {
      getReadDataServiceName() {
        return ServiceNames.PA;
      },

      getReadDataEntitySetName() {
        return 'LeaveAbsMyabs';
      },

      async onBeforeSetOverviewData(mOverviewData) {
        // if (mOverviewData) {
        //   mOverviewData.Absck = 'X';
        //   mOverviewData.Line1 = '육아휴직';
        //   mOverviewData.Line2 = '2022.01.06 ~ 2022.01.05';
        //   mOverviewData.Line3 = '종료 30일 전(335일 경과)';
        //   mOverviewData.Line4 = '복직을 신청하세요!';
        // }
      },
    });
  }
);
