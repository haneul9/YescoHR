sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/competency/constant/Constants',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
    TableUtils,
    BaseController,
    Constants
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.competency.List', {
      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          type: '',
          listInfo: {
            rowCount: 1,
            columns: {
              ZzapstsSubnm: { width: '15%' },
              Zperiod: { width: 'auto' },
              Ename: { width: '10%' },
              Orgtx: { width: '15%' },
              Zzjikgbt: { width: '10%' },
              Zzjikcht: { width: '10%' },
              Zapgme: { width: '10%', visible: true },
              Zapgma: { width: '10%', visible: true },
            },
          },
          list: [],
          parameter: {
            rowData: {},
          },
        });
        this.setViewModel(oViewModel);
      },

      async onObjectMatched() {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();
        const sType = _.findKey(Constants.LIST_PAGE, { route: this.getRouter().getHashChanger().getHash() });
        const sRoute = _.get(Constants.LIST_PAGE, [sType, 'route']);
        const sEmpField = _.isEqual(sType, Constants.APPRAISER_TYPE.ME) ? 'Zzappee' : 'Zzapper';

        try {
          oViewModel.setProperty('/busy', true);
          oViewModel.setProperty('/type', sType);

          const aRowData = await Client.getEntitySet(oModel, 'AppraisalCoPeeList', {
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

      setTableData({ oViewModel, aRowData }) {
        const oTable = this.byId('competencyTable');
        const sType = oViewModel.getProperty('/type');

        _.map(aRowData, (o) => ({
          ...o,
          Zapgma: _.isEqual('V', _.get(Constants.FIELD_STATUS_MAP, ['Zzapsts', 'ZzapstsSub', 'Z200', sType], '')) ? '0.00' : o.Zapgma,
          Zapgme: _.isEqual('V', _.get(Constants.FIELD_STATUS_MAP, ['Zzapsts', 'ZzapstsSub', 'Fapp', sType], '')) ? '0.00' : o.Zapgme,
        }));

        oViewModel.setProperty('/list', [...aRowData]);
        oViewModel.setProperty('/listInfo/rowCount', _.get(TableUtils.count({ oTable, aRowData }), 'rowCount', 1));

        if (_.some(aRowData, (o) => _.isEqual(_.toNumber(o.Zapgma), 0) && _.isEqual(_.toNumber(o.Zapgme), 0))) {
          const mColumnsInfo = oViewModel.getProperty('/listInfo/columns');

          _.chain(mColumnsInfo).set(['Zapgme', 'visible'], false).set(['Zapgma', 'visible'], false).set(['Ename', 'width'], '15%').set(['Zzjikgbt', 'width'], '15%').set(['Zzjikcht', 'width'], '15%').commit();
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = oViewModel.getProperty(sPath);
        const sType = oViewModel.getProperty('/type');
        const sDetailRoute = _.get(Constants.LIST_PAGE, [sType, 'detail']);

        if (!_.isEqual(oRowData.Godetl, 'X')) {
          MessageBox.alert(this.getBundleText('MSG_10006')); // 현재 평가상태에서는 상세내역을 조회하실 수 없습니다.
          return;
        }

        oViewModel.setProperty('/parameter/rowData', { ...oRowData });
        this.getRouter().navTo(sDetailRoute, { sType, sYear: _.chain(oRowData.Zperiod).split('.', 1).head().value() });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
