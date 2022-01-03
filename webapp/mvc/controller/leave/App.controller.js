sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.leave.App', {
      TableUtils: TableUtils,
      TABLE_ID: 'leaveTable',

      onBeforeShow() {
        const today = moment();
        const oViewModel = new JSONModel({
          busy: false,
          search: {
            Zyymm: today.format('YYYYMM'),
            Orgeh: '',
            Qtaty: 'ALL',
          },
          entry: {
            department: [],
            leaveType: new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }),
          },
          summary: {
            year: today.format('YYYY'),
            Todo1: '20,000,000',
            Todo2: '20,000,000',
            Todo3: '2,500,000',
            Todo4: '42,500,000',
          },
          listInfo: {
            rowCount: 2,
          },
          list: [],
        });
        this.setViewModel(oViewModel);

        TableUtils.adjustRowSpan({
          oTable: this.byId(this.TABLE_ID),
          aColIndices: [0, 1],
          sTheadOrTbody: 'thead',
        });
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const [aDepartment, aLeaveType] = await Promise.all([
            Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'MssOrgehList', { Pernr: this.getAppointeeProperty('Pernr') }),
            Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'QtatyCodeList'), //
          ]);

          oViewModel.setProperty('/entry/department', aDepartment ?? []);
          oViewModel.setProperty('/entry/leaveType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aLeaveType }));

          const sOrgeh = _.get(aDepartment, [0, 'Orgeh']);

          if (!_.isEmpty(sOrgeh)) {
            oViewModel.setProperty('/search/Orgeh', sOrgeh);

            this.onPressSearch();
          }
        } catch (oError) {
          this.debug('Controller > leave App > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTableData({ oViewModel, aRowData }) {
        const oTable = this.byId(this.TABLE_ID);
        const sSumLabel = this.getBundleText('LABEL_00172'); // 합계
        const mSumRow = TableUtils.generateSumRow({
          aTableData: aRowData,
          mSumField: { Orgtx: sSumLabel },
          vCalcProps: ['Empcnt', ..._.times(12, (i) => `Inw${_.padStart(i + 1, 2, '0')}`)],
        });

        oViewModel.setProperty('/list', _.isEmpty(mSumRow) ? [] : [...aRowData, mSumRow]);
        oViewModel.setProperty('/listInfo/rowCount', TableUtils.count({ oTable, aRowData, bHasSumRow: true }).rowCount);

        setTimeout(() => {
          TableUtils.setColorColumn({ oTable, bHasSumRow: true, mColorMap: { 7: 'bgType02', 13: 'bgType02' } });
        }, 100);
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const mFilters = oViewModel.getProperty('/search');
          const fCurried = Client.getEntitySet(this.getModel(ServiceNames.WORKTIME));
          // const [aSummary, aRowData] = await Promise.all([
          //   fCurried('LeaveUseHistory', { ...mFilters }), //
          //   fCurried('LeaveUseBoard', { ...mFilters }),
          // ]);
          const aRowData = await fCurried('LeaveUseBoard', { ...mFilters });

          this.setTableData({ oViewModel, aRowData });
        } catch (oError) {
          this.debug('Controller > leave App > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onPressExcelDownload() {
        const oTable = this.byId(this.TABLE_ID);
        const aTableData = this.getViewModel().getProperty('/list');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_13036'); // {급여명세서}_목록

        TableUtils.export({ oTable, aTableData, sFileName, aDateProps: ['Paydt'] });
      },

      onSelectRow(oEvent) {
        const sPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(sPath);

        if (isNaN(oRowData.Seqnr)) return;

        this.getRouter().navTo('leave-detail', { seqnr: _.trimStart(oRowData.Seqnr, '0') });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
