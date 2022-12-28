sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/approvalRequest/OverviewBoxHandler',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/nightduty/CurrentListDialogHandler',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    OverviewBoxHandler,
    ServiceNames,
    CurrentListDialogHandler
  ) => {
    'use strict';

    return OverviewBoxHandler.extend('sap.ui.yesco.mvc.controller.nightduty.OverviewBoxHandler', {
      getOverviewModelInitData() {
        this.YYYY = this.oController.getSessionProperty('DTFMTYYYY');

        const oTodayMoment = moment().hours(9);
        this.sThisYear = oTodayMoment.format(this.YYYY);
        return {
          year: this.sThisYear,
          yearMonth: AppUtils.getBundleText('MSG_06002', oTodayMoment.format('YYYY'), oTodayMoment.format('M')),
        };
      },

      onBeforeShowData() {
        this.oCurrentListDialogHandler = new CurrentListDialogHandler({ oController: this.oController, sPrcty: 'R' });
      },

      getReadDataServiceName() {
        return ServiceNames.WORKTIME;
      },

      getReadDataEntitySetName() {
        return 'OnCallSummary';
      },

      getReadDataFilterMap() {
        return {
          Pernr: this.oController.getAppointeeProperty('Pernr'),
        };
      },

      onPressIcon() {
        this.oCurrentListDialogHandler.openDialog();
      },
    });
  }
);
