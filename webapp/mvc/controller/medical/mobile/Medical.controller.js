sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    ServiceNames,
    Client,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.medical.mobile.Medical', {
      initializeModel() {
        return {
          busy: false,
          search: {
            dateRange: '12m',
            date: moment().subtract(12, 'months').add(1, 'day').toDate(),
            secondDate: new Date(),
            dateBox: false,
          },
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
          Total: {
            Btnyn: 'N',
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

            this.onSearch();
          }

          oViewModel.setProperty('/search/dateBox', bDateRangeBox);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR09';
      },

      async onSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          await Promise.all([this.getApplyList(), this.totalCount()]);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async getApplyList() {
        const oViewModel = this.getViewModel();
        oViewModel.setProperty('/busy', true);

        const mSearch = oViewModel.getProperty('/search');
        const mPayLoad = {
          Prcty: 'L',
          Menid: this.getCurrentMenuId(),
          Apbeg: moment(mSearch.date).hours(9).toDate(),
          Apend: moment(mSearch.secondDate).hours(9).toDate(),
          Famgb: 'ALL',
          Famsa: 'ALL',
          Objps: 'ALL',
          Kdsvh: 'ALL',
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        const oModel = this.getModel(ServiceNames.BENEFIT);
        const aList = await Client.getEntitySet(oModel, 'MedExpenseAppl', mPayLoad);

        oViewModel.setProperty('/List', aList);
        oViewModel.setProperty('/listInfo/totalCount', _.size(aList));
      },

      async totalCount() {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const [mTotal] = await Client.getEntitySet(oModel, 'MedExpenseMymed', { Pernr: this.getAppointeeProperty('Pernr') });

        oViewModel.setProperty('/Total', mTotal);

        if (!!mTotal.Note) {
          oViewModel.setProperty('/listInfo/infoMessage', mTotal.Note);
        }
      },

      onSelectRow(oEvent) {
        const sAppno = oEvent.getSource().getBindingContext().getProperty('Appno');

        this.getRouter().navTo('mobile/medical-detail', { oDataKey: sAppno });
      },

      onClick() {
        this.getRouter().navTo('mobile/medical-detail', { oDataKey: 'N' });
      },
    });
  }
);
