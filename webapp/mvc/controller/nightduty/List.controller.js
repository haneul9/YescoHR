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
          table: this.byId('nightdutyTable'),
          colIndices: [0, 1, 2, 3, 4, 5, 14, 15],
          theadOrTbody: 'thead',
        });
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
          this.getViewModel().setProperty('/busy', false);
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
        const oTable = this.byId('nightdutyTable');

        oViewModel.setProperty('/list', aRowData);
        oViewModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData }));
      },

      async onPressSearch() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const oSearchConditions = oViewModel.getProperty('/search');

        try {
          oViewModel.setProperty('/busy', true);

          const mRowData = await this.readLeaveApplContent({ oModel, oSearchConditions });

          this.setTableData({ oViewModel, mRowData });
        } catch (oError) {
          this.debug('Controller > Attendance List > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onClick() {
        this.getRouter().navTo('congratulation-detail', { oDataKey: 'N' });
      },

      onExelDownload() {
        const oTable = this.byId('conguTable');
        const aTableData = this.getViewModel().getProperty('/CongList');
        const sFileName = '경조금신청_목록';

        TableUtils.export({ oTable, aTableData, sFileName });
      },

      formatNumber(vNum) {
        if (!vNum || vNum === '') return '0';

        return vNum;
      },

      formatPay(vPay) {
        if (!vPay || vPay === '0') return '0';

        return `${vPay}만원`;
      },

      getTotalPay() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oTotalModel = this.getViewModel();

        oModel.read('/ConExpenseMyconSet', {
          success: function (oData) {
            if (oData) {
              // Common.log(oData);
              const oTotal = oData.results[0];

              oTotalModel.setProperty('/Total', oTotal);
            }
          },
          error: function (oRespnse) {
            // Common.log(oResponse);
          },
        });
      },

      onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oSearchDate = this.byId('SearchDate');
        const oListModel = this.getViewModel();
        const oController = this;
        const dDate = moment(oSearchDate.getDateValue()).hours(10).toDate();
        const dDate2 = moment(oSearchDate.getSecondDateValue()).hours(10).toDate();

        oListModel.setProperty('/busy', true);

        oModel.read('/ConExpenseApplSet', {
          filters: [
            new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'),
            new sap.ui.model.Filter('Actty', sap.ui.model.FilterOperator.EQ, 'E'),
            new sap.ui.model.Filter('Apbeg', sap.ui.model.FilterOperator.EQ, dDate),
            new sap.ui.model.Filter('Apend', sap.ui.model.FilterOperator.EQ, dDate2),
          ],
          success: function (oData) {
            if (oData) {
              // Common.log(oData);
              const oList = oData.results.map((o) => {
                return {
                  ...o,
                  Pernr: parseInt(o.Pernr, 10),
                };
              });
              // let vNo = 0;

              // oList.forEach((e) => {
              //   vNo = vNo + 1;
              //   e.No = vNo;
              // });

              TableUtils.count.call(oController, oList);
              oListModel.setProperty('/CongList', oList);
              oController.byId('conguTable').setVisibleRowCount(oList.length);
              oListModel.setProperty('/busy', false);
            }
          },
          error: function (oRespnse) {
            // Common.log(oResponse);
            oListModel.setProperty('/busy', false);
          },
        });
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getRouter().navTo('congratulation-detail', { oDataKey: oRowData.Appno });
        // this.getRouter().getTargets().display('congDetail', { oDataKey: oRowData.Appno });
      },
    });
  }
);
