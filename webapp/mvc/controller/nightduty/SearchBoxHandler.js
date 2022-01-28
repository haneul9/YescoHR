sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/BoxHandler',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    BoxHandler,
    ComboEntry,
    TableUtils,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return BoxHandler.extend('sap.ui.yesco.mvc.controller.nightduty.SearchBoxHandler', {
      /**
       * @override
       */
      init(requestListTableId) {
        this.sRequestListTableId = requestListTableId;

        const oTodayMoment = moment().hours(9);

        this.oBoxModel.setData({
          search: {
            busy: true,
            Apend: oTodayMoment.toDate(),
            Apbeg: oTodayMoment.subtract(1, 'month').add(1, 'day').toDate(),
            selectedDutyGroup: 'ALL',
            dutyGroups: new ComboEntry({
              aEntries: [
                { code: 'A', text: 'A' },
                { code: 'B', text: 'B' },
              ],
            }),
          },
          requestList: [],
          requestListInfo: {
            rowCount: 0,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
        });
        this.oController.byId('searchBox').setModel(this.oBoxModel).bindElement('/search');
        this.oController.byId(requestListTableId).setModel(this.oBoxModel).bindElement('/search');
      },

      /**
       * @override
       */
      async onPressIcon() {
        try {
          this.setBusy(true, '/search/busy');

          const aRequestListData = await this.readData();

          this.setRequestListData(aRequestListData);
        } catch (oError) {
          AppUtils.debug('Controller > Nightduty List > SearchBoxHandler.onPressIcon Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false, '/search/busy');
        }
      },

      async readData() {
        const oApbeg = this.oBoxModel.getProperty('/search/Apbeg');
        const oApend = this.oBoxModel.getProperty('/search/Apend');

        const oModel = this.oController.getModel(ServiceNames.WORKTIME);
        const sUrl = 'OnCallChangeApp';
        const mFilters = {
          Menid: this.oController.getCurrentMenuId(),
          Apbeg: moment(oApbeg).hours(9).toDate(),
          Apend: moment(oApend).hours(9).toDate(),
        };

        return Client.getEntitySet(oModel, sUrl, mFilters);
      },

      setRequestListData(aRowData) {
        const oTable = this.oController.byId(this.sRequestListTableId);

        this.oBoxModel.setProperty('/search/requestList', aRowData);
        this.oBoxModel.setProperty('/search/requestListInfo', TableUtils.count({ oTable, aRowData }));
      },

      getRequestListTableData() {
        return this.oBoxModel.getProperty('/search/requestList');
      },
    });
  }
);
