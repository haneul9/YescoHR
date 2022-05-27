sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/M23PortletHandlerDialog1Handler',
    'sap/ui/yesco/mvc/controller/overviewAttendance/mobile/EmployeeList3PopoverHandler',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Client,
    ServiceNames,
    AbstractPortletHandler,
    M23PortletHandlerDialog1Handler,
    EmployeeList3PopoverHandler
  ) => {
    'use strict';

    /**
     * 근무시간 현황 Portlet (임원용)
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.M23PortletHandler', {
      sChartId: 'portlet-m23-chart',
      oChartPromise: null,

      async addPortlet() {
        const oController = this.getController();
        const oPortletModel = this.getPortletModel();
        const oPortletBox = await Fragment.load({
          id: oController.getView().getId(),
          name: 'sap.ui.yesco.mvc.view.home.fragment.M23PortletBox',
          controller: this,
        });

        const iPortletHeight = oPortletModel.getProperty('/height');
        oPortletBox.setModel(oPortletModel).bindElement('/').addStyleClass(`portlet-h${iPortletHeight}`);

        oController.byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);

        // 다른 화면에 갔다 되돌아오는 경우 id 중복 오류가 발생하므로 체크함
        const oChart = FusionCharts(this.sChartId);
        if (oChart) {
          oChart.dispose();
        }

        this.buildChart();

        this.oEmployeeListPopupHandler = this.oEmployeeListPopupHandler || (this.bMobile ? new EmployeeList3PopoverHandler(oController) : new M23PortletHandlerDialog1Handler(oController));
      },

      buildChart() {
        window.openDetailPopup = () => {
          $('#fusioncharts-tooltip-element').css('z-index', 7);

          this.openDetailPopup();
        };

        this.oChartPromise = new Promise((resolve) => {
          FusionCharts.ready(() => {
            FusionCharts.getInstance({
              id: this.sChartId,
              type: 'angulargauge',
              renderAt: `${this.sChartId}-container`,
              width: '100%',
              height: '100%',
              dataFormat: 'json',
              dataSource: {
                chart: this.getChartOption(),
                colorrange: this.getChartColorrangeOption(40, 52),
                dials: {
                  dial: [this.getChartDialOption({ Reltm: 0 })],
                },
              },
              events: {
                rendered: resolve,
              },
            }).render();
          });
        });
      },

      async readContentData() {
        const oPortletModel = this.getPortletModel();
        const oSelectedDate = oPortletModel.getProperty('/selectedDate') || new Date();
        const mAppointee = this.getController().getAppointeeData();

        const oModel = this.getController().getModel(ServiceNames.WORKTIME);
        const mPayload = {
          Datum: moment(oSelectedDate).startOf('date').add(9, 'hours'),
          Werks: mAppointee.Werks,
          Orgeh: mAppointee.Orgeh,
          Headty: 'B',
        };

        return Client.getEntitySet(oModel, 'TimeOverview', mPayload);
      },

      transformContentData([{ Rte01 = '0', Rte02 = '0' }]) {
        if (this.oChartPromise) {
          this.oChartPromise.then(() => {
            this.setChartData(Rte01);
          });
        } else {
          this.setChartData(Rte01); // 다른 메뉴를 갔다가 되돌아오는 경우
        }

        return { Rte01, Text: this.getController().getBundleText('LABEL_01182', Rte02) };
      },

      setChartData(Rte01) {
        const oChart = FusionCharts(this.sChartId);
        oChart.setChartData(
          {
            chart: this.getChartOption(),
            colorrange: this.getChartColorrangeOption(40, 52),
            dials: {
              dial: [this.getChartDialOption(Rte01)],
            },
          },
          'json'
        );
        setTimeout(() => {
          oChart.render();
        }, 200);
      },

      getChartOption() {
        return FusionCharts.curryChartOptions({
          baseFontSize: 12,
          gaugeOriginY: 125,
          gaugeOuterRadius: 107,
          gaugeInnerRadius: 75,
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
          showTooltip: 0,
          clickURL: 'j-openDetailPopup-',
        });
      },

      getChartColorrangeOption(iWTMax, iOTMax) {
        return {
          color: [
            {
              minValue: 0,
              maxValue: Number(iWTMax),
              code: '#34649d', // 기본 근무시간
            },
            {
              minValue: Number(iWTMax),
              maxValue: Number(iOTMax),
              code: '#fdde17', // 초과 근무시간
            },
          ],
        };
      },

      getChartDialOption(Rte01) {
        return {
          showValue: 1,
          value: Number(Rte01),
          valueY: 143,
          baseWidth: 4,
          rearExtension: 0,
        };
      },

      onAfterDragAndDrop() {
        FusionCharts(this.sChartId).render();
      },

      openDetailPopup() {
        const mAppointeeData = this.oController.getAppointeeData();
        const mPayload = {
          Datum: moment().startOf('date').add(9, 'hours'),
          Werks: mAppointeeData.Werks,
          Orgeh: mAppointeeData.Orgeh,
          Headty: 'B',
          Discod: '0',
        };

        if (this.bMobile) {
          this.oEmployeeListPopupHandler.openPopover(mPayload);
        } else {
          this.oEmployeeListPopupHandler.openDialog(mPayload);
        }
      },

      destroy() {
        if (this.oEmployeeListPopupHandler) {
          this.oEmployeeListPopupHandler.destroy();
        }

        FusionCharts(this.sChartId).dispose();

        AbstractPortletHandler.prototype.destroy.call(this);
      },
    });
  }
);
