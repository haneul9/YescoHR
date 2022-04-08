sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/D3OrgChart',
    'sap/ui/yesco/control/D3OrgChartItem',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    BaseController,
    AppUtils,
    Client,
    ServiceNames,
    D3OrgChart,
    D3OrgChartItem
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.organization.Main', {
      LAYOUT: { top: 'left', left: 'top' },

      async onBeforeShow() {
        this.chartHolder = this.byId('ChartHolder');
        this.chartHolder.setBusy(true);
        this.chartHolder.removeAllItems();
        this.oD3Chart = null;
      },

      async onObjectMatched() {
        try {
          if (_.isEmpty(this.getViewModel())) {
            const fCurriedPA = Client.getEntitySet(this.getModel(ServiceNames.PA));
            const mAppointee = this.getAppointeeData();
            const [aWerks, aOrgLevel, aReturnData] = await Promise.all([
              Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'WerksList', { Pernr: mAppointee.Pernr }), //
              fCurriedPA('Orglevel'),
              fCurriedPA('EmployeeOrgTree', {
                Menid: this.getCurrentMenuId(),
                Werks: mAppointee.Werks,
                Stdat: moment().hour(9).toDate(),
              }),
            ]);

            const sUnknownAvatarImageURL = this.getUnknownAvatarImageURL();
            const oViewModel = new JSONModel({
              extendNode: '',
              layout: 'top',
              orgLevel: aOrgLevel ?? [],
              orgList: _.map(aReturnData, (o) => ({
                ...o,
                Photo: _.isEmpty(o.Photo) ? sUnknownAvatarImageURL : o.Photo,
                Ipdat: _.isDate(o.Ipdat) ? moment(o.Ipdat).format('YYYY.MM.DD') : '',
              })),
              entry: {
                Werks: _.map(aWerks, (o) => _.omit(o, '__metadata')),
              },
              search: { Werks: mAppointee.Werks },
            });
            oViewModel.setSizeLimit(1000);
            this.setViewModel(oViewModel);
          }

          const sExtendNode = this.getViewModel().getProperty('/extendNode') || _.noop();
          this.oD3Chart = new D3OrgChart({
            extendNode: sExtendNode,
            items: {
              path: '/orgList',
              template: new D3OrgChartItem({
                nodeId: '{Objid}',
                parentNodeId: '{Upobjid}',
                Stdat: '{Stdat}',
                Stext: '{Stext}',
                Pernr: '{Pernr}',
                Ename: '{Ename}',
                Ipdat: '{Ipdat}',
                Photo: '{Photo}',
                Botxt: '{Botxt}',
                Jikgbtl: '{Jikgbtl}',
                ZorgLevl: '{ZorgLevl}',
                Tenure: '{Tenure}',
              }),
            },
          });

          this.chartHolder.addItem(this.oD3Chart);
        } catch (oError) {
          this.debug('Controller > organization Main > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.chartHolder.setBusy(false);
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onPressSwapBtn() {
        const oViewModel = this.getViewModel();
        const oChart = this.oD3Chart.getChart();
        const sLayout = this.LAYOUT[oChart.layout()];

        oViewModel.setProperty('/layout', sLayout);
        oChart.layout(sLayout).render().fit();
      },

      async onChangeWerks() {
        const oViewModel = this.getViewModel();

        try {
          this.chartHolder.setBusy(true);
          this.chartHolder.removeAllItems();

          const sWerks = oViewModel.getProperty('/search/Werks');
          const aReturnData = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'EmployeeOrgTree', {
            Menid: this.getCurrentMenuId(),
            Werks: sWerks,
            Stdat: moment().hour(9).toDate(),
          });

          const sUnknownAvatarImageURL = this.getUnknownAvatarImageURL();
          oViewModel.setProperty(
            '/orgList',
            _.map(aReturnData, (o) => ({
              ...o,
              Photo: _.isEmpty(o.Photo) ? sUnknownAvatarImageURL : o.Photo,
              Ipdat: _.isDate(o.Ipdat) ? moment(o.Ipdat).format('YYYY.MM.DD') : '',
            }))
          );

          const sLayout = oViewModel.getProperty('/layout');

          this.oD3Chart = new D3OrgChart({
            extendNode: null,
            layout: sLayout,
            items: {
              path: '/orgList',
              template: new D3OrgChartItem({
                nodeId: '{Objid}',
                parentNodeId: '{Upobjid}',
                Stdat: '{Stdat}',
                Stext: '{Stext}',
                Pernr: '{Pernr}',
                Ename: '{Ename}',
                Ipdat: '{Ipdat}',
                Photo: '{Photo}',
                Botxt: '{Botxt}',
                Jikgbtl: '{Jikgbtl}',
                ZorgLevl: '{ZorgLevl}',
                Tenure: '{Tenure}',
              }),
            },
          });

          this.chartHolder.addItem(this.oD3Chart);
        } catch (oError) {
          this.debug('Controller > Organization > onChangeWerks Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.chartHolder.setBusy(false);
        }
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
