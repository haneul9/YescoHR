sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/mobile/ListStatusPopover',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
  ],
  (
    // prettier 방지용 주석
    ServiceNames,
    AppUtils,
    TableUtils,
    FragmentEvent,
    ListStatusPopover,
    Client,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.congratulation.mobile.Congratulation', {
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,
      ListStatusPopover: ListStatusPopover,
      AppUtils: AppUtils,

      initializeModel() {
        return {
          busy: false,
          search: {
            dateRange: '12m',
            secondDate: moment().toDate(),
            date: moment().subtract(1, 'year').toDate(),
            dateBox: false,
          },
          Data: [],
          listInfo: {
            rowCount: 1,
            popover: true,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const aCongList = await this.getAppList();

          oViewModel.setProperty('/CongList', aCongList);
          oViewModel.setProperty('/listInfo/totalCount', _.size(aCongList));
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR01';
      },

      onClick() {
        this.getRouter().navTo('mobile/congratulation-detail', { oDataKey: 'N' });
      },

      // 날짜선택
      async onSearchRange() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const aCongList = await this.getAppList();

          oViewModel.setProperty('/CongList', aCongList);
          oViewModel.setProperty('/listInfo/totalCount', _.size(aCongList));
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 신청내역 조회
      async getAppList() {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const mSearch = oViewModel.getProperty('/search');
        const mPayLoad = {
          Apbeg: moment(mSearch.date).hours(9).toDate(),
          Apend: moment(mSearch.secondDate).hours(9).toDate(),
          Menid: this.getCurrentMenuId(),
          Prcty: 'L',
        };

        return await Client.getEntitySet(oModel, 'ConExpenseAppl', mPayLoad);
      },

      // 검색 날짜 선택
      async onSearchList(oEvent) {
        const oViewModel = this.getViewModel();

        try {
          const sKey = oEvent.getSource().getSelectedKey();
          let dBegda = moment().toDate();
          let dEndda = moment().toDate();
          let bDateRangeBox = false;

          oViewModel.setProperty('/busy', true);

          switch (sKey) {
            case '1w':
              dEndda = moment().subtract(7, 'day').toDate();
              bDateRangeBox = false;
              break;
            case '1m':
              dEndda = moment().subtract(1, 'months').toDate();
              bDateRangeBox = false;
              break;
            case '3m':
              dEndda = moment().subtract(3, 'months').toDate();
              bDateRangeBox = false;
              break;
            case '6m':
              dEndda = moment().subtract(6, 'months').toDate();
              bDateRangeBox = false;
              break;
            case '12m':
              dEndda = moment().subtract(12, 'months').toDate();
              bDateRangeBox = false;
              break;
            case '0':
              bDateRangeBox = true;
              break;
          }

          if (!bDateRangeBox) {
            oViewModel.setProperty('/search/secondDate', dBegda);
            oViewModel.setProperty('/search/date', dEndda);

            const aCongList = await this.getAppList();

            oViewModel.setProperty('/CongList', aCongList);
            oViewModel.setProperty('/listInfo/totalCount', _.size(aCongList));
          }

          oViewModel.setProperty('/search/dateBox', bDateRangeBox);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getSource().getBindingContext().getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getRouter().navTo('mobile/congratulation-detail', { oDataKey: oRowData.Appno });
      },
    });
  }
);
