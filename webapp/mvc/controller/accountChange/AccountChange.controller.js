sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    AttachFileAction,
    TableUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.accountChange.AccountChange', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,

      initializeModel() {
        return {
          busy: false,
          Data: [],
          MyAcc: {},
          routeName: '',
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

      async onObjectMatched(oParameter, sRouteName) {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);
          oListModel.setProperty('/routeName', sRouteName);

          const sPernr = this.getAppointeeProperty('Pernr');
          const mMyAccPayLoad = {
            Menid: this.getCurrentMenuId(),
            Pernr: sPernr,
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
            Pernr: sPernr,
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
      async callbackAppointeeChange() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const sPernr = this.getAppointeeProperty('Pernr');
          const mMyAccPayLoad = {
            Menid: this.getCurrentMenuId(),
            Pernr: sPernr,
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
            Pernr: sPernr,
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

      formatYear(sYearMon) {
        return !sYearMon ? '' : `${sYearMon.slice(0, 4)}-${sYearMon.slice(4)}`;
      },

      onClick() {
        this.getRouter().navTo(`${this.getViewModel().getProperty('/routeName')}-detail`, { oDataKey: 'N' });
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR16';
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const sPernr = this.getAppointeeProperty('Pernr');
          const mMyAccPayLoad = {
            Menid: this.getCurrentMenuId(),
            Pernr: sPernr,
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
            Pernr: sPernr,
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
        const sRouteName = oListModel.getProperty('/routeName');

        this.getRouter().navTo(`${sRouteName}-detail`, { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('accTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_26001');

        TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
