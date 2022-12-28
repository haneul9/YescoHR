sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/approvalRequest/SearchBoxHandler',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    SearchBoxHandler,
    ServiceNames
  ) => {
    'use strict';

    return SearchBoxHandler.extend('sap.ui.yesco.mvc.controller.leaveOfAbsence.SearchBoxHandler', {
      getSearchPeriodConfig() {
        return {
          fromDateFieldName: 'Apbeg',
          toDateFieldName: 'Apend',
          period: 12,
          periodUnit: 'month',
        };
      },

      getReadDataServiceName() {
        return ServiceNames.PA;
      },

      getReadDataEntitySetName() {
        return 'LeaveAbsAppl';
      },
    });
  }
);
