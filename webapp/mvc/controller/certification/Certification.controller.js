sap.ui.define(
  [
    // prettier 방지용 주석
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
          routeName: '',
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

      async onObjectMatched(oParameter, sRouteName) {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);
          oListModel.setProperty('/routeName', sRouteName);

          await this.readCertiList();
          await this.readCertiCount();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          // this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
          oListModel.setProperty('/busy', false);
        }
      },

      async callbackAppointeeChange() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          await this.readCertiList();
          await this.readCertiCount();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onClick() {
        const sRouteName = this.getViewModel().getProperty('/routeName');

        this.getRouter().navTo(`${sRouteName}-detail`, { oDataKey: 'N' });
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          await this.readCertiList();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      async readCertiList() {
        try {
          const oListModel = this.getViewModel();
          const oModel = this.getModel(ServiceNames.PA);
          const oSearch = oListModel.getProperty('/search');
          const aTableList = await Client.getEntitySet(oModel, 'CertificateAppl', {
            Prcty: 'L',
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
            Apbeg: moment(oSearch.secondDate).hours(9).toDate(),
            Apend: moment(oSearch.date).hours(9).toDate(),
          });

          oListModel.setProperty('/List', aTableList);
          oListModel.setProperty('/listInfo', {
            ...TableUtils.count({ oTable: this.byId('certiTable'), aRowData: aTableList }),
            infoMessage: this.getBundleText('MSG_17001'),
            isShowProgress: false,
            isShowApply: true,
            isShowApprove: false,
            isShowReject: false,
            isShowComplete: true,
          });
        } catch (oError) {
          throw oError;
        }
      },

      async readCertiCount() {
        try {
          const oListModel = this.getViewModel();
          const oModel = this.getModel(ServiceNames.PA);
          const [aCertiList, [mCerTextList]] = await Promise.all([
            Client.getEntitySet(oModel, 'CertificateObjList'), //
            Client.getEntitySet(oModel, 'IssuedResults', { Pernr: this.getAppointeeProperty('Pernr') }),
          ]);

          const aList = _.chain(mCerTextList)
            .pickBy((v, p) => _.startsWith(p, 'Cnttx'))
            .map((v) => v)
            .value();

          oListModel.setProperty(
            '/myCerti',
            _.map(aCertiList, (o, i) => _.set(o, 'Text', _.get(aList, i)))
          );
        } catch (oError) {
          throw oError;
        }
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);
        const sRouteName = oListModel.getProperty('/routeName');

        oListModel.setProperty('/parameters', oRowData);
        this.getRouter().navTo(`${sRouteName}-detail`, { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('certiTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_17001');

        TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
