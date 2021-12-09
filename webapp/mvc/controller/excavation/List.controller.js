sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/DateUtils',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    FilterOperator,
    JSONModel,
    AppUtils,
    DateUtils,
    ODataReadError,
    ServiceNames,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.excavation.List', {
      TableUtils: TableUtils,
      TABLE_ID: 'excavationTable',

      onBeforeShow() {
        const today = moment();
        const oViewModel = new JSONModel({
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
        });
        this.setViewModel(oViewModel);

        TableUtils.adjustRowSpan({
          table: this.byId(this.TABLE_ID),
          colIndices: [0, 1, 2, 3, 12, 13],
          theadOrTbody: 'thead',
        });
      },

      async onObjectMatched() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const sPernr = this.getAppointeeProperty('Pernr');
        const oSearchConditions = oViewModel.getProperty('/search');
        const mSummary = oViewModel.getProperty('/summary');

        try {
          oViewModel.setProperty('/busy', true);

          const [aResultSummary, aRowData] = await Promise.all([
            this.readDrillSummary({ oModel, sPernr }), //
            this.readDrillChangeApp({ oModel, sPernr, oSearchConditions }),
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
        const oSearchConditions = oViewModel.getProperty('/search');

        try {
          oViewModel.setProperty('/busy', true);

          const aRowData = await this.readDrillChangeApp({ oModel, sPernr, oSearchConditions });

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
          const aSummaryList = await this.readDrillList({ oModel, sMode, sYearMonth });

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

          const aSummaryList = await this.readDrillList({ oModel, sMode, sYearMonth });

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
        const aTableData = this.getViewModel().getProperty('/list');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_11002'); // {통합굴착야간근무변경신청}_목록

        TableUtils.export({ oTable, aTableData, sFileName });
      },

      onSelectRow(oEvent) {
        const sPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(sPath);

        this.getRouter().navTo('excavation-detail', { appno: oRowData.Appno });
      },

      onPressNewApprovalBtn() {
        this.getRouter().navTo('excavation-detail', { appno: 'n' });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
      /**
       * @param  {JSONModel} oModel
       * @param  {String} sPernr
       */
      readDrillSummary({ oModel, sPernr }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/DrillSummarySet';

          oModel.read(sUrl, {
            filters: [
              new Filter('Pernr', FilterOperator.EQ, sPernr), //
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results ?? []);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      readDrillList({ oModel, sMode, sYearMonth }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/DrillListSet';

          oModel.read(sUrl, {
            filters: [
              new Filter('Prcty', FilterOperator.EQ, sMode), //
              new Filter('Zyymm', FilterOperator.EQ, sYearMonth),
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results ?? []);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      /**
       * @param  {JSONModel} oModel
       * @param  {Object} oSearchConditions
       */
      readDrillChangeApp({ oModel, sPernr, oSearchConditions }) {
        const sUrl = '/DrillChangeAppSet';
        const sMenid = this.getCurrentMenuId();

        return new Promise((resolve, reject) => {
          oModel.read(sUrl, {
            filters: [
              new Filter('Menid', FilterOperator.EQ, sMenid), //
              new Filter('Pernr', FilterOperator.EQ, sPernr),
              new Filter('Apbeg', FilterOperator.EQ, DateUtils.parse(oSearchConditions.Apbeg)),
              new Filter('Apend', FilterOperator.EQ, DateUtils.parse(oSearchConditions.Apend)),
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results ?? []);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },
    });
  }
);