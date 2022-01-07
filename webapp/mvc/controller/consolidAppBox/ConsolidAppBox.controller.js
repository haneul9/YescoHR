sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils,
    ComboEntry,
    FragmentEvent,
    TableUtils,
    TextUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.consolidAppBox.ConsolidAppBox', {
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const dDate = new Date();
        const oViewModel = new JSONModel({
          busy: false,
          AppType: [],
          parameters: {},
          search: {
            date: dDate,
            secondDate: new Date(dDate.getFullYear(), dDate.getMonth() - 1, dDate.getDate() + 1),
          },
          listInfo: {
            isShowProgress: true,
            isShowApply: true,
            isShowApprove: true,
            isShowReject: true,
            isShowComplete: true,
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

      async onObjectMatched() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.COMMON);
          const oSearch = oListModel.getProperty('/search');
          const aTableList = await Client.getEntitySet(oModel, 'TotalApproval2', {
            ZreqForm: oSearch.ZreqForm || '',
            MidE: this.getCurrentMenuId(),
            Begda: moment(oSearch.secondDate).hours(9).toDate(),
            Endda: moment(oSearch.date).hours(9).toDate(),
          });
          const oTable = this.byId('consolidTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/listInfo/infoMessage', this.getBundleText('MSG_19001'));
          oListModel.setProperty('/List', aTableList);

          const aAppList = await Client.getEntitySet(oModel, 'TotalApproval3');

          oListModel.setProperty('/AppType', new ComboEntry({ codeKey: 'ZreqForm', valueKey: 'ZreqForx', aEntries: aAppList }));
          oListModel.setProperty('/search/ZreqForm', 'ALL');

          const aMyTotalList = await Client.getEntitySet(oModel, 'TotalApproval1');

          oListModel.setProperty('/Total', aMyTotalList[0]);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.COMMON);
          const oSearch = oListModel.getProperty('/search');
          const aTableList = await Client.getEntitySet(oModel, 'TotalApproval2', {
            ZreqForm: oSearch.ZreqForm || '',
            MidE: this.getCurrentMenuId(),
            Begda: moment(oSearch.secondDate).hours(9).toDate(),
            Endda: moment(oSearch.date).hours(9).toDate(),
          });
          const oTable = this.byId('consolidTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/listInfo/infoMessage', this.getBundleText('MSG_19001'));
          oListModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);
        const sMenuUrl = `${AppUtils.getAppComponent().getMenuModel().getProperties(`${oRowData.MidE}/Mnurl`)}-detail`;

        this.getRouter().navTo(sMenuUrl, { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('consolidTable');
        const aTableData = this.getViewModel().getProperty('/ZappStatAl');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_19001');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
