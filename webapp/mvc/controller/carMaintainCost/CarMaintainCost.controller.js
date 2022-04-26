sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
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
    AppUtils,
    AttachFileAction,
    TableUtils,
    TextUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.carMaintainCost.CarMaintainCost', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,

      initializeModel() {
        return {
          busy: false,
          Data: [],
          Total: {},
          routeName: '',
          search: {
            secondDate: new Date(2020, 0, 1),
            date: new Date(new Date().getFullYear(), 12, 0),
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

          const oModel = this.getModel(ServiceNames.BENEFIT);
          const sPernr = this.getAppointeeProperty('Pernr');
          const aMyMaintain = await Client.getEntitySet(oModel, 'MaintenanceCarReport', { Pernr: sPernr });

          oListModel.setProperty('/Total', aMyMaintain[0]);

          const mSearch = oListModel.getProperty('/search');
          const mPayLoad = {
            Pernr: sPernr,
            Begda: moment(mSearch.secondDate).hours(9).toDate(),
            Endda: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            Prcty: 'L',
          };
          const aTableList = await Client.getEntitySet(oModel, 'MaintenanceCarAppl', mPayLoad);
          const oTable = this.byId('carTable');

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

          const oModel = this.getModel(ServiceNames.BENEFIT);
          const sPernr = this.getAppointeeProperty('Pernr');
          const aMyMaintain = await Client.getEntitySet(oModel, 'MaintenanceCarReport', { Pernr: sPernr });

          oListModel.setProperty('/Total', aMyMaintain[0]);

          const mSearch = oListModel.getProperty('/search');
          const mPayLoad = {
            Pernr: sPernr,
            Begda: moment(mSearch.secondDate).hours(9).toDate(),
            Endda: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            Prcty: 'L',
          };
          const aTableList = await Client.getEntitySet(oModel, 'MaintenanceCarAppl', mPayLoad);
          const oTable = this.byId('carTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onClick() {
        this.getRouter().navTo(`${this.getViewModel().getProperty('/routeName')}-detail`, { oDataKey: 'N' });
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR14';
      },

      formatPay(vPay = '0') {
        vPay = this.TextUtils.toCurrency(vPay);

        return vPay;
      },

      thisYear(sYear = String(moment().format('YYYY'))) {
        return this.getBundleText('MSG_25001', sYear);
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const mSearch = oListModel.getProperty('/search');
          const mPayLoad = {
            Pernr: this.getAppointeeProperty('Pernr'),
            Begda: moment(mSearch.secondDate).hours(9).toDate(),
            Endda: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            Prcty: 'L',
          };
          const oModel = this.getModel(ServiceNames.BENEFIT);
          const aTableList = await Client.getEntitySet(oModel, 'MaintenanceCarAppl', mPayLoad);
          const oTable = this.byId('carTable');

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

        this.getRouter().navTo(`${sRouteName}-detail`, { oDataKey: oRowData.Appno, sStatus: oRowData.ZappStatAl });
      },

      onPressExcelDownload() {
        const oTable = this.byId('carTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_25001');

        TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
