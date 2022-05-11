sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P06PortletEmployeeListDialogHandler',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    Client,
    ServiceNames,
    AbstractPortletHandler,
    P06PortletEmployeeListDialogHandler
  ) => {
    'use strict';

    /**
     * 조직근무현황 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P06PortletHandler', {
      sChartId: 'portlet-p06-chart',
      oChartPromise: null,

      async addPortlet() {
        const oController = this.getController();
        const oPortletBox = await Fragment.load({
          id: oController.getView().getId(),
          name: 'sap.ui.yesco.mvc.view.home.fragment.P06PortletBox',
          controller: this,
        });

        const oPortletModel = this.getPortletModel();
        oPortletModel.setProperty('/selectedDate', new Date());

        const iPortletHeight = oPortletModel.getProperty('/height');
        oPortletBox.setModel(oPortletModel).bindElement('/').addStyleClass(`portlet-h${iPortletHeight}`);

        oController.byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);

        // 다른 화면에 갔다 되돌아오는 경우 id 중복 오류가 발생하므로 체크함
        if (!FusionCharts(this.sChartId)) {
          this.buildChart();
        }

        this.oEmployeeListPopupHandler = this.bMobile ? oController.getEmployeeListPopupHandler() : new P06PortletEmployeeListDialogHandler(oController);
      },

      buildChart() {
        this.oChartPromise = new Promise((resolve) => {
          FusionCharts.ready(() => {
            setTimeout(() => {
              this.iChartHeight = $('.portlet-p06-chart-area').height() - $('.portlet-p06-chart-caption').height() - $('.portlet-p06-chart-value').height();

              new FusionCharts({
                id: this.sChartId,
                type: 'cylinder',
                renderAt: `${this.sChartId}-container`,
                width: '105',
                height: this.iChartHeight,
                dataFormat: 'json',
                dataSource: {
                  chart: this.getChartOption(),
                  value: 0,
                },
                events: {
                  rendered: resolve,
                },
              }).render();
            }, 300);
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
          Headty: 'A',
        };

        return Client.getEntitySet(oModel, 'TimeOverview', mPayload);
      },

      transformContentData([mPortletContentData]) {
        const fValue = Number(mPortletContentData.Rte01);
        if (this.oChartPromise) {
          this.oChartPromise.then(() => {
            this.setChartData(fValue);
          });
        } else {
          this.setChartData(fValue); // 다른 메뉴를 갔다가 되돌아오는 경우
        }

        return {
          counts: mPortletContentData,
          chartValue: fValue,
        };
      },

      setChartData(fValue) {
        const oChart = FusionCharts(this.sChartId);
        oChart.setChartData(
          {
            chart: this.getChartOption(),
            value: fValue,
          },
          'json'
        );
        oChart.render();
      },

      getChartOption() {
        return {
          baseFontSize: '10',
          valueFontSize: '14',
          showValue: '0',
          lowerLimit: '0',
          upperLimit: '100',
          lowerLimitDisplay: '0%',
          upperLimitDisplay: '100%',
          numberSuffix: '%',
          cylHeight: this.iChartHeight - 20,
          cylYScale: '10',
          cylFillHoverAlpha: '85',
          cylFillColor: '#30c4ee',
          chartTopMargin: '10',
          chartBottomMargin: '10',
          // chartRightMargin: '15',
          // chartLeftMargin: '15',
          autoScale: '1',
          manageResize: '1',
          animation: '1',
          refreshInstantly: '1',
          toolTipBgColor: '#ffffff',
          toolTipColor: '#222222',
          showToolTipShadow: '1',
          plotColorInTooltip: '1',
          plotToolText: AppUtils.getBundleText('LABEL_01131', '$dataValue'), // 출근율: <b>$dataValue%</b>
          theme: 'ocean',
        };
      },

      onChangeSelectedDate() {
        this.setChartData(0);

        setTimeout(() => {
          this.showContentData();
        }, 300);
      },

      onPressCount(oEvent) {
        if (this.bMobile) {
          this.oEmployeeListPopupHandler.openPopover(oEvent);
        } else {
          this.oEmployeeListPopupHandler.openDialog(oEvent);
        }
      },
      /*
      onPressCount(oEvent) {
        if (this.bMobile) {
          this.oEmployeeListPopupHandler.openPopover(oEvent);
        } else {
          const oEventSource = oEvent.getSource();
          this.openPopover(oEventSource, oEventSource.data('popover'), oEventSource.data('table-key').replace(/^k/, ''));
        }
      },

      async openPopover(oEventSource, sPopover, sTableKey) {
        await this.createPopover();

        this.oPopover.close();
        if (sPopover === 'N') {
          return;
        }
        this.oPopover.bindElement(`/table${sTableKey}`);

        setTimeout(async () => {
          await this.retrieveEmpList(sTableKey);
          this.oPopover.openBy(oEventSource);
        }, 300);
      },

      async createPopover() {
        if (!this.oPopover) {
          this.oPopover = await Fragment.load({
            name: 'sap.ui.yesco.mvc.view.home.fragment.P06PortletDataPopover',
            controller: this,
          });

          this.getController().getView().addDependent(this.oPopover);

          this.oPopover.setModel(this.getPortletModel());
        }
      },

      async retrieveEmpList(sTableKey) {
        const oController = this.getController();
        const oPortletModel = this.getPortletModel();

        const oSelectedDate = oPortletModel.getProperty('/selectedDate');
        const mAppointee = oController.getAppointeeData();

        const oModel = oController.getModel(ServiceNames.WORKTIME);
        const mPayload = {
          Datum: moment(oSelectedDate).startOf('date').add(9, 'hours'),
          Werks: mAppointee.Werks,
          Orgeh: mAppointee.Orgeh,
          Headty: 'A',
          Discod: sTableKey,
        };

        const aData = await Client.getEntitySet(oModel, 'TimeOverviewDetail1', mPayload);
        oPortletModel.setProperty(`/table${sTableKey}`, {
          visiblePeriod: sTableKey !== '1',
          list: aData,
          listCount: Math.min(aData.length || 1, 5),
        });

        const bVisiblePeriod = this.oPopover.getBindingContext().getProperty('visiblePeriod');
        this.oPopover.setContentWidth(bVisiblePeriod ? '447px' : this.bMobile ? '240px' : '249px');
      },
      */
      onAfterDragAndDrop() {
        FusionCharts(this.sChartId).render();
      },

      destroy() {
        if (this.oEmployeeListPopupHandler) {
          this.oEmployeeListPopupHandler.destroy();
        }

        AbstractPortletHandler.prototype.destroy.call(this);
      },
    });
  }
);
