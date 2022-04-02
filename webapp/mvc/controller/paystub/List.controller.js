sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/EmployeeSearch',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    AppUtils,
    EmployeeSearch,
    Client,
    ServiceNames,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.paystub.List', {
      EmployeeSearch: EmployeeSearch,
      TableUtils: TableUtils,
      TABLE_ID: 'paystubTable',

      sRouteName: '',

      initializeModel() {
        const today = moment();

        return {
          busy: false,
          search: {
            year: today.format('YYYY'),
          },
          summary: {
            year: today.format('YYYY'),
            Bet01: '0',
            Bet02: '0',
            Bet03: '0',
            Bet04: '0',
            dataSources: {
              chart: {
                showLegend: '0',
                showValues: '0',
                showLabels: '0',
                showPercentInTooltip: '0',
                showToolTipShadow: '0',
                slicingDistance: '5',
                formatNumber: '1',
                formatNumberScale: false,
                decimals: '1',
                // numberSuffix: '₩',
                useDataPlotColorForLabels: '1',
                theme: 'ocean',
                paletteColors: '#7bb4eb,#81daea,#faca74',
              },
              data: [
                {
                  label: this.getBundleText('LABEL_13002'), // 급여
                  value: '0',
                  isSliced: '1',
                },
                {
                  label: this.getBundleText('LABEL_13003'), // 상여
                  value: '0',
                  isSliced: '0',
                },
                {
                  label: this.getBundleText('LABEL_13004'), // 인정상여
                  value: '0',
                  isSliced: '0',
                },
              ],
            },
          },
          listInfo: {
            Title: this.getBundleText('LABEL_13037'), // 급상여내역
            rowCount: 2,
            totalCount: 0,
            infoMessage: this.getBundleText('MSG_13001'), // 라인을 클릭하시면 상세내역이 조회됩니다.
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
        };
      },

      onBeforeShow() {
        TableUtils.summaryColspan({ oTable: this.byId(this.TABLE_ID), aHideIndex: [1, 2] });
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oViewModel = this.getViewModel();

        if (AppUtils.isPRD() && !this.serviceAvailable()) return;

        try {
          oViewModel.setProperty('/busy', true);
          this.sRouteName = sRouteName;

          this.search();
        } catch (oError) {
          this.debug('Controller > paystub List > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      serviceAvailable() {
        const bOpen = moment().isAfter(moment('2022-04-03 12:00', 'YYYY-MM-DD HH:mm'));

        if (!bOpen)
          MessageBox.alert(this.getBundleText('MSG_13002'), {
            onClose: () => this.onNavBack(),
          });

        return bOpen;
      },

      callbackAppointeeChange() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          this.search();
        } catch (oError) {
          this.debug('Controller > paystub List > callbackAppointeeChange Error', oError);

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
          mSumField: { Idx: sSumLabel },
          vCalcProps: /^Bet0/,
        });

        oViewModel.setProperty('/summary/Bet01', _.get(mSumRow, 'Bet01', '0'));
        oViewModel.setProperty('/summary/Bet02', _.get(mSumRow, 'Bet02', '0'));
        oViewModel.setProperty('/summary/Bet03', _.get(mSumRow, 'Bet03', '0'));
        oViewModel.setProperty('/summary/Bet04', _.get(mSumRow, 'Bet04', '0'));
        oViewModel.setProperty('/summary/dataSources/data/0/value', _.get(mSumRow, 'Bet01', '0'));
        oViewModel.setProperty('/summary/dataSources/data/1/value', _.get(mSumRow, 'Bet02', '0'));
        oViewModel.setProperty('/summary/dataSources/data/2/value', _.get(mSumRow, 'Bet03', '0'));
        oViewModel.setProperty('/list', _.isEmpty(mSumRow) ? [] : [...aRowData.map((o, i) => ({ ...o, Idx: ++i })), { Idx: sSumLabel, ...mSumRow }]);
        oViewModel.setProperty('/listInfo', { ...oListInfo, ...TableUtils.count({ oTable, aRowData, bHasSumRow: true }) });

        setTimeout(() => {
          TableUtils.setColorColumn({ oTable, bHasSumRow: true, mColorMap: { 6: 'bgType01', 8: 'bgType02', 10: 'bgType03' } });
        }, 100);
      },

      buildChart() {
        const mDataSource = this.getViewModel().getProperty('/summary/dataSources');

        FusionCharts.ready(function () {
          new FusionCharts({
            type: 'pie2d',
            renderAt: 'chart-container',
            width: '180',
            height: '160',
            dataFormat: 'json',
            dataSource: mDataSource,
          }).render();
        });
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          this.search();
        } catch (oError) {
          this.debug('Controller > paystub List > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async search() {
        try {
          const oViewModel = this.getViewModel();
          const sYear = oViewModel.getProperty('/search/year');
          const aRowData = await Client.getEntitySet(this.getModel(ServiceNames.PAY), 'PayslipList', {
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
            Begym: moment(sYear).month(0).format('YYYYMM'),
            Endym: moment(sYear).month(11).format('YYYYMM'),
          });

          this.setTableData({ oViewModel, aRowData });
          this.buildChart();
        } catch (oError) {
          throw oError;
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

        this.getRouter().navTo(`${this.sRouteName}-detail`, { seqnr: _.trimStart(oRowData.Seqnr, '0') });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
