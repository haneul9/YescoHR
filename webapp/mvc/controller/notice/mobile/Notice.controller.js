sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/mobile/ListStatusPopover',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    AttachFileAction,
    TableUtils,
    TextUtils,
    Client,
    ServiceNames,
    ListStatusPopover,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.notice.mobile.Notice', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      ListStatusPopover: ListStatusPopover,
      TextUtils: TextUtils,

      initializeModel() {
        return {
          busy: false,
          Hass: this.isHass(),
          Data: [],
          search: {
            dateRange: '1w',
            dateBox: false,
            date: moment().subtract(1, 'month').set('date', 1).hours(9).toDate(),
            secondDate: moment().endOf('month').hours(9).toDate(),
            title: '',
          },
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            Popover: true,
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

      // override AttachFileCode
      getApprovalType() {
        return '10';
      },

      // 조회
      async getListSearch() {
        const oModel = this.getModel(ServiceNames.COMMON);
        const oListModel = this.getViewModel();
        const oSearch = oListModel.getProperty('/search');
        const dDate = moment(oSearch.date).hours(9).toDate();
        const dDate2 = moment(oSearch.secondDate).hours(9).toDate();
        const sMenid = this.getCurrentMenuId();
        const sWerks = this.getSessionProperty('Werks');

        oListModel.setProperty('/busy', true);

        let mPayLoad = {
          Prcty: '0',
          Menid: sMenid,
          Begda: dDate,
          Endda: dDate2,
          Werks: sWerks,
          Title: oSearch.title || '',
          Notice1Nav: [],
          Notice2Nav: [],
        };

        return await Client.deep(oModel, 'NoticeManage', mPayLoad);
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          const oData = await this.getListSearch();
          const aList = oData.Notice1Nav.results;

          oListModel.setProperty('/NoticeList', aList);
          oListModel.setProperty('/listInfo/totalCount', _.size(aList));
          oListModel.setProperty('/listInfo/Title', this.getBundleText('LABEL_08001'));
          oListModel.setProperty('/listInfo/Popover', false);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // 검색 날짜 선택
      async onSearchList(oEvent) {
        const oListModel = this.getViewModel();

        try {
          const sKey = oEvent.getSource().getSelectedKey();
          let dBegda = moment().toDate();
          let dEndda = moment().toDate();
          let bDateRangeBox = false;

          oListModel.setProperty('/busy', true);

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
            oListModel.setProperty('/search/secondDate', dBegda);
            oListModel.setProperty('/search/date', dEndda);

            const oData = await this.getListSearch();
            const aList = oData.Notice1Nav.results;

            oListModel.setProperty('/NoticeList', aList);
            oListModel.setProperty('/listInfo/totalCount', _.size(aList));
          }

          oListModel.setProperty('/search/dateBox', bDateRangeBox);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getSource().getBindingContext().getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getViewModel().setProperty('/parameter', oRowData);
        this.getRouter().navTo('mobile/notice-detail', { Sdate: oRowData.Sdate.getTime(), Seqnr: oRowData.Seqnr });
      },
    });
  }
);
