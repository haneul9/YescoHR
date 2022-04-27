sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/DateUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    DateUtils,
    Client,
    ServiceNames,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.excavation.List', {
      TableUtils: TableUtils,
      TABLE_ID: 'excavationTable',

      sRouteName: '',

      initializeModel() {
        const today = moment();

        return {
          busy: false,
          isVisibleActionButton: false,
          search: {
            Apbeg: moment().subtract(1, 'month').add(1, 'day').hours(9).toDate(),
            Apend: moment().hours(9).toDate(),
          },
          summary: {
            Year: today.format('YYYY'),
            YearMonth: this.getBundleText('MSG_06002', today.format('YYYY'), today.format('M')),
            CurrentYM: today.format('YYYYMM'),
            Cnt11: '0',
            Cnt12: '0',
            Cnt21: '0',
            Cnt22: '0',
          },
          dialog: {
            busy: false,
            mode: 'R',
            listMode: 'None',
            yearMonth: today.format('YYYYMM'),
            rowCount: 1,
            list: [],
          },
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            isShowProgress: false,
            progressCount: 0,
            isShowApply: true,
            applyCount: 0,
            isShowApprove: true,
            approveCount: 0,
            isShowReject: true,
            rejectCount: 0,
            isShowComplete: true,
            completeCount: 0,
          },
          list: [],
          parameter: {
            selectedIndices: [],
            rowData: [],
          },
        };
      },

      onBeforeShow() {
        TableUtils.adjustRowSpan({
          oTable: this.byId(this.TABLE_ID),
          aColIndices: [0, 1, 2, 3, 12, 13],
          sTheadOrTbody: 'thead',
        });
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const sPernr = this.getAppointeeProperty('Pernr');
        const oSearchConditions = oViewModel.getProperty('/search');
        const mSummary = oViewModel.getProperty('/summary');

        try {
          this.sRouteName = sRouteName;
          oViewModel.setProperty('/busy', true);

          const fCurriedGetEntitySet = Client.getEntitySet(oModel);
          const [aResultSummary, aRowData] = await Promise.all([
            fCurriedGetEntitySet('DrillSummary', { Pernr: sPernr }), //
            fCurriedGetEntitySet('DrillChangeApp', { Menid: this.getCurrentMenuId(), Pernr: sPernr, Apbeg: DateUtils.parse(oSearchConditions.Apbeg), Apend: DateUtils.parse(oSearchConditions.Apend) }),
          ]);

          oViewModel.setProperty('/summary', { ...mSummary, ...aResultSummary[0] });
          this.setTableData({ oViewModel, aRowData });
        } catch (oError) {
          this.debug('Controller > excavation List > initialRetrieve Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async callbackAppointeeChange() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const fCurriedGetEntitySet = Client.getEntitySet(oModel);
          const mSummary = oViewModel.getProperty('/summary');
          const oSearchConditions = oViewModel.getProperty('/search');
          const sPernr = this.getAppointeeProperty('Pernr');
          const [aResultSummary, aRowData] = await Promise.all([
            fCurriedGetEntitySet('DrillSummary', { Pernr: sPernr }), //
            fCurriedGetEntitySet('DrillChangeApp', { Menid: this.getCurrentMenuId(), Pernr: sPernr, Apbeg: DateUtils.parse(oSearchConditions.Apbeg), Apend: DateUtils.parse(oSearchConditions.Apend) }),
          ]);

          oViewModel.setProperty('/summary', { ...mSummary, ...aResultSummary[0] });
          this.setTableData({ oViewModel, aRowData });
        } catch (oError) {
          this.debug('Controller > excavation List > callbackAppointeeChange Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTableData({ oViewModel, aRowData }) {
        const oTable = this.byId(this.TABLE_ID);
        const oListInfo = oViewModel.getProperty('/listInfo');

        oViewModel.setProperty('/list', [...aRowData]);
        oViewModel.setProperty('/listInfo', { ...oListInfo, ...TableUtils.count({ oTable, aRowData }) });
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onPressSearch() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const sPernr = this.getAppointeeProperty('Pernr');
        const mSearchConditions = oViewModel.getProperty('/search');

        try {
          oViewModel.setProperty('/busy', true);

          const aRowData = await Client.getEntitySet(oModel, 'DrillChangeApp', { Menid: this.getCurrentMenuId(), Pernr: sPernr, Apbeg: DateUtils.parse(mSearchConditions.Apbeg), Apend: DateUtils.parse(mSearchConditions.Apend) });

          this.setTableData({ oViewModel, aRowData });
        } catch (oError) {
          this.debug('Controller > excavation List > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async onPressSummary() {
        if (!this.pSummaryDialog) {
          const oView = this.getView();
          const oViewModel = this.getViewModel();
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const sMode = oViewModel.getProperty('/dialog/mode');
          const sYearMonth = oViewModel.getProperty('/summary/CurrentYM');
          const aSummaryList = await Client.getEntitySet(oModel, 'DrillList', {
            Prcty: sMode,
            Zyymm: sYearMonth,
            Pernr: this.getAppointeeProperty('Pernr'),
          });

          oViewModel.setProperty('/dialog/list', [...aSummaryList]);
          oViewModel.setProperty('/dialog/rowCount', aSummaryList.length || 1);

          this.pSummaryDialog = Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.excavation.fragment.DialogTable',
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }
        this.pSummaryDialog.then(function (oDialog) {
          oDialog.open();
        });
      },

      onPressSummaryDialogClose() {
        this.byId('summaryDialog').close();
      },

      async onChangeDialogSearch() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const sMode = oViewModel.getProperty('/dialog/mode');
        const sYearMonth = oViewModel.getProperty('/dialog/yearMonth');

        try {
          oViewModel.setProperty('/dialog/busy', true);

          const aSummaryList = await Client.getEntitySet(oModel, 'DrillList', {
            Prcty: sMode,
            Zyymm: sYearMonth,
            Pernr: this.getAppointeeProperty('Pernr'),
          });

          oViewModel.setProperty('/dialog/list', [...aSummaryList]);
          oViewModel.setProperty('/dialog/rowCount', aSummaryList.length || 1);
        } catch (oError) {
          this.debug('Controller > excavation List > onChangeDialogSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/dialog/busy', false);
        }
      },

      onPressExcelDownload() {
        const oTable = this.byId(this.TABLE_ID);
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_11002'); // {통합굴착야간근무변경신청}_목록

        TableUtils.export({ oTable, sFileName });
      },

      onSelectRow(oEvent) {
        const sPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(sPath);

        this.getRouter().navTo(`${this.sRouteName}-detail`, { appno: oRowData.Appno });
      },

      onPressNewApprovalBtn() {
        this.getRouter().navTo(`${this.sRouteName}-detail`, { appno: 'n' });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
