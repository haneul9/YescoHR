sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/BoxHandler',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    AppUtils,
    BoxHandler,
    ComboEntry,
    TableUtils,
    ODataReadError,
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
            rowCount: 1,
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
          this.setBusy('/search/busy', true);

          const aRequestListData = await this.readRequestListData();

          this.setRequestListData(aRequestListData);
        } catch (oError) {
          AppUtils.debug('Controller > Nightduty List > SearchBoxHandler.onPressIcon Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setBusy('/search/busy', false);
        }
      },

      async readRequestListData() {
        return new Promise((resolve, reject) => {
          const sUrl = '/OnCallChangeAppSet';
          const sMenid = this.oController.getCurrentMenuId();
          const oApbeg = this.oBoxModel.getProperty('/search/Apbeg');
          const oApend = this.oBoxModel.getProperty('/search/Apend');

          this.oController.getModel(ServiceNames.WORKTIME).read(sUrl, {
            filters: [
              new Filter('Menid', FilterOperator.EQ, sMenid), //
              new Filter('Apbeg', FilterOperator.EQ, moment(oApbeg).hours(9).toDate()),
              new Filter('Apend', FilterOperator.EQ, moment(oApend).hours(9).toDate()),
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
