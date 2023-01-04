sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    ServiceNames,
    AppUtils,
    Client,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.congratulation.mobile.Congratulation', {
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

        return Client.getEntitySet(oModel, 'ConExpenseAppl', mPayLoad);
      },

      // 검색 날짜 선택
      async onSearchList(oEvent) {
        const sKey = oEvent.getSource().getSelectedKey();
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const bDateRangeBox = sKey === '0';
          setTimeout(() => {
            oViewModel.setProperty('/search/dateBox', bDateRangeBox);
          });

          const dEndda = moment();

          switch (sKey) {
            case '1w':
              dEndda.subtract(7, 'day');
              break;
            case '1m':
              dEndda.subtract(1, 'months').add(1, 'day');
              break;
            case '3m':
              dEndda.subtract(3, 'months').add(1, 'day');
              break;
            case '6m':
              dEndda.subtract(6, 'months').add(1, 'day');
              break;
            case '12m':
              dEndda.subtract(12, 'months').add(1, 'day');
              break;
          }

          if (!bDateRangeBox) {
            oViewModel.setProperty('/search/secondDate', moment().startOf('day').hours(9).toDate());
            oViewModel.setProperty('/search/date', dEndda.startOf('day').hours(9).toDate());

            const aCongList = await this.getAppList();

            oViewModel.setProperty('/CongList', aCongList);
            oViewModel.setProperty('/listInfo/totalCount', _.size(aCongList));
          }
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
