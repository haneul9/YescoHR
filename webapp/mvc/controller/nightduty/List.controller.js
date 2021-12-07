sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    AttachFileAction,
    AppUtils,
    TableUtils,
    ODataReadError,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.nightduty.List', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TABLE_ID: 'nightdutyTable',
      TYPE_CODE: 'HR01',

      onBeforeShow() {
        const today = moment();
        const oViewModel = new JSONModel({
          busy: true,
          isVisibleActionButton: false,
          summary: {
            Year: today.format('YYYY'),
            YearMonth: this.getBundleText('MSG_06002', today.format('YYYY'), today.format('M')),
          },
          search: {
            Apend: today.hours(9).toDate(),
            Apbeg: today.subtract(1, 'month').add(1, 'day').hours(9).toDate(),
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
          list: [],
          parameter: {
            selectedIndices: [],
            rowData: [],
          },
        });
        this.setViewModel(oViewModel);

        TableUtils.adjustRowSpan({
          table: this.byId(this.TABLE_ID),
          colIndices: [0, 1, 2, 3, 4, 5, 14, 15],
          theadOrTbody: 'thead',
        });
      },

      setPageBusy(bIsBusy) {
        this.getViewModel().setProperty('/busy', bIsBusy);
      },

      async onObjectMatched() {
        try {
          const [
            mSummaryData, // prettier 방지용 주석
            aTableData,
          ] = await Promise.all([
            this.readSummaryData(), // prettier 방지용 주석
            this.readTableData(),
          ]);

          this.setSummaryData(mSummaryData);
          this.setTableData(aTableData);
        } catch (oError) {
          this.debug('Controller > Nightduty List > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setPageBusy(false);
        }
      },

      async readSummaryData() {
        return new Promise((resolve, reject) => {
          const sUrl = '/OnCallSummarySet';
          const sPernr = this.getAppointeeProperty('Pernr');

          this.getModel(ServiceNames.WORKTIME).read(sUrl, {
            filters: [
              new Filter('Pernr', FilterOperator.EQ, sPernr), //
            ],
            success: (mData) => {
              this.debug(`${sUrl} success.`, mData);

              resolve(mData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      /**
       * @param  {object} mSummaryData
       */
      setSummaryData(mSummaryData) {
        const oViewModel = this.getViewModel();
        const mLegacySummaryData = oViewModel.getProperty('/summary');

        oViewModel.setProperty('/summary', { ...mLegacySummaryData, mSummaryData });
      },

      async readTableData() {
        return new Promise((resolve, reject) => {
          const sUrl = '/OnCallChangeAppSet';
          const sMenid = this.getCurrentMenuId();
          const mSearchConditions = this.getViewModel().getProperty('/search');

          this.getModel(ServiceNames.WORKTIME).read(sUrl, {
            filters: [
              new Filter('Menid', FilterOperator.EQ, sMenid), //
              new Filter('Apbeg', FilterOperator.EQ, moment(mSearchConditions.Apbeg).hours(9).toDate()),
              new Filter('Apend', FilterOperator.EQ, moment(mSearchConditions.Apend).hours(9).toDate()),
            ],
            success: (mData) => {
              this.debug(`${sUrl} success.`, mData);

              resolve(mData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      setTableData(aRowData) {
        const oViewModel = this.getViewModel();
        const oTable = this.byId(this.TABLE_ID);

        oViewModel.setProperty('/list', aRowData);
        oViewModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData }));
      },

      async onPressSearch() {
        try {
          this.setPageBusy(true);

          const aTableData = await this.readTableData();

          this.setTableData(aTableData);
        } catch (oError) {
          this.debug('Controller > Nightduty List > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setPageBusy(false);
        }
      },

      onPressNew() {
        this.getRouter().navTo('nightduty-detail');
      },

      onPressExelDownload() {
        const oTable = this.byId(this.TABLE_ID);
        const aTableData = this.getViewModel().getProperty('/list');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_06001'); // {당직변경신청}_목록

        TableUtils.export({ oTable, aTableData, sFileName });
      },

      onSelectRow(oEvent) {
        const sPath = oEvent.getParameter('rowBindingContext').getPath();
        const sAppno = this.getViewModel().getProperty(`${sPath}/Appno`);

        this.getRouter().navTo('nightduty-detail', { appno: sAppno });
        // this.getRouter().getTargets().display('congDetail', { oDataKey: oRowData.Appno });
      },
    });
  }
);
