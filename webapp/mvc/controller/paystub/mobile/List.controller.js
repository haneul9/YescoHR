sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/mobile/ListStatusPopover',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    AppUtils,
    ListStatusPopover,
    Client,
    ServiceNames,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.paystub.mobile.List', {
      TableUtils: TableUtils,
      ListStatusPopover: ListStatusPopover,
      TABLE_ID: 'paystubTable',

      initializeModel() {
        const today = moment();

        return {
          busy: false,
          search: {
            year: today.format('YYYY'),
            fromMonth: today.format('MM'),
            toMonth: today.format('MM'),
            begym: moment(moment().subtract(12, 'months').toDate()).format('YYYYMM'),
            endym: today.format('YYYYMM'),
            secondDate: moment().toDate(),
            date: moment().subtract(12, 'months').toDate(),
            dateBox: false,
            dateRange: '12m',
          },
          listInfo: {
            Title: this.getBundleText('LABEL_13037'), // 급상여내역
            view1wButton: false,
            rowCount: 2,
            totalCount: 0,
            Popover: false,
            // infoMessage: this.getBundleText('MSG_13001'), // 라인을 클릭하시면 상세내역이 조회됩니다.
            isShowProgress: false,
            progressCount: 0,
            isShowApply: false,
            applyCount: 0,
            isShowApprove: false,
            approveCount: 0,
            isShowReject: false,
            rejectCount: 0,
            isShowComplete: false,
            completeCount: 0,
          },
          list: [],
        };
      },

      onBeforeShow() {},

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        if (AppUtils.isPRD() && !this.serviceAvailable()) return;

        try {
          oViewModel.setProperty('/busy', true);

          const aList = await this.getList();

          oViewModel.setProperty('/list', aList);
          oViewModel.setProperty('/listInfo/totalCount', _.size(aList));
        } catch (oError) {
          this.debug('Controller > mobile paystub List > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      serviceAvailable() {
        const bOpen = moment().isAfter(moment('2022-04-04 9:00', 'YYYY-MM-DD HH:mm'));

        if (!bOpen)
          MessageBox.alert(this.getBundleText('MSG_13002'), {
            onClose: () => this.onNavBack(),
          });

        return bOpen;
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/

      onSelectRow(oEvent) {
        const vPath = oEvent.getSource().getBindingContext().getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        if (isNaN(oRowData.Seqnr)) return;

        this.getRouter().navTo('mobile/paystub-detail', { seqnr: _.trimStart(oRowData.Seqnr, '0') });
      },

      onChangeIndication(sValue) {
        return sValue === '' ? 'Indication05' : 'Indication04';
      },

      // 날짜선택
      async onSearchRange() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          oViewModel.setProperty('/search/begym', moment(oViewModel.getProperty('/search/date')).format('YYYYMM'));
          oViewModel.setProperty('/search/endym', moment(oViewModel.getProperty('/search/secondDate')).format('YYYYMM'));

          const aList = await this.getList();

          oViewModel.setProperty('/list', aList);
          oViewModel.setProperty('/listInfo/totalCount', _.size(aList));
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
              dBegda = moment().subtract(7, 'day').toDate();
              bDateRangeBox = false;
              break;
            case '1m':
              dBegda = moment().subtract(1, 'months').add(1, 'day').toDate();
              bDateRangeBox = false;
              break;
            case '3m':
              dBegda = moment().subtract(3, 'months').add(1, 'day').toDate();
              bDateRangeBox = false;
              break;
            case '6m':
              dBegda = moment().subtract(6, 'months').add(1, 'day').toDate();
              bDateRangeBox = false;
              break;
            case '12m':
              dBegda = moment().subtract(12, 'months').add(1, 'day').toDate();
              bDateRangeBox = false;
              break;
            case '0':
              bDateRangeBox = true;
              break;
          }

          if (!bDateRangeBox) {
            oViewModel.setProperty('/search/date', dBegda);
            oViewModel.setProperty('/search/secondDate', dEndda);
            oViewModel.setProperty('/search/begym', moment(dBegda).format('YYYYMM'));
            oViewModel.setProperty('/search/endym', moment(dEndda).format('YYYYMM'));

            const aList = await this.getList();

            oViewModel.setProperty('/list', aList);
            oViewModel.setProperty('/listInfo/totalCount', _.size(aList));
          }

          oViewModel.setProperty('/search/dateBox', bDateRangeBox);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/

      async getList() {
        const oModel = this.getModel(ServiceNames.PAY);
        const oViewModel = this.getViewModel();
        const sBegym = oViewModel.getProperty('/search/begym'),
          sEndym = oViewModel.getProperty('/search/endym');

        return await Client.getEntitySet(oModel, 'PayslipList', {
          Menid: this.getCurrentMenuId(),
          Begym: sBegym,
          Endym: sEndym,
        });
      },
    });
  }
);
