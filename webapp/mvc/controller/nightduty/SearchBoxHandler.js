sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/approvalRequest/SearchBoxHandler',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    ComboEntry,
    SearchBoxHandler,
    ServiceNames
  ) => {
    'use strict';

    return SearchBoxHandler.extend('sap.ui.yesco.mvc.controller.nightduty.SearchBoxHandler', {
      getSearchModelInitData() {
        return {
          selectedDutyGroup: 'ALL',
          dutyGroups: new ComboEntry({
            aEntries: [
              { code: 'A', text: 'A' },
              { code: 'B', text: 'B' },
            ],
          }),
        };
      },

      getReadDataServiceName() {
        return ServiceNames.WORKTIME;
      },

      getReadDataEntitySetName() {
        return 'OnCallChangeApp';
      },
    });
  }
);
