sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/BoxHandler',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/nightduty/CurrentListDialogHandler',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    BoxHandler,
    Client,
    ServiceNames,
    CurrentListDialogHandler
  ) => {
    'use strict';

    return BoxHandler.extend('sap.ui.yesco.mvc.controller.nightduty.SummaryBoxHandler', {
      /**
       * @override
       */
      init() {
        this.oCurrentListDialogHandler = new CurrentListDialogHandler({ oController: this.oController });
        this.YYYY = this.oController.getSessionProperty('DTFMTYYYY');

        const oTodayMoment = moment().hours(9);
        this.sThisYear = oTodayMoment.format(this.YYYY);

        this.oBoxModel.setData({
          summary: {
            busy: true,
            year: this.sThisYear,
            yearMonth: AppUtils.getBundleText('MSG_06002', oTodayMoment.format('YYYY'), oTodayMoment.format('M')),
          },
        });
        this.oController.byId('summaryBox').setModel(this.oBoxModel).bindElement('/summary');

        this.showData();
      },

      /**
       * 나의 당직근무 정보 조회
       */
      async showData() {
        try {
          this.setBusy(true, '/summary/busy');

          const aResultsData = await this.readData();

          const mSummaryData = aResultsData[0] || {};
          if (mSummaryData.__metadata) {
            delete mSummaryData.__metadata;
          }

          this.setSummaryData(mSummaryData);
        } catch (oError) {
          AppUtils.debug('Controller > Nightduty > SummaryBoxHandler.showSummaryData Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false, '/summary/busy');
        }
      },

      /**
       *
       * @returns
       */
      async readData() {
        const oModel = this.oController.getModel(ServiceNames.WORKTIME);
        const sUrl = 'OnCallSummary';
        const mFilters = {
          Pernr: this.oController.getAppointeeProperty('Pernr'),
        };

        return Client.getEntitySet(oModel, sUrl, mFilters);
      },

      /**
       * @param {object} mSummaryData
       */
      setSummaryData(mSummaryData) {
        this.oBoxModel.setData({ summary: mSummaryData || {} }, true);
      },

      /**
       * @override
       */
      onPressIcon() {
        this.setBusy(true, '/summary/busy');

        this.oCurrentListDialogHandler.openDialog();

        this.setBusy(false, '/summary/busy');
      },
    });
  }
);
