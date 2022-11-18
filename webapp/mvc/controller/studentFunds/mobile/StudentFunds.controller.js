sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.studentFunds.mobile.StudentFunds', {
      initializeModel() {
        return {
          busy: true,
          search: {
            dateRange: '12m',
            date: moment().subtract(1, 'year').toDate(),
            secondDate: moment().toDate(),
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

      onObjectMatched() {
        this.onSearch();
      },

      // DareRangeSelection change event handler
      onSearchRange() {
        this.onSearch();
      },

      // SegmentedButton selectionChange event handler
      async onSearchList(oEvent) {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const sKey = oEvent.getSource().getSelectedKey();
          let oEndda;

          switch (sKey) {
            case '1w':
              oEndda = moment().subtract(7, 'day').toDate();
              break;
            case '1m':
              oEndda = moment().subtract(1, 'months').add(1, 'day').toDate();
              break;
            case '3m':
              oEndda = moment().subtract(3, 'months').add(1, 'day').toDate();
              break;
            case '6m':
              oEndda = moment().subtract(6, 'months').add(1, 'day').toDate();
              break;
            case '12m':
              oEndda = moment().subtract(12, 'months').add(1, 'day').toDate();
              break;
            default:
              oEndda = moment().toDate();
          }

          const bDateRangeBox = sKey === '0';
          if (!bDateRangeBox) {
            oViewModel.setProperty('/search/date', oEndda);
            oViewModel.setProperty('/search/secondDate', moment().toDate());

            const aList = await this.getStudentFundList();

            oViewModel.setProperty('/StudentList', aList);
            oViewModel.setProperty('/listInfo/totalCount', _.size(aList));
          }

          oViewModel.setProperty('/search/dateBox', bDateRangeBox);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 신청내역 조회
      async onSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const aList = await this.getStudentFundList();

          oViewModel.setProperty('/StudentList', aList);
          oViewModel.setProperty('/listInfo/totalCount', _.size(aList));
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 학자금 신청내역
      getStudentFundList() {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const mSearch = oViewModel.getProperty('/search');
        const mPayLoad = {
          Prcty: 'L',
          Menid: this.getCurrentMenuId(),
          Pernr: this.getAppointeeProperty('Pernr'),
          Apbeg: moment(mSearch.date).hours(9).toDate(),
          Apend: moment(mSearch.secondDate).hours(9).toDate(),
        };

        return Client.getEntitySet(oModel, 'SchExpenseAppl', mPayLoad);
      },

      onSelectRow(oEvent) {
        const sAppno = oEvent.getSource().getBindingContext().getProperty('Appno');

        this.getRouter().navTo('mobile/studentFunds-detail', { oDataKey: sAppno });
      },

      onClick() {
        this.getRouter().navTo('mobile/studentFunds-detail', { oDataKey: 'N' });
      },
    });
  }
);
