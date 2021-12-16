sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/BoxHandler',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/nightduty/CurrentListDialogHandler',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    AppUtils,
    BoxHandler,
    ODataReadError,
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
            yearMonth: this.oController.getBundleText('MSG_06002', oTodayMoment.format('YYYY'), oTodayMoment.format('M')),
          },
        });
        this.oController.byId('summaryBox').setModel(this.oBoxModel).bindElement('/summary');

        this.showSummaryData();
      },

      /**
       * 나의 당직근무 정보 조회
       */
      async showSummaryData() {
        try {
          this.setBusy('/summary/busy', true);

          const aResultsData = await this.readSummaryData();

          const mSummaryData = aResultsData[0] || {};
          if (mSummaryData.__metadata) {
            delete mSummaryData.__metadata;
          }

          this.setSummaryData(mSummaryData);
        } catch (oError) {
          AppUtils.debug('Controller > Nightduty > SummaryBoxHandler.showSummaryData Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setBusy('/summary/busy', false);
        }
      },

      /**
       *
       * @returns
       */
      async readSummaryData() {
        return new Promise((resolve, reject) => {
          const sUrl = '/OnCallSummarySet';
          const sPernr = this.oController.getAppointeeProperty('Pernr');

          this.oController.getModel(ServiceNames.WORKTIME).read(sUrl, {
            filters: [
              new Filter('Pernr', FilterOperator.EQ, sPernr), //
            ],
            success: (mData) => {
              AppUtils.debug(`${sUrl} success.`, mData);

              resolve(mData.results);
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
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
        this.setBusy('/summary/busy', true);

        this.oCurrentListDialogHandler.openDialog();

        this.setBusy('/summary/busy', false);
      },
    });
  }
);
