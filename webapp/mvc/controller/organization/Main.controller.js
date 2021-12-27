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
      async onBeforeShow() {
        this.chartHolder = this.byId('ChartHolder');

        this.chartHolder.setBusy(true);
        this.chartHolder.removeAllItems();
      },

      async onObjectMatched() {
        try {
          const [aReturnData, aOrgLevel] = await Promise.all([
            this.readEmployeeOrgTree(), //
            this.readOrglevel(),
          ]);

          const oViewModel = new JSONModel({
            orgList: [
              ...aReturnData.map((o) => {
                if (!o.Photo) o.Photo = 'https://i1.wp.com/jejuhydrofarms.com/wp-content/uploads/2020/05/blank-profile-picture-973460_1280.png?ssl=1';
                o.Ipdat = o.Ipdat ? moment(o.Ipdat).format('YYYY.MM.DD') : '';

                return o;
              }),
            ],
            orgLevel: aOrgLevel ?? [],
          });

          this.setViewModel(oViewModel);

          const oChart = new D3OrgChart({
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

          this.chartHolder.addItem(oChart);
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