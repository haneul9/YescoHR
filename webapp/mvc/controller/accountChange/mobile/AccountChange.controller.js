sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    AttachFileAction,
    TableUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.accountChange.mobile.AccountChange', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,

      initializeModel() {
        return {
          busy: false,
          Data: [],
          MyAcc: {},
          search: {
            dateRange: '12m',
            secondDate: moment().toDate(),
            date: moment().subtract(12, 'months').toDate(),
            dateBox: false,
          },
          listInfo: {
            totalCount: 0,
          },
        };
      },

      async onObjectMatched() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const mPernr = {};

          if (this.isHass()) {
            const sPernr = this.getAppointeeProperty('Pernr');

            mPernr.Pernr = sPernr;
          }

          const mMyAccPayLoad = {
            Menid: this.getCurrentMenuId(),
            ...mPernr,
          };
          const oModel = this.getModel(ServiceNames.PAY);
          // 나의 계좌정보
          const [aMyAcc] = await Client.getEntitySet(oModel, 'CurrentAcctInfo', mMyAccPayLoad);

          oListModel.setProperty('/MyAcc', aMyAcc);

          const mSearch = oListModel.getProperty('/search');
          const mPayLoad = {
            Apbeg: moment(mSearch.date).hours(9).toDate(),
            Apend: moment(mSearch.secondDate).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            ...mPernr,
          };

          const aList = await Client.getEntitySet(oModel, 'BankAccount', mPayLoad);

          oListModel.setProperty('/listInfo/totalCount', _.size(aList));
          oListModel.setProperty('/Data', aList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      formatYear(sYearMon) {
        return !sYearMon ? '' : `${sYearMon.slice(0, 4)}-${sYearMon.slice(4)}` + ` ` + this.getBundleText('LABEL_26015');
      },

      onClick() {
        this.getRouter().navTo('mobile/accountChange-detail', { oDataKey: 'N' });
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR16';
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const mPernr = {};

          if (this.isHass()) {
            const sPernr = this.getAppointeeProperty('Pernr');

            mPernr.Pernr = sPernr;
          }

          const mMyAccPayLoad = {
            Menid: this.getCurrentMenuId(),
            ...mPernr,
          };

          const oModel = this.getModel(ServiceNames.PAY);
          // 나의 계좌정보
          const [aMyAcc] = await Client.getEntitySet(oModel, 'CurrentAcctInfo', mMyAccPayLoad);

          oListModel.setProperty('/MyAcc', aMyAcc);

          const mSearch = oListModel.getProperty('/search');
          const mPayLoad = {
            Apbeg: moment(mSearch.date).hours(9).toDate(),
            Apend: moment(mSearch.secondDate).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            ...mPernr,
          };

          const aList = await Client.getEntitySet(oModel, 'BankAccount', mPayLoad);

          oListModel.setProperty('/listInfo/totalCount', _.size(aList));
          oListModel.setProperty('/Data', aList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // onSelectRow(oEvent) {
      //   const vPath = oEvent.getParameter('rowBindingContext').getPath();
      //   const oListModel = this.getViewModel();
      //   const oRowData = oListModel.getProperty(vPath);

      //   this.getRouter().navTo('accountChange-detail', { oDataKey: oRowData.Appno });
      // },

      onSelectRow(oEvent) {
        const vPath = oEvent.getSource().getBindingContext().getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        if (isNaN(oRowData.Appno)) return;

        this.getRouter().navTo('mobile/accountChange-detail', { oDataKey: _.trimStart(oRowData.Appno, '0') });
      },

      // 날짜선택
      async onSearchRange() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          await this.onSearch();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
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

            await this.onSearch();
          }

          oViewModel.setProperty('/search/dateBox', bDateRangeBox);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },
    });
  }
);
