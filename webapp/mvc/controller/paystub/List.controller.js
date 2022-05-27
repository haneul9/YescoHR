sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.paystub.List', {
      TABLE_ID: 'paystubTable',

      CHART_ID: 'paystubSummaryChart',

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
              chart: FusionCharts.curryChartOptions({
                pieRadius: '90%',
                showLegend: 0,
                showValues: 0,
                showLabels: 0,
                showPercentInTooltip: 0,
                showToolTipShadow: 0,
                slicingDistance: 5,
                formatNumber: 1,
                formatNumberScale: false,
                decimals: 1,
                useDataPlotColorForLabels: 1,
                paletteColors: '#7bb4eb,#81daea,#faca74',
              }),
              data: [
                {
                  label: this.getBundleText('LABEL_13051'), // 과세총액
                  value: 0,
                  isSliced: 1,
                },
                {
                  label: this.getBundleText('LABEL_13052'), // 비과세총액
                  value: 0,
                  isSliced: 0,
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
        this.TableUtils.summaryColspan({ oTable: this.byId(this.TABLE_ID), aHideIndex: [1, 2] });
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);
          this.sRouteName = sRouteName;

          await this.search();
        } catch (oError) {
          this.debug('Controller > paystub List > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async callbackAppointeeChange() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          await this.search();
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
        const mSumRow = this.TableUtils.generateSumRow({
          aTableData: aRowData,
          mSumField: { Idx: sSumLabel },
          vCalcProps: /^Bet0/,
        });

        oViewModel.setProperty('/summary/Bet05', _.get(mSumRow, 'Bet05', '0'));
        oViewModel.setProperty('/summary/Bet06', _.get(mSumRow, 'Bet06', '0'));
        oViewModel.setProperty('/summary/Bet07', _.get(mSumRow, 'Bet07', '0'));
        oViewModel.setProperty('/summary/dataSources/data/0/value', _.get(mSumRow, 'Bet05', '0'));
        oViewModel.setProperty('/summary/dataSources/data/1/value', _.get(mSumRow, 'Bet06', '0'));
        oViewModel.setProperty('/list', _.isEmpty(mSumRow) ? [] : [...aRowData.map((o, i) => ({ ...o, Idx: ++i })), { Idx: sSumLabel, ...mSumRow }]);
        oViewModel.setProperty('/listInfo', { ...oListInfo, ...this.TableUtils.count({ oTable, aRowData, bHasSumRow: true }) });

        setTimeout(() => {
          this.TableUtils.setColorColumn({ oTable, bHasSumRow: true, mColorMap: { 3: 'bgType10', 4: 'bgType10', 5: 'bgType10', 6: 'bgType11', 7: 'bgType12', 8: 'bgType12', 9: 'bgType12' } });
        }, 100);
      },

      buildChart() {
        const oChart = FusionCharts(`${this.sRouteName}-${this.CHART_ID}`);
        const mDataSource = this.getViewModel().getProperty('/summary/dataSources');

        if (!oChart) {
          FusionCharts.ready(() => {
            FusionCharts.getInstance({
              id: `${this.sRouteName}-${this.CHART_ID}`,
              type: 'pie2d',
              renderAt: `chart-${this.sRouteName}-container`,
              width: 180,
              height: 160,
              dataFormat: 'json',
              dataSource: mDataSource,
            }).render();
          });
        } else {
          oChart.setChartData(mDataSource);
          oChart.render();
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          await this.search();
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
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_13036'); // {급여명세서}_목록

        this.TableUtils.export({ oTable, sFileName });
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
