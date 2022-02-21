sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
  ],
  (
    // prettier 방지용 주석
    Fragment,
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
            secondDate: moment().toDate(),
            date: moment().subtract(7, 'day').toDate(),
            dateBox: false,
          },
          Data: [],
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);
          oViewModel.setData(this.initializeModel());

          const aCongList = await this.getAppList();

          oViewModel.setProperty('/CongList', aCongList);
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

      // 상태값 Popover
      onPopover(oEvent) {
        const oButton = oEvent.getSource();

        if (!this._pPopover) {
          const oView = this.getView();

          this._pPopover = Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.congratulation.mobile.fragment.Popover',
            controller: this,
          }).then((oPopover) => {
            oView.addDependent(oPopover);
            return oPopover;
          });
        }

        this._pPopover.then((oPopover) => {
          oPopover.openBy(oButton);
        });
      },

      // 날짜선택
      async onSearchRange() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const aCongList = await this.getAppList();

          oViewModel.setProperty('/CongList', aCongList);
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
