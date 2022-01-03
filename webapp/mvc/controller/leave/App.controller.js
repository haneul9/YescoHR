sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    MessageBox,
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
          dialog: {
            busy: false,
            rowCount: 1,
            list: [],
          },
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

      openPersonalDialog() {
        const oView = this.getView();

        if (!this.pPersonalDialog) {
          this.pPersonalDialog = Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.leave.fragment.PersonalDialog',
            controller: this,
          }).then((oDialog) => {
            oView.addDependent(oDialog);

            TableUtils.adjustRowSpan({
              oTable: this.byId('leaveByPersonalTable'),
              aColIndices: [0, 1, 2, 3, 4, 5, 6, 11],
              sTheadOrTbody: 'thead',
            });

            return oDialog;
          });
        }
        this.pPersonalDialog.then((oDialog) => oDialog.open());
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

      onPressPersonalDialogClose() {
        this.byId('personalDialog').close();
      },

      onPressExcelDownload() {
        const oTable = this.byId(this.TABLE_ID);
        const aTableData = this.getViewModel().getProperty('/list');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_13036'); // {급여명세서}_목록

        TableUtils.export({ oTable, aTableData, sFileName, aDateProps: ['Paydt'] });
      },

      async onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const oControl = oEvent.getSource();
        const mControlParam = oEvent.getParameters();
        const sFldcd = oControl.getColumns()[mControlParam.columnIndex].data('field');
        const mRowData = oControl.getRows()[mControlParam.rowIndex].getBindingContext().getObject();

        if (mRowData.Sumrow || _.isEmpty(sFldcd)) return;

        try {
          oViewModel.setProperty('/dialog/busy', true);

          const aDetailRow = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'LeaveUseDetail', {
            ..._.pick(mRowData, ['Zyymm', 'Orgeh', 'Qtaty']),
            Fldcd: sFldcd,
          });

          if (_.isEmpty(aDetailRow)) {
            MessageBox.alert(this.getBundleText('MSG_00034')); // 조회할 수 없습니다.
            return;
          }

          oViewModel.setProperty('/dialog/rowCount', aDetailRow.length || 1);
          oViewModel.setProperty(
            '/dialog/list',
            _.map(aDetailRow, (o, i) => ({ Idx: i + 1, ...o }))
          );

          this.openPersonalDialog();
        } catch (oError) {
          this.debug('Controller > leave App > onSelectRow Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/dialog/busy', false);
        }
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
