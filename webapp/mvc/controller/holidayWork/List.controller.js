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

    return BaseController.extend('sap.ui.yesco.mvc.controller.holidayWork.List', {
      TABLE_ID: 'holidayWorkTable',
      CHART_CONTAINER_ID: 'chart-holidaywork-app-dial-container',
      CHART_ID: 'myWorkSummaryChart',

      sRouteName: '',

      initializeModel() {
        return {
          busy: false,
          summary: {},
          search: {
            Apbeg: moment().subtract(1, 'month').add(1, 'day').toDate(),
            Apend: moment().toDate(),
          },
          list: [],
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
        };
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oViewModel = this.getViewModel();

        try {
          this.sRouteName = sRouteName;
          oViewModel.setProperty('/busy', true);
          $(`#${this.CHART_CONTAINER_ID}`).remove();

          await this.search();
        } catch (oError) {
          this.debug('Controller > holidayWork List > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      async callbackAppointeeChange() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          await this.search();
        } catch (oError) {
          this.debug('Controller > holidayWork List > callbackAppointeeChange Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          await this.search();
        } catch (oError) {
          this.debug('Controller > holidayWork List > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onPressNew() {
        this.getRouter().navTo(`${this.sRouteName}-detail`, { appno: 'n' });
      },

      onSelectRow(oEvent) {
        const oRowData = oEvent.getParameters().rowBindingContext.getObject();

        if (isNaN(oRowData.Appno)) return;

        this.getRouter().navTo(`${this.sRouteName}-detail`, { appno: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId(this.TABLE_ID);
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_41001'); // {휴일근무신청}_목록

        this.TableUtils.export({ oTable, sFileName });
      },

      async search() {
        try {
          const oViewModel = this.getViewModel();
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const oTable = this.byId(this.TABLE_ID);
          const mSearch = oViewModel.getProperty('/search');
          const sMenid = this.getCurrentMenuId();
          const sPernr = this.getAppointeeProperty('Pernr');

          const [[mMyWork], aRowData] = await Promise.all([
            Client.getEntitySet(oModel, 'WorkingTime', {
              Menid: sMenid,
              Pernr: sPernr,
            }), //
            Client.getEntitySet(oModel, 'OtWorkApply2', {
              Menid: sMenid,
              Pernr: sPernr,
              Apbeg: moment(mSearch.Apbeg).hours(9).toDate(),
              Apend: moment(mSearch.Apend).hours(9).toDate(),
            }),
          ]);

          oViewModel.setProperty(
            '/summary',
            _.chain(mMyWork)
              .omit('__metadata')
              .set('Text', _.startsWith(mMyWork.Wkrul, '선택') ? 'this month' : 'this week')
              .value()
          );
          oViewModel.setProperty('/listInfo', this.TableUtils.count({ oTable, aRowData }));
          oViewModel.setProperty(
            '/list',
            _.map(aRowData, (o) => _.omit(o, '__metadata'))
          );

          this.buildChart();
        } catch (oError) {
          throw oError;
        }
      },

      buildChart() {
        const oChart = FusionCharts(`${this.sRouteName}-${this.CHART_ID}`);
        const mMyWork = this.getViewModel().getProperty('/summary');
        const iGaugeOriginY = 150 * 0.75; // chart box height 75%

        if (!oChart) {
          FusionCharts.ready(() => {
            FusionCharts.getInstance({
              id: `${this.sRouteName}-${this.CHART_ID}`,
              renderAt: this.CHART_CONTAINER_ID,
              type: 'angulargauge',
              width: 225,
              height: 150,
              dataFormat: 'json',
              dataSource: {
                chart: this.getDialChartOption(iGaugeOriginY),
                colorrange: {
                  color: [
                    {
                      minvalue: 0,
                      maxvalue: mMyWork.Alwtm,
                      code: '#34649d',
                    },
                    {
                      minvalue: mMyWork.Alwtm,
                      maxvalue: mMyWork.Maxtm,
                      code: '#fdde17',
                    },
                  ],
                },
                dials: {
                  dial: [
                    {
                      showValue: 1,
                      value: mMyWork.Reltm,
                      valueY: iGaugeOriginY + 13,
                      baseWidth: 4,
                      rearExtension: 0,
                    },
                  ],
                },
              },
            }).render();
          });
        } else {
          oChart.setChartData(
            {
              chart: this.getDialChartOption(iGaugeOriginY),
              colorrange: {
                color: [
                  {
                    minvalue: 0,
                    maxvalue: mMyWork.Alwtm,
                    code: '#34649d',
                  },
                  {
                    minvalue: mMyWork.Alwtm,
                    maxvalue: mMyWork.Maxtm,
                    code: '#fdde17',
                  },
                ],
              },
              dials: {
                dial: [
                  {
                    showValue: 1,
                    value: mMyWork.Reltm,
                    valueY: iGaugeOriginY + 13,
                    baseWidth: 4,
                    rearExtension: 0,
                  },
                ],
              },
            },
            'json'
          );
          oChart.render();
        }
      },

      getDialChartOption(iGaugeOriginY) {
        return FusionCharts.curryChartOptions({
          showTooltip: 0,
          gaugeOriginY: iGaugeOriginY,
          gaugeOuterRadius: 85,
          gaugeInnerRadius: 60,
          majorTMNumber: 13,
          majorTMColor: '#333333',
          majorTMHeight: -2.5,
          majorTMThickness: 1,
          tickValueDistance: 5,
          tickValueStep: 10,
          showPlotBorder: 0,
          showGaugeBorder: 0,
          showPivotBorder: 0,
          pivotRadius: 3,
          pivotFillColor: '#000000',
        });
      },
    });
  }
);
