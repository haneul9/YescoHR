sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/idp/constant/Constants',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
    BaseController,
    Constants
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.idp.List', {
      initializeModel() {
        return {
          busy: false,
          type: '',
          detailRoute: '',
          routeName: '',
          listInfo: {
            rowCount: 1,
          },
          list: [],
          parameter: {
            rowData: {},
          },
        };
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();
        const { type: sType, route: sRoute, detail: sDetailRoute } = _.find(Constants.LIST_PAGE, { route: sRouteName });
        const sEmpField = _.isEqual(sType, Constants.APPRAISER_TYPE.ME) ? 'Zzappee' : 'Zzapper';

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);
        oViewModel.setProperty('/routeName', sRouteName);
        this.getAppointeeModel().setProperty('/showBarChangeButton', this.isHass());

        try {
          oViewModel.setProperty('/type', sType);
          oViewModel.setProperty('/detailRoute', sDetailRoute);

          const aRowData = await Client.getEntitySet(oModel, 'AppraisalIdpPeeList', {
            Prcty: Constants.PROCESS_TYPE.LIST.code,
            Zzappgb: sType,
            Menid: this.getCurrentMenuId(),
            Werks: this.getAppointeeProperty('Werks'),
            [sEmpField]: this.getAppointeeProperty('Pernr'),
          });

          this.setTableData({ oViewModel, aRowData });
        } catch (oError) {
          this.debug(`Controller > ${sRoute} List > onObjectMatched Error`, oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      async callbackAppointeeChange() {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();
        const { type: sType, route: sRoute, detail: sDetailRoute } = _.find(Constants.LIST_PAGE, { route: oViewModel.getProperty('/routeName') });
        const sEmpField = _.isEqual(sType, Constants.APPRAISER_TYPE.ME) ? 'Zzappee' : 'Zzapper';

        oViewModel.setProperty('/busy', true);

        try {
          oViewModel.setProperty('/type', sType);
          oViewModel.setProperty('/detailRoute', sDetailRoute);

          const aRowData = await Client.getEntitySet(oModel, 'AppraisalIdpPeeList', {
            Prcty: Constants.PROCESS_TYPE.LIST.code,
            Zzappgb: sType,
            Menid: this.getCurrentMenuId(),
            Werks: this.getAppointeeProperty('Werks'),
            [sEmpField]: this.getAppointeeProperty('Pernr'),
          });

          this.setTableData({ oViewModel, aRowData });
        } catch (oError) {
          this.debug(`Controller > ${sRoute} List > callbackAppointeeChange Error`, oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTableData({ oViewModel, aRowData }) {
        const oTable = this.byId('idpTable');

        oViewModel.setProperty('/listInfo/rowCount', _.get(this.TableUtils.count({ oTable, aRowData }), 'rowCount', 1));
        oViewModel.setProperty(
          '/list',
          _.map(aRowData, (o) => _.omit(o, '__metadata'))
        );
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = oViewModel.getProperty(sPath);
        const sType = oViewModel.getProperty('/type');
        const sDetailRoute = oViewModel.getProperty('/detailRoute');

        if (!_.isEqual(oRowData.Godetl, 'X')) {
          MessageBox.alert(this.getBundleText('MSG_10006')); // 현재 평가상태에서는 상세내역을 조회하실 수 없습니다.
          return;
        }

        oViewModel.setProperty('/parameter/rowData', { ...oRowData });
        this.getRouter().navTo(sDetailRoute, { sType, sYear: _.chain(oRowData.Zperiod).split('.', 1).head().value() });
      },
    });
  }
);
