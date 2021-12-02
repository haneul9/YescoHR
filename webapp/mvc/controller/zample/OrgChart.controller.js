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

    return BaseController.extend('sap.ui.yesco.mvc.controller.zample.OrgChart', {
      async onBeforeShow() {
        AppUtils.setAppBusy(true, this);

        try {
          const mReturnData = (await this.readEmployeeOrgTree()) ?? [];

          const oViewModel = new JSONModel({
            orgList: [
              ...mReturnData.map((o) => {
                if (!o.Photo) o.Photo = 'https://i1.wp.com/jejuhydrofarms.com/wp-content/uploads/2020/05/blank-profile-picture-973460_1280.png?ssl=1';
                return o;
              }),
            ],
          });

          this.setViewModel(oViewModel);

          const oChartHolder = this.byId('ChartHolder');
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
              }),
            },
          });

          oChartHolder.removeAllItems();
          oChartHolder.addItem(oChart);
        } catch (oError) {
          this.debug('Controller > OrgChart > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false, this);
        }
      },

      readEmployeeOrgTree() {
        const oModel = this.getModel(ServiceNames.PA);
        // const sOrgeh = this.getOwnerComponent().getSessionModel().getProperty('/Orgeh');
        const sUrl = '/EmployeeOrgTreeSet';

        return new Promise((resolve, reject) => {
          oModel.read(sUrl, {
            filters: [
              new Filter('Stdat', FilterOperator.EQ, moment().hour(9).toDate()), //
              // new Filter('Objid', FilterOperator.EQ, sOrgeh),
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
    });
  }
);
