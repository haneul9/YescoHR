sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/approvalRequest/BoxHandler',
    'sap/ui/yesco/common/odata/Client',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    BoxHandler,
    Client
  ) => {
    'use strict';

    /**
     * class 실사용은 nightduty, leavOfAbsence 참고할 것
     */
    return BoxHandler.extend('sap.ui.yesco.common.approvalRequest.OverviewBoxHandler', {
      /**
       * @override
       */
      onInit() {
        this.oBoxModel.setData(
          {
            overview: {
              busy: true,
              ...this.getOverviewModelInitData(),
            },
          },
          true
        );

        this.onBeforeShowData();
        this.showData();
      },

      getOverviewModelInitData() {
        // {common.approvalRequest.OverviewBoxHandler} {getOverviewModelInitData} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.OverviewBoxHandler', 'getOverviewModelInitData'));
        return {};
      },

      onBeforeShowData() {
        // {common.approvalRequest.OverviewBoxHandler} {onBeforeShowData} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.OverviewBoxHandler', 'onBeforeShowData'));
      },

      async showData() {
        try {
          this.setBusy();

          const [mOverviewData = {}] = await this.readData();

          if (mOverviewData.__metadata) {
            delete mOverviewData.__metadata;
          }

          await this.onBeforeSetOverviewData(mOverviewData);
          this.setOverviewData(mOverviewData);
        } catch (oError) {
          this.debug('common.approvalRequest.OverviewBoxHandler > showData', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      // eslint-disable-next-line no-unused-vars
      async onBeforeSetOverviewData(mOverviewData) {
        // {common.approvalRequest.OverviewBoxHandler} {onBeforeSetOverviewData} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.OverviewBoxHandler', 'onBeforeSetOverviewData'));
      },

      async readData() {
        const oModel = this.oController.getModel(this.getReadDataServiceName());
        const sEntitySetName = this.getReadDataEntitySetName();
        const mFilters = this.getReadDataFilterMap();

        if (_.isEmpty(mFilters)) {
          return Client.getEntitySet(oModel, sEntitySetName);
        }
        return Client.getEntitySet(oModel, sEntitySetName, mFilters);
      },

      setOverviewData(mOverviewData) {
        this.oBoxModel.setData({ overview: mOverviewData || {} }, true);
      },

      setOverviewProperty(sPropertyName, vValue) {
        this.oBoxModel.setProperty(`/overview/${sPropertyName}`, vValue);
        return this;
      },

      getOverviewProperty(sPropertyName) {
        return this.oBoxModel.getProperty(`/overview/${sPropertyName}`);
      },

      setBusy(bBusy = true) {
        return this._setBusy(bBusy, '/overview/busy');
      },
    });
  }
);
