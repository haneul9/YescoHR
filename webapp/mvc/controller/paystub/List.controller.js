sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    AppUtils,
    ODataReadError,
    ServiceNames,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.paystub.List', {
      TableUtils: TableUtils,
      TABLE_ID: 'paystubTable',

      onBeforeShow() {
        const today = moment();
        const oViewModel = new JSONModel({
          busy: false,
          search: {
            year: today.format('YYYY'),
          },
          summary: {
            year: today.format('YYYY'),
            Todo1: '20,000,000',
            Todo2: '20,000,000',
            Todo3: '2,500,000',
            Todo4: '42,500,000',
          },
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            infoMessage: this.getBundleText('MSG_13001'), // 현재 데이터를 수정하고자 할 경우에는 확정 상태의 데이터를 선택한 다음 신청 버튼을 클릭하시기 바랍니다.
            isShowProgress: false,
            progressCount: 0,
            isShowApply: false,
            applyCount: 0,
            isShowApprove: false,
            approveCount: 0,
            isShowReject: false,
            rejectCount: 0,
            isShowComplete: false,
            completeCount: 0,
          },
          list: [],
        });
        this.setViewModel(oViewModel);

        TableUtils.summaryColspan({ oTable: this.byId(this.TABLE_ID), aHideIndex: [1, 2] });
      },

      async onObjectMatched() {
        const oModel = this.getModel(ServiceNames.PAY);
        const oViewModel = this.getViewModel();
        const oSearchConditions = oViewModel.getProperty('/search');

        try {
          oViewModel.setProperty('/busy', true);

          const aRowData = await this.readPayslipList({ oModel, ...oSearchConditions });

          this.setTableData({ oViewModel, aRowData });
        } catch (oError) {
          this.debug('Controller > paystub List > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTableData({ oViewModel, aRowData }) {
        const oTable = this.byId(this.TABLE_ID);
        const oListInfo = oViewModel.getProperty('/listInfo');
        const sSumLabel = this.getBundleText('LABEL_00172'); // 합계
        const mSumRow = TableUtils.generateSumRow({
          aTableData: aRowData,
          sSumLabel,
          rCalcProp: /^Bet0/,
        });

        oViewModel.setProperty('/list', [...aRowData.map((o, i) => ({ ...o, Idx: ++i })), { Idx: sSumLabel, ...mSumRow }]);
        oViewModel.setProperty('/listInfo', { ...oListInfo, ...TableUtils.count({ oTable, aRowData, bHasSumRow: true }) });

        setTimeout(() => {
          TableUtils.setColorColumn({ oTable, bHasSumRow: true, mColorMap: { 6: 'bgType01', 8: 'bgType02', 10: 'bgType03' } });
        }, 100);
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onPressSearch() {
        const oModel = this.getModel(ServiceNames.PAY);
        const oViewModel = this.getViewModel();
        const oSearchConditions = oViewModel.getProperty('/search');

        try {
          oViewModel.setProperty('/busy', true);

          const aRowData = await this.readPayslipList({ oModel, oSearchConditions });

          this.setTableData({ oViewModel, aRowData });
        } catch (oError) {
          this.debug('Controller > paystub List > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
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

        if (isNaN(oRowData.Seqnr)) return;

        this.getRouter().navTo('paystub-detail', { seqnr: oRowData.Seqnr.replace(/^0+/, '') });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
      /**
       * @param  {JSONModel} oModel
       * @param  {String} year
       */
      readPayslipList({ oModel, year }) {
        return new Promise((resolve, reject) => {
          const sMenid = this.getCurrentMenuId();
          const dSelectYear = moment(year);
          const sUrl = '/PayslipListSet';

          oModel.read(sUrl, {
            filters: [
              new Filter('Menid', FilterOperator.EQ, sMenid), //
              new Filter('Begym', FilterOperator.EQ, dSelectYear.month(0).format('YYYYMM')),
              new Filter('Endym', FilterOperator.EQ, dSelectYear.month(11).format('YYYYMM')),
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
