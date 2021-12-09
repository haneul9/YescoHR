sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
	AttachFileAction,
	FragmentEvent,
	TableUtils,
	TextUtils,
	ServiceNames,
	BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.notice.Notice', {
      TYPE_CODE: '10',

      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const dDate = new Date();
        const oViewModel = new JSONModel({
          busy: false,
          Hass: this.isHass(),
          Data: [],
          search: {
            date: new Date(dDate.getFullYear(), dDate.getMonth() + 1, 0),
            secondDate: new Date(dDate.getFullYear(), dDate.getMonth() - 1, 1),
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
        });

        this.setViewModel(oViewModel);
      },

      onObjectMatched() {
        this.onSearch();
      },

      onClick() {
        this.getRouter().navTo(this.isHass() ? 'h/notice-detail' : 'notice-detail', { oDataKey: 'N' });
      },

      onSearch() {
        const oModel = this.getModel(ServiceNames.COMMON);
        const oListModel = this.getViewModel();
        const oTable = this.byId('noticeTable');
        const oSearch = oListModel.getProperty('/search');
        const dDate = moment(oSearch.secondDate).hours(9).toDate();
        const dDate2 = moment(oSearch.date).hours(9).toDate();
        const sMenid = this.getCurrentMenuId();
        const sWerks = this.getSessionProperty('Werks');

        oListModel.setProperty('/busy', true);

        let oSendObject = {
          Prcty: '0',
          Menid: sMenid,
          Begda: dDate,
          Endda: dDate2,
          Werks: sWerks,
          Title: oSearch.title || '',
          Notice1Nav: [],
          Notice2Nav: [],
        };

        oModel.create('/NoticeManageSet', oSendObject, {
          success: (oData) => {
            if (oData) {
              const oList = oData.Notice1Nav.results;

              oListModel.setProperty('/NoticeList', oList);
              oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: oList }));
              oListModel.setProperty('/listInfo/Title', this.getBundleText('LABEL_00166'));
              oListModel.setProperty('/listInfo/visibleStatus', 'X');
              oListModel.setProperty('/busy', false);
            }
          },
          error: (oError) => {
            AppUtils.handleError(oError);
            oListModel.setProperty('/busy', false);
          },
        });
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getViewModel().setProperty('/parameter', oRowData);
        this.getRouter().navTo(this.isHass() ? 'h/notice-detail' : 'notice-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('noticeTable');
        const aTableData = this.getViewModel().getProperty('/NoticeList');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_08001');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);