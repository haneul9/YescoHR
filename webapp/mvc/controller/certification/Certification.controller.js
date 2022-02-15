sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
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
    FragmentEvent,
    TableUtils,
    TextUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.certification.Certification', {
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          busy: false,
          Data: [],
          LoanType: [],
          TargetCode: {},
          parameters: {},
          search: {
            date: moment().hours(9).toDate(),
            secondDate: moment().startOf('year').hours(9).toDate(),
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
        };
      },

      async onObjectMatched() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.PA);
          const oSearch = oListModel.getProperty('/search');
          const aTableList = await Client.getEntitySet(oModel, 'CertificateAppl', {
            Prcty: 'L',
            Menid: this.getCurrentMenuId(),
            Apbeg: moment(oSearch.secondDate).hours(9).toDate(),
            Apend: moment(oSearch.date).hours(9).toDate(),
          });
          const oTable = this.byId('certiTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/listInfo/infoMessage', this.getBundleText('MSG_17001'));
          oListModel.setProperty('/listInfo/isShowProgress', false);
          oListModel.setProperty('/listInfo/isShowApply', true);
          oListModel.setProperty('/listInfo/isShowApprove', false);
          oListModel.setProperty('/listInfo/isShowReject', false);
          oListModel.setProperty('/listInfo/isShowComplete', true);
          oListModel.setProperty('/List', aTableList);

          const aCertiList = await Client.getEntitySet(oModel, 'CertificateObjList');
          const aCerTextList = await Client.getEntitySet(oModel, 'IssuedResults');

          delete aCerTextList[0].__metadata;
          delete aCerTextList[0].Pernr;

          const aList = [];

          _.map(aCerTextList[0], (v) => {
            aList.push(v);
          });

          _.each(aCertiList, (v, i) => {
            v.Text = aList[i];
          });

          oListModel.setProperty('/myCerti', aCertiList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onClick() {
        this.getRouter().navTo('certification-detail', { oDataKey: 'N' });
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.PA);
          const oSearch = oListModel.getProperty('/search');
          const aTableList = await Client.getEntitySet(oModel, 'CertificateAppl', {
            Prcty: 'L',
            Menid: this.getCurrentMenuId(),
            Apbeg: moment(oSearch.secondDate).hours(9).toDate(),
            Apend: moment(oSearch.date).hours(9).toDate(),
          });
          const oTable = this.byId('certiTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/listInfo/infoMessage', this.getBundleText('MSG_17001'));
          oListModel.setProperty('/listInfo/isShowProgress', false);
          oListModel.setProperty('/listInfo/isShowApply', true);
          oListModel.setProperty('/listInfo/isShowApprove', false);
          oListModel.setProperty('/listInfo/isShowReject', false);
          oListModel.setProperty('/listInfo/isShowComplete', true);
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

        oListModel.setProperty('/parameters', oRowData);
        this.getRouter().navTo('certification-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('certiTable');
        const aTableData = this.getViewModel().getProperty('/ZappStatAl');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_17001');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
