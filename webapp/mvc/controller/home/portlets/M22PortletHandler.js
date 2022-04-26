sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    Client,
    ServiceNames,
    AbstractPortletHandler
  ) => {
    'use strict';

    /**
     * 인건비 실적 Portlet (임원용)
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.M22PortletHandler', {
      sChartId: 'portlet-m22-chart',
      oChartPromise: null,

      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        const oPortletBox = await Fragment.load({
          id: this.getController().getView().getId(),
          name: 'sap.ui.yesco.mvc.view.home.fragment.M22PortletBox',
          controller: this,
        });

        const iPortletHeight = oPortletModel.getProperty('/height');
        oPortletBox.setModel(oPortletModel).bindElement('/').addStyleClass(`portlet-h${iPortletHeight}`);

        this.getController().byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);

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
              type: 'mscolumn2d',
              renderAt: `${this.sChartId}-container`,
              width: '100%',
              height: '100%',
              dataFormat: 'json',
              dataSource: {
                chart: this.getChartOption(),
                categories: [this.getChartCategory()],
                dataset: this.getChartDataSet({
                  lastYear: {
                    a: 0,
                    b: 0,
                    c: 0,
                    d: 0,
                    x: 0,
                  },
                  thisYear: {
                    a: 0,
                    b: 0,
                    c: 0,
                    d: 0,
                    x: 0,
                  },
                }),
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

        mPortletData.Datum = new Date();

        return mPortletData;
      },

      setChartData(mPortletData) {
        const oChart = FusionCharts(this.sChartId);
        oChart.setChartData(
          {
            chart: this.getChartOption(),
            categories: [this.getChartCategory()],
            dataset: this.getChartDataSet({
              lastYear: {
                a: 168,
                b: 100,
                c: 115,
                d: 134,
                x: 0,
              },
              thisYear: {
                a: 173,
                b: 120,
                c: 102,
                d: 110,
                x: 0,
              },
            }),
          },
          'json'
        );
        setTimeout(() => {
          oChart.render();
        }, 200);
      },

      getChartOption() {
        return {
          animation: 0,
          showValues: 1,
          rotateValues: 0,
          placeValuesInside: 0,
          yAxisValueFontSize: 9,
          yAxisMaxValue: 230,
          numDivLines: 3,
          divLineDashed: 0,
          divLineColor: '#eeeeee',
          maxColWidth: 23,
          theme: 'ocean',
          bgColor: 'transparent',
          valueFontSize: 9,
          valueFontColor: '#000000',
          valueBgColor: '#ffffff',
          showPlotBorder: 1,
          plotBorderThickness: 3,
          plotBorderColor: '#ffffff',
          chartBottomMargin: 0,
          drawCustomLegendIcon: 1,
          toolTipBgColor: '#ffffff',
          toolTipColor: '#222222',
          showToolTipShadow: 1,
          plotcolorintooltip: 1,
          plottooltext: '<div class="fusion-tooltip"><table><tr><th>$label</th><td>$value</td></tr></table></div>',
        };
      },

      getChartCategory() {
        return {
          category: [
            {
              label: AppUtils.getBundleText('LABEL_01203'), // 급여
            },
            {
              label: AppUtils.getBundleText('LABEL_01204'), // 상여
            },
            {
              label: AppUtils.getBundleText('LABEL_01205'), // OT
            },
            {
              label: AppUtils.getBundleText('LABEL_01206'), // 복리후생
            },
          ],
        };
      },

      getChartDataSet(mPortletData) {
        return [
          {
            seriesName: AppUtils.getBundleText('LABEL_01207'), // 전년
            color: '#7bb4eb',
            data: [
              {
                value: mPortletData.lastYear.a,
              },
              {
                value: mPortletData.lastYear.b,
              },
              {
                value: mPortletData.lastYear.c,
              },
              {
                value: mPortletData.lastYear.d,
              },
            ],
          },
          {
            seriesName: AppUtils.getBundleText('LABEL_01208'), // 금년
            color: '#ffe479',
            data: [
              {
                value: mPortletData.thisYear.a,
              },
              {
                value: mPortletData.thisYear.b,
              },
              {
                value: mPortletData.thisYear.c,
              },
              {
                value: mPortletData.thisYear.d,
              },
            ],
          },
        ];
      },

      onAfterDragAndDrop() {
        FusionCharts(this.sChartId).render();
      },
    });
  }
);
