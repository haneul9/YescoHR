sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
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
    AttachFileAction,
    FragmentEvent,
    TableUtils,
    TextUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.accountChange.AccountChange', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          busy: false,
          Data: [],
          MyAcc: {},
          search: {
            secondDate: moment().subtract(1, 'years').add(1, 'day').toDate(),
            date: moment().toDate(),
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
            Apbeg: moment(mSearch.secondDate).hours(9).toDate(),
            Apend: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            ...mPernr,
          };
          const aTableList = await Client.getEntitySet(oModel, 'BankAccount', mPayLoad);
          const oTable = this.byId('accTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      async onRefresh() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const mMyAccPayLoad = {
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
          };
          const oModel = this.getModel(ServiceNames.PAY);
          // 나의 계좌정보
          const aMyAcc = await Client.getEntitySet(oModel, 'CurrentAcctInfo', mMyAccPayLoad);

          oListModel.setProperty('/MyAcc', aMyAcc[0]);

          this.onSearch();
          this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onClick() {
        this.getRouter().navTo('accountChange-detail', { oDataKey: 'N' });
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
            Apbeg: moment(mSearch.secondDate).hours(9).toDate(),
            Apend: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            ...mPernr,
          };
          const aTableList = await Client.getEntitySet(oModel, 'BankAccount', mPayLoad);
          const oTable = this.byId('accTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
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

        this.getRouter().navTo('accountChange-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('accTable');
        const aTableData = this.getViewModel().getProperty('/List');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_26001');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
