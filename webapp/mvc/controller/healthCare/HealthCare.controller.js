sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Year', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils,
    AttachFileAction,
    ComboEntry,
    FragmentEvent,
    TableUtils,
    TextUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.healthCare.HealthCare', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      onInit() {
        BaseController.prototype.onInit.apply(this, arguments);

        const dDate = new Date();
        const oViewModel = new JSONModel({
          busy: false,
          TargetCode: [],
          search: {
            date: new Date(dDate.getFullYear(), 12, 0),
            secondDate: new Date(dDate.getFullYear(), 0, 1),
            Ptype: '',
          },
          Total: {
            Zyear: '',
            HealthTot: '',
            HealthIng: '',
            HealthCom: '',
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

      async onObjectMatched() {
        const oListModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.BENEFIT);

        try {
          oListModel.setProperty('/busy', true);
          const aTargetList = await Client.getEntitySet(oModel, 'HealthCarePtype');

          oListModel.setProperty('/TargetCode', new ComboEntry({ codeKey: 'Ptype', valueKey: 'PtypeTxt', aEntries: aTargetList }));
          oListModel.setProperty('/search/Ptype', 'ALL');

          const mSearch = oListModel.getProperty('/search');
          const mPayLoad = {
            Begda: moment(mSearch.secondDate).hours(9).toDate(),
            Endda: moment(mSearch.date).hours(9).toDate(),
            Ptype: mSearch.Ptype,
          };
          const aTableList = await Client.getEntitySet(oModel, 'HealthCareContents', mPayLoad);
          const oTable = this.byId('healthTable');

          oListModel.setProperty('/List', aTableList);
          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/listInfo/visibleStatus', 'X');
          oListModel.setProperty('/listInfo/Title', this.getBundleText('LABEL_14006'));

          const aTotaltList = await Client.getEntitySet(oModel, 'HealthCareCount');

          oListModel.setProperty('/Total/HealthTot', aTotaltList[0].HealthTot);
          oListModel.setProperty('/Total/HealthIng', aTotaltList[0].HealthIng);
          oListModel.setProperty('/Total/HealthCom', aTotaltList[0].HealthCom);
          oListModel.setProperty('/Total/Zyear', moment().year());
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      formatNumber(vNum = '0') {
        return !vNum ? '0' : vNum;
      },

      thisYear(sYear = String(moment().format('YYYY'))) {
        return this.getBundleText('MSG_21001', sYear);
      },

      async onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();
        const mSearch = oListModel.getProperty('/search');
        const mPayLoad = {
          Begda: moment(mSearch.secondDate).hours(9).toDate(),
          Endda: moment(mSearch.date).hours(9).toDate(),
          Ptype: mSearch.Ptype,
        };

        oListModel.setProperty('/busy', true);

        try {
          const aTableList = await Client.getEntitySet(oModel, 'HealthCareContents', mPayLoad);
          const oTable = this.byId('healthTable');

          oListModel.setProperty('/List', aTableList);
          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/listInfo/visibleStatus', 'X');
          oListModel.setProperty('/listInfo/Title', this.getBundleText('LABEL_14006'));
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
        this.getRouter().navTo('healthCare-detail', { oDataKey: oRowData.Seqnr });
      },

      onPressExcelDownload() {
        const oTable = this.byId('healthTable');
        const aTableData = this.getViewModel().getProperty('/List');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_21001');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
