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

    return BaseController.extend('sap.ui.yesco.mvc.controller.workTimeChange.WorkTimeChange', {
      sDialChartId: 'WorkAppDialChart',
      sChartDiv: 'chart-work-change-dial-container',

      initializeModel() {
        return {
          busy: false,
          Data: [],
          MyWork: {},
          routeName: '',
          search: {
            secondDate: moment().subtract(1, 'month').add(1, 'day').toDate(),
            date: moment().toDate(),
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
        };
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oListModel = this.getViewModel();

        $(`#${this.sChartDiv}`).remove();
        oListModel.setProperty('/routeName', sRouteName);

        try {
          oListModel.setProperty('/busy', true);

          const sPernr = this.getAppointeeProperty('Pernr');
          const mMyWorkPayLoad = {
            Menid: this.getCurrentMenuId(),
            Pernr: sPernr,
          };
          const oModel = this.getModel(ServiceNames.WORKTIME);
          // 나의 근무시간현황
          const [aMyWork] = await Client.getEntitySet(oModel, 'WorkingTime', mMyWorkPayLoad);

          oListModel.setProperty('/MyWork', aMyWork);

          if(aMyWork.Wkrul && aMyWork.Wkrul.indexOf("선택") != -1){
            oListModel.setProperty('/MyWork/Text', 'this month');
          } else {
            oListModel.setProperty('/MyWork/Text', 'this week');
          }

          this.buildDialChart(aMyWork);

          const mSearch = oListModel.getProperty('/search');
          const mPayLoad = {
            Apbeg: moment(mSearch.secondDate).hours(9).toDate(),
            Apend: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            Pernr: sPernr,
          };
          const aTableList = await Client.getEntitySet(oModel, 'OtworkChangeApply', mPayLoad);
          const oTable = this.byId('workTable');

          oListModel.setProperty('/listInfo', this.TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      async callbackAppointeeChange() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const sPernr = this.getAppointeeProperty('Pernr');
          const mMyWorkPayLoad = {
            Menid: this.getCurrentMenuId(),
            Pernr: sPernr,
          };
          const oModel = this.getModel(ServiceNames.WORKTIME);
          // 나의 근무시간현황
          const [aMyWork] = await Client.getEntitySet(oModel, 'WorkingTime', mMyWorkPayLoad);

          oListModel.setProperty('/MyWork', aMyWork);

          if(aMyWork.Wkrul && aMyWork.Wkrul.indexOf("선택") != -1){
            oListModel.setProperty('/MyWork/Text', 'this month');
          } else {
            oListModel.setProperty('/MyWork/Text', 'this week');
          }

          this.buildDialChart(aMyWork);

          const mSearch = oListModel.getProperty('/search');
          const mPayLoad = {
            Apbeg: moment(mSearch.secondDate).hours(9).toDate(),
            Apend: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            Pernr: sPernr,
          };
          const aTableList = await Client.getEntitySet(oModel, 'OtworkChangeApply', mPayLoad);
          const oTable = this.byId('workTable');

          oListModel.setProperty('/listInfo', this.TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
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

      buildDialChart(aWorkTypeList) {
        const oChart = FusionCharts(this.sDialChartId);
        const iGaugeOriginY = 150 * 0.75; // chart box height 75%

        if (!oChart) {
          FusionCharts.ready(() => {
            FusionCharts.getInstance({
              id: this.sDialChartId,
              type: 'angulargauge',
              renderAt: this.sChartDiv,
              width: 225,
              height: 150,
              dataFormat: 'json',
              dataSource: {
                chart: this.getDialChartOption(iGaugeOriginY),
                colorrange: {
                  color: [
                    {
                      minvalue: 0,
                      maxvalue: aWorkTypeList.Alwtm,
                      code: '#34649d',
                    },
                    {
                      minvalue: aWorkTypeList.Alwtm,
                      maxvalue: aWorkTypeList.Maxtm,
                      code: '#fdde17',
                    },
                  ],
                },
                dials: {
                  dial: [
                    {
                      showValue: 1,
                      value: aWorkTypeList.Reltm,
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
                    maxvalue: aWorkTypeList.Alwtm,
                    code: '#34649d',
                  },
                  {
                    minvalue: aWorkTypeList.Alwtm,
                    maxvalue: aWorkTypeList.Maxtm,
                    code: '#fdde17',
                  },
                ],
              },
              dials: {
                dial: [
                  {
                    showValue: 1,
                    value: aWorkTypeList.Reltm,
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

      // 근무시간
      formatTime(sTime = '') {
        return !sTime ? '0' : `${sTime.slice(-4, -2)}:${sTime.slice(-2)}`;
      },

      formatWeek(sWeek = '') {
        return `${this.getBundleText('MSG_27001', sWeek)}`;
      },

      onClick() {
        this.getRouter().navTo(`${this.getViewModel().getProperty('/routeName')}-detail`, { oDataKey: 'N' });
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR18';
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const sPernr = this.getAppointeeProperty('Pernr');
          const mSearch = oListModel.getProperty('/search');
          const mPayLoad = {
            Apbeg: moment(mSearch.secondDate).hours(9).toDate(),
            Apend: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            Pernr: sPernr,
          };
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const aTableList = await Client.getEntitySet(oModel, 'OtworkChangeApply', mPayLoad);
          const oTable = this.byId('workTable');

          oListModel.setProperty('/listInfo', this.TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);
        const sRouteName = oListModel.getProperty('/routeName');

        this.getRouter().navTo(`${sRouteName}-detail`, { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('workTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_27001');

        this.TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
