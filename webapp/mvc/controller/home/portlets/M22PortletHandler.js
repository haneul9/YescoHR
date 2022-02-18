sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
    'sap/ui/yesco/mvc/model/type/Month', // XML expression binding용 type preloading
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

        oPortletBox.setModel(oPortletModel).bindElement('/');

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
              height: 174,
              dataFormat: 'json',
              dataSource: {
                chart: this.getChartOption(),
                categories: [this.getChartCategory()],
                dataset: this.getChartDataSet(),
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

      getMenid(sMenuUrl) {
        return AppUtils.getAppComponent().getMenuModel().getMenid(sMenuUrl);
      },

      transformContentData([mPortletData = {}]) {
        if (this.oChartPromise) {
          this.oChartPromise.then(() => {
            this.setChartData(mPortletData);
          });
        } else {
          this.setChartData(mPortletData); // 다른 메뉴를 갔다가 되돌아오는 경우
        }

        return mPortletData;
      },

      setChartData(mPortletData) {
        const oChart = FusionCharts(this.sChartId);
        oChart.setChartData(
          {
            chart: this.getChartOption(),
            categories: [this.getChartCategory()],
            dataset: this.getChartDataSet(mPortletData),
          },
          'json'
        );
        setTimeout(() => {
          oChart.render();
        }, 200);
      },

      getChartOption() {
        return {
          drawCrossLine: 1,
          showValues: 0,
          bgColor: 'transparent',
          theme: 'ocean',
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
            seriesname: AppUtils.getBundleText('LABEL_01207'), // 전년
            color: '#7bb4eb',
            data: [
              {
                value: 168,
              },
              {
                value: 100,
              },
              {
                value: 115,
              },
              {
                value: 134,
              },
            ],
          },
          {
            seriesname: AppUtils.getBundleText('LABEL_01208'), // 금년
            color: '#ffe479',
            data: [
              {
                value: 173,
              },
              {
                value: 120,
              },
              {
                value: 102,
              },
              {
                value: 110,
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
