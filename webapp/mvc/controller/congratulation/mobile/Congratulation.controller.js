sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    ServiceNames,
    AppUtils,
    TableUtils,
    FragmentEvent,
    Client,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.congratulation.mobile.Congratulation', {
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,
      AppUtils: AppUtils,

      initializeModel() {
        return {
          busy: false,
          search: {
            dateRange: '1w',
            secondDate: moment().subtract(1, 'year').add(1, 'day').toDate(),
            date: moment().toDate(),
          },
          Data: [],
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());

        oViewModel.setProperty('/CongList', aList);
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR01';
      },

      onClick() {
        this.getRouter().navTo('mobile/congratulation-detail', { oDataKey: 'N' });
      },

      // 조회
      onSearch() {
        oViewModel.setProperty('/CongList', aList);
      },

      // 신청내역 조회
      async getAppList() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.BENEFIT);
          const mSearch = oViewModel.getProperty('/search');
          const mPayLoad = {
            Apbeg: moment(mSearch.secondDate).hours(9).toDate(),
            Apend: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            Prcty: 'L',
          };

          return await Client.getEntitySet(oModel, 'ConExpenseAppl', mPayLoad);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 검색 날짜 선택
      onSearchList(oEvent) {},

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getRouter().navTo('mobile/congratulation-detail', { oDataKey: oRowData.Appno });
      },
    });
  }
);
