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

    return BaseController.extend('sap.ui.yesco.mvc.controller.attendance.mobile.List', {
      PAGE_TYPE: { NEW: 'A', CHANGE: 'B', CANCEL: 'C' },

      initializeModel() {
        return {
          busy: false,
          search: {
            dateRange: '12m',
            secondDate: moment().toDate(),
            date: moment().subtract(12, 'months').toDate(),
            dateBox: false,
          },
          Data: [],
          listInfo: {
            rowCount: 1,
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
        this.onSearchRange();
      },

      // 날짜선택
      async onSearchRange() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const aList = await this.getList();

          oViewModel.setProperty('/list', aList);
          oViewModel.setProperty('/listInfo/totalCount', _.size(aList));
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 신청내역 조회
      async getList() {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mSearch = oViewModel.getProperty('/search');
        const mPayLoad = {
          Menid: this.getCurrentMenuId(),
          Pernr: this.getAppointeeProperty('Pernr'),
          Apbeg: moment(mSearch.date).hours(9).toDate(),
          Apend: moment(mSearch.secondDate).hours(9).toDate(),
        };

        return await Client.getEntitySet(oModel, 'LeaveApplContent', mPayLoad);
      },

      // 검색 날짜 선택
      async onSearchList(oEvent) {
        const oViewModel = this.getViewModel();
        oViewModel.setProperty('/busy', true);

        try {
          const sKey = oEvent.getSource().getSelectedKey();
          const dEndda = moment();

          switch (sKey) {
            case '1w':
              dEndda.subtract(7, 'day');
              break;
            case '1m':
              dEndda.subtract(1, 'months');
              break;
            case '3m':
              dEndda.subtract(3, 'months');
              break;
            case '6m':
              dEndda.subtract(6, 'months');
              break;
            case '12m':
              dEndda.subtract(12, 'months');
              break;
            default:
              break;
          }

          const bDateRangeBox = sKey === '0';
          if (!bDateRangeBox) {
            oViewModel.setProperty('/search/secondDate', moment().toDate());
            oViewModel.setProperty('/search/date', dEndda.toDate());

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

      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const vPath = oEvent.getSource().getBindingContext().getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        if (isNaN(oRowData.Appno)) return;

        oViewModel.setProperty('/parameter/rowData', [oRowData]);
        this.getRouter().navTo(`mobile/attendance-detail${oRowData.Appty}`, { appno: _.isEqual(oRowData.Appno, '00000000000000') ? 'NA' : oRowData.Appno });
      },

      onPressNewApprovalBtn() {
        this.getRouter().navTo('mobile/attendance-detailA');
      },

      onPressModApprovalBtn() {
        // this.setRowActionParameters();
        this.getRouter().navTo('mobile/attendance-detailB');
      },

      onPressCancApprovalBtn() {
        // this.setRowActionParameters();
        this.getRouter().navTo('mobile/attendance-detailC');
      },

      setRowActionParameters() {
        const oViewModel = this.getViewModel();
        const aSelectedIndices = oViewModel.getProperty('/parameter/selectedIndices');

        oViewModel.setProperty(
          '/parameter/rowData',
          aSelectedIndices.map((idx) => oViewModel.getProperty(`/list/${idx}`))
        );
      },

      onChangeIndication(sValue) {
        return sValue === 'A' ? 'Indication05' : sValue === 'B' ? 'Indication03' : 'Indication04';
      },
    });
  }
);
