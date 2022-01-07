sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AttachFileAction,
    ComboEntry,
    FragmentEvent,
    TableUtils,
    TextUtils,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.medical.Medical', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const dDate = new Date();
        const oViewModel = new JSONModel({
          busy: false,
          Data: [],
          LoanType: [],
          TargetCode: {},
          parameters: {},
          search: {
            date: new Date(dDate.getFullYear(), 12, 0),
            secondDate: new Date(),
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

        try {
          oListModel.setProperty('/busy', true);
          const aList = await this.getFamilyCode();

          oListModel.setProperty('/FamilyCode', new ComboEntry({ codeKey: 'Seqnr', valueKey: 'Znametx', aEntries: aList }));
          oListModel.setProperty('/search/Seqnr', 'ALL');

          this.onSearch();
          this.totalCount();
        } catch (oError) {
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onClick() {
        this.getRouter().navTo('medical-detail', { oDataKey: 'N' });
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR09';
      },

      formatNumber(vNum = '0') {
        return !vNum ? '0' : vNum;
      },

      formatPay(vPay = '0') {
        vPay = this.TextUtils.toCurrency(vPay);

        return `${vPay}${this.getBundleText('LABEL_00158')}`;
      },

      thisYear(sYear = String(moment().format('YYYY'))) {
        return this.getBundleText('MSG_09001', sYear);
      },

      onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();
        const oSearch = oListModel.getProperty('/search');
        const dDate = moment(oSearch.secondDate).hours(9).toDate();
        const dDate2 = moment(oSearch.date).hours(9).toDate();
        const sMenid = this.getCurrentMenuId();
        let sFamgb = '';
        let sFamsa = '';
        let sObjps = '';
        let sKdsvh = '';

        oListModel.setProperty('/busy', true);

        if (!!oSearch.Seqnr && oSearch.Seqnr !== 'ALL') {
          sFamgb = oListModel.getProperty('/TargetCode/Famgb');
          sFamsa = oListModel.getProperty('/TargetCode/Famsa');
          sObjps = oListModel.getProperty('/TargetCode/Objps');
          sKdsvh = oListModel.getProperty('/TargetCode/Kdsvh');
        }

        oModel.read('/MedExpenseApplSet', {
          filters: [
            new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'),
            new sap.ui.model.Filter('Menid', sap.ui.model.FilterOperator.EQ, sMenid),
            new sap.ui.model.Filter('Apbeg', sap.ui.model.FilterOperator.EQ, dDate),
            new sap.ui.model.Filter('Apend', sap.ui.model.FilterOperator.EQ, dDate2),
            new sap.ui.model.Filter('Famgb', sap.ui.model.FilterOperator.EQ, sFamgb),
            new sap.ui.model.Filter('Famsa', sap.ui.model.FilterOperator.EQ, sFamsa),
            new sap.ui.model.Filter('Objps', sap.ui.model.FilterOperator.EQ, sObjps),
            new sap.ui.model.Filter('Kdsvh', sap.ui.model.FilterOperator.EQ, sKdsvh),
          ],
          success: (oData) => {
            if (oData) {
              const aMedList = oData.results;
              const oTable = this.byId('medTable');

              oListModel.setProperty('/List', aMedList);
              oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aMedList, sStatCode: 'Lnsta' }));
            }
            oListModel.setProperty('/busy', false);
          },
          error: (oError) => {
            this.debug(oError);
            oListModel.setProperty('/busy', false);
          },
        });
      },

      getFamilyCode() {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.BENEFIT);

          oModel.read('/MedExpenseSupportListSet', {
            filters: [new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date())],
            success: (oData) => {
              if (oData) {
                resolve(oData.results);
              }
            },
            error: (oError) => {
              reject(oError);
            },
          });
        });
      },

      totalCount() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oListModel = this.getViewModel();

        oModel.read('/MedExpenseMymedSet', {
          filters: [],
          success: (oData) => {
            if (oData) {
              const oList = oData.results[0];

              oListModel.setProperty('/Total', oList);

              if (!!oList.Note) {
                oListModel.setProperty('/listInfo/infoMessage', oList.Note);
              }
            }
          },
          error: (oError) => {
            this.debug(oError);

            oListModel.setProperty('/busy', false);
          },
        });
      },

      // 대상자 선택시
      onFamilyCode(oEvent) {
        const sKey = oEvent.getSource().getSelectedKey();
        const oViewModel = this.getViewModel();
        const oFCode = oViewModel.getProperty('/FamilyCode');

        oFCode.forEach((e) => {
          if (e.Seqnr === sKey) {
            oViewModel.setProperty('/TargetCode', e);
          }
        });
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);

        this.getRouter().navTo('medical-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('medTable');
        const aTableData = this.getViewModel().getProperty('/List');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_09010');

        TableUtils.export({ oTable, aTableData, sFileName, sStatCode: 'Lnsta', sStatTxt: 'Lnstatx' });
      },
    });
  }
);
