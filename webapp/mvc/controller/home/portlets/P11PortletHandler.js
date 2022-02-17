sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
    'sap/ui/yesco/mvc/model/type/Date', // XML expression binding용 type preloading
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    AbstractPortletHandler
  ) => {
    'use strict';

    /**
     * 근무시간 현황 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P11PortletHandler', {
      sChartId: 'portlet-p11-chart',
      oChartPromise: null,

      async addPortlet() {
        await AbstractPortletHandler.prototype.addPortlet.call(this);

        // 다른 화면에 갔다 되돌아오는 경우 id 중복 오류가 발생하므로 체크함
        if (!FusionCharts(this.sChartId)) {
          this.buildChart();
        }
      },

      buildChart() {
        this.oChartPromise = new Promise((resolve) => {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: this.sChartId,
              type: 'angulargauge',
              renderAt: `${this.sChartId}-container`,
              width: '100%',
              height: 154,
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
        const oModel = this.getController().getModel(ServiceNames.WORKTIME);
        const mPayload = {
          Menid: this.getMenid('workTime'),
        };

        return Client.getEntitySet(oModel, 'WorkingTime', mPayload);
      },

      transformContentData([mPortletData = {}]) {
        if (this.oChartPromise) {
          this.oChartPromise.then(() => {
            this.setChartData(mPortletData);
          });
        } else {
          this.setChartData(mPortletData); // 다른 메뉴를 갔다가 되돌아오는 경우
        }

        mPortletData.ButtonText1 = this.getMenuName(this.getMenid('attendance'));
        mPortletData.ButtonText2 = this.getMenuName(this.getMenid('workTime'));

        return mPortletData;
      },

      getMenid(sMenuUrl) {
        return AppUtils.getAppComponent().getMenuModel().getMenid(sMenuUrl);
      },

      getMenuName(sMenid) {
        return AppUtils.getAppComponent().getMenuModel().getProperties(sMenid).Mname;
      },

      setChartData(mPortletData) {
        const oChart = FusionCharts(this.sChartId);
        oChart.setChartData(
          {
            chart: this.getChartOption(),
            colorrange: this.getChartColorrangeOption(mPortletData.Alwtm, mPortletData.Maxtm),
            dials: {
              dial: [this.getChartDialOption(mPortletData)],
            },
          },
          'json'
        );
        setTimeout(() => {
          oChart.render();
        }, 200);
      },

      getChartOption() {
        return {
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
          theme: 'ocean',
        };
      },

      getChartColorrangeOption(iWTMax, iOTMax) {
        return {
          color: [
            {
              minValue: 0,
              maxValue: iWTMax,
              code: '#34649d', // 기본 근무시간
            },
            {
              minValue: iWTMax,
              maxValue: iOTMax,
              code: '#fdde17', // 초과 근무시간
            },
          ],
        };
      },

      getChartDialOption(mPortletData) {
        return {
          value: mPortletData.Reltm,
          valueY: 123,
          baseWidth: 4,
          rearExtension: 0,
        };
      },

      onAfterDragAndDrop() {
        FusionCharts(this.sChartId).render();
      },

      onPressButton1() {
        // this.navTo('attendance-detail', { type: 'A' });
        this.navTo('attendance');
      },

      onPressButton2() {
        // this.navTo('workTime-detail', { oDataKey: 'N' });
        this.navTo('workTime');
      },
    });
  }
);
