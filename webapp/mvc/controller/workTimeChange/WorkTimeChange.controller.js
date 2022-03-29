sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Currency',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    AttachFileAction,
    FragmentEvent,
    TableUtils,
    TextUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.workTimeChange.WorkTimeChange', {
      sDialChartId: 'dialChart',

      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          busy: false,
          Data: [],
          MyWork: {},
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

      async onObjectMatched() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const mPernr = {};

          if (this.isHass()) {
            const sPernr = this.getAppointeeProperty('Pernr');

            mPernr.Pernr = sPernr;
          }

          const mMyWorkPayLoad = {
            Menid: this.getCurrentMenuId(),
            ...mPernr,
          };
          const oModel = this.getModel(ServiceNames.WORKTIME);
          // 나의 근무시간현황
          const [aMyWork] = await Client.getEntitySet(oModel, 'WorkingTime', mMyWorkPayLoad);

          oListModel.setProperty('/MyWork', aMyWork);
          this.buildDialChart(aMyWork);

          const mSearch = oListModel.getProperty('/search');
          const mPayLoad = {
            Apbeg: moment(mSearch.secondDate).hours(9).toDate(),
            Apend: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            ...mPernr,
          };
          const aTableList = await Client.getEntitySet(oModel, 'OtworkChangeApply', mPayLoad);
          const oTable = this.byId('workTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
          oListModel.setProperty('/List', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          $(`#${this.sDialChartId}`).css({ top: '20px' });
          oListModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      async onRefresh() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const mMyWork = {
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
          };
          const oModel = this.getModel(ServiceNames.WORKTIME);
          // 나의 근무시간현황
          const [aMyWork] = await Client.getEntitySet(oModel, 'WorkingTime', mMyWork);

          oListModel.setProperty('/MyWork', aMyWork);
          this.buildDialChart(aMyWork);
          this.onSearch();
          // this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          $(`#${this.sDialChartId}`).css({ top: '20px' });
          oListModel.setProperty('/busy', false);
        }
      },

      getDialChartOption() {
        return {
          //Cosmetics
          showValue: 1,
          valueFontSize: 12,
          showTooltip: 0,
          gaugeOriginY: 110,
          gaugeOuterRadius: 75,
          gaugeInnerRadius: 53,
          majorTMNumber: 13,
          majorTMColor: '#333',
          majorTMHeight: -2.5,
          majorTMThickness: 1,
          tickValueDistance: 5,
          tickValueStep: 10,
          showPlotBorder: 0,
          showGaugeBorder: 0,
          showPivotBorder: 0,
          bgColor: 'transparent',
          pivotRadius: 3,
          pivotFillColor: '#000',
          chartLeftMargin: -20,
          chartRightMargin: 0,
          chartTopMargin: 0,
          chartBottomMargin: -150,
          theme: 'ocean',
        };
      },

      buildDialChart(aWorkTypeList) {
        const oChart = FusionCharts(this.sDialChartId);

        if (!oChart) {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: this.sDialChartId,
              type: 'angulargauge',
              renderAt: 'chart-dial-container',
              width: '50%',
              height: '170px',
              dataFormat: 'json',
              dataSource: {
                chart: this.getDialChartOption(),
                colorrange: {
                  color: [
                    {
                      minvalue: '0',
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
                      value: aWorkTypeList.Reltm,
                      valueY: 123,
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
              chart: this.getDialChartOption(),
              colorrange: {
                color: [
                  {
                    minvalue: '0',
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
                    value: aWorkTypeList.Reltm,
                    valueY: 123,
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
        this.getRouter().navTo('workTimeChange-detail', { oDataKey: 'N' });
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR18';
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          const mPernr = {};

          if (this.isHass()) {
            const sPernr = this.getAppointeeProperty('Pernr');

            mPernr.Pernr = sPernr;
          }

          const mSearch = oListModel.getProperty('/search');
          const mPayLoad = {
            Apbeg: moment(mSearch.secondDate).hours(9).toDate(),
            Apend: moment(mSearch.date).hours(9).toDate(),
            Menid: this.getCurrentMenuId(),
            ...mPernr,
          };
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const aTableList = await Client.getEntitySet(oModel, 'OtworkChangeApply', mPayLoad);
          const oTable = this.byId('workTable');

          oListModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aTableList }));
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

        this.getRouter().navTo('workTimeChange-detail', { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('workTable');
        const aTableData = this.getViewModel().getProperty('/List');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_27001');

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
