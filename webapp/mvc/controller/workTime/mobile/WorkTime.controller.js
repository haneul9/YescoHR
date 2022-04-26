sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/mobile/ListStatusPopover',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    AttachFileAction,
    TableUtils,
    TextUtils,
    ListStatusPopover,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.workTime.mobile.WorkTime', {
      sDialChartId: 'dialChart',

      AttachFileAction: AttachFileAction,
      ListStatusPopover: ListStatusPopover,
      TableUtils: TableUtils,
      TextUtils: TextUtils,

      initializeModel() {
        return {
          busy: false,
          Data: [],
          MyWork: {},
          search: {
            dateRange: '12m',
            secondDate: moment().toDate(),
            date: moment().subtract(12, 'months').toDate(),
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

          const mMyWorkPayLoad = {
            Menid: this.getCurrentMenuId(),
            ...mPernr,
          };
          const oModel = this.getModel(ServiceNames.WORKTIME);
          // 나의 근무시간현황
          const [aMyWork] = await Client.getEntitySet(oModel, 'WorkingTime', mMyWorkPayLoad);

          oListModel.setProperty('/MyWork', aMyWork);
          // this.buildDialChart(aMyWork);
          const mSearch = oListModel.getProperty('/search');
          const mPayLoad = {
            Apbeg: moment(mSearch.date).hours(9).toDate(),
            Apend: moment(mSearch.secondDate).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            ...mPernr,
          };
          const aList = await Client.getEntitySet(oModel, 'OtWorkApply', mPayLoad);

          oListModel.setProperty('/List', aList);
          oListModel.setProperty('/listInfo/totalCount', _.size(aList));
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      async callbackAppointeeChange() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const mMyWork = {
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
          };
          const oModel = this.getModel(ServiceNames.WORKTIME);
          // 나의 근무시간현황
          const [aMyWork] = await Client.getEntitySet(oModel, 'WorkingTime', mMyWork);

          oListModel.setProperty('/MyWork', aMyWork);
          // this.buildDialChart(aMyWork);
          this.onSearch();
          // this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          $(`#${this.sDialChartId}`).css({ top: '20px' });
          oListModel.setProperty('/busy', false);
        }
      },

      // 근무시간
      formatTime(sTime1 = '', sTime2 = '', sTime3) {
        sTime1 = !sTime1 ? '0' : `${sTime1.slice(-4, -2)}:${sTime1.slice(-2)}`;
        sTime2 = !sTime2 ? '0' : `${sTime2.slice(-4, -2)}:${sTime2.slice(-2)}`;

        return sTime1 + '~' + sTime2 + '(' + sTime3 + ')';
      },

      formatWeek(sWeek = '') {
        return `${this.getBundleText('MSG_27001', sWeek)}`;
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR17';
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

          const mSearch = oListModel.getProperty('/search');
          const mPayLoad = {
            Apbeg: moment(mSearch.date).hours(9).toDate(),
            Apend: moment(mSearch.secondDate).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            ...mPernr,
          };
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const aTableList = await Client.getEntitySet(oModel, 'OtWorkApply', mPayLoad);

          oListModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onClick() {
        this.getRouter().navTo('mobile/workTime-detail', { oDataKey: 'N' });
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getSource().getBindingContext().getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        if (isNaN(oRowData.Appno)) return;

        this.getRouter().navTo('mobile/workTime-detail', { oDataKey: _.trimStart(oRowData.Appno, '0') });
      },

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
