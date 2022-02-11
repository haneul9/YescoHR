sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/D3OrgChart',
    'sap/ui/yesco/control/D3OrgChartItem',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    BaseController,
    AppUtils,
    ODataReadError,
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
            const [aReturnData, aOrgLevel] = await Promise.all([
              this.readEmployeeOrgTree(), //
              this.readOrglevel(),
            ]);

            const oViewModel = new JSONModel({
              extendNode: '',
              orgLevel: aOrgLevel ?? [],
              orgList: _.map(aReturnData, (o) => ({
                ...o,
                Photo: _.isEmpty(o.Photo) ? 'asset/image/avatar-unknown.svg' : o.Photo,
                Ipdat: _.isDate(o.Ipdat) ? moment(o.Ipdat).format('YYYY.MM.DD') : '',
              })),
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
        const oChart = this.oD3Chart.getChart();
        oChart.layout(this.LAYOUT[oChart.layout()]).render().fit();
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
      readEmployeeOrgTree() {
        const oModel = this.getModel(ServiceNames.PA);
        const sMenid = this.getCurrentMenuId();
        const sOrgeh = this.getSessionProperty('/Orgeh');
        const sUrl = '/EmployeeOrgTreeSet';

        return new Promise((resolve, reject) => {
          oModel.read(sUrl, {
            filters: [
              new Filter('Menid', FilterOperator.EQ, sMenid), //
              new Filter('Objid', FilterOperator.EQ, sOrgeh),
              new Filter('Stdat', FilterOperator.EQ, moment().hour(9).toDate()),
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      readOrglevel() {
        const oModel = this.getModel(ServiceNames.PA);
        const sUrl = '/OrglevelSet';

        return new Promise((resolve, reject) => {
          oModel.read(sUrl, {
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },
    });
  }
);
