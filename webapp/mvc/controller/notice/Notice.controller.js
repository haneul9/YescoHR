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

    return BaseController.extend('sap.ui.yesco.mvc.controller.notice.Notice', {
      initializeModel() {
        return {
          busy: false,
          Hass: this.isHass(),
          Data: [],
          search: {
            date: moment().endOf('month').hours(9).toDate(),
            secondDate: moment().subtract(1, 'month').set('date', 1).hours(9).toDate(),
            title: '',
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

      onObjectMatched() {
        this.onSearch();
      },

      // override AttachFileCode
      getApprovalType() {
        return '10';
      },

      onClick() {
        this.getRouter().navTo(this.isHass() ? 'h/notice-detail' : 'notice-detail', { Sdate: 'N', Seqnr: 'N' });
      },

      async onSearch() {
        const oModel = this.getModel(ServiceNames.COMMON);
        const oViewModel = this.getViewModel();
        const oTable = this.byId('noticeTable');
        const oSearch = oViewModel.getProperty('/search');
        const dDate = moment(oSearch.secondDate).hours(9).toDate();
        const dDate2 = moment(oSearch.date).hours(9).toDate();
        const sMenid = this.getCurrentMenuId();
        const sWerks = this.getSessionProperty('Werks');

        oViewModel.setProperty('/busy', true);

        try {
          const mSendObject = {
            Prcty: '0',
            Menid: sMenid,
            Begda: dDate,
            Endda: dDate2,
            Werks: sWerks,
            Title: oSearch.title || '',
            Notice1Nav: [],
          };

          const oData = await Client.deep(oModel, 'NoticeManage', mSendObject);
          const aList = oData.Notice1Nav.results;

          oViewModel.setProperty('/NoticeList', aList);
          oViewModel.setProperty('/listInfo', {
            ...this.TableUtils.count({ oTable, aRowData: aList }),
            Title: this.getBundleText('LABEL_00166'),
            visibleStatus: 'X',
          });
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getViewModel().setProperty('/parameter', oRowData);
        this.getRouter().navTo(this.isHass() ? 'h/notice-detail' : 'notice-detail', { Sdate: oRowData.Sdate.getTime(), Seqnr: oRowData.Seqnr });
      },

      onPressExcelDownload() {
        const oTable = this.byId('noticeTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_08001');

        this.TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
