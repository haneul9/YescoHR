sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/performance/constant/Constants',
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

    return BaseController.extend('sap.ui.yesco.mvc.controller.performance.List', {
      initializeModel() {
        return {
          busy: false,
          type: '',
          detailRoute: '',
          showChangeButton: true,
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
        };
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();
        const { type: sType, route: sRoute, detail: sDetailRoute } = _.find(Constants.LIST_PAGE, { route: sRouteName });
        const sEmpField = _.isEqual(sType, Constants.APPRAISER_TYPE.ME) ? 'Zzappee' : 'Zzapper';

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);
        this.getAppointeeModel().setProperty('/showBarChangeButton', this.isHass());

        try {
          oViewModel.setProperty('/type', sType);
          oViewModel.setProperty('/detailRoute', sDetailRoute);

          const aRowData = await Client.getEntitySet(oModel, 'AppraisalPeeList', {
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

      async callbackAppointeeChange() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        try {
          const sType = oViewModel.getProperty('/type');
          const sEmpField = _.isEqual(sType, Constants.APPRAISER_TYPE.ME) ? 'Zzappee' : 'Zzapper';
          const aRowData = await Client.getEntitySet(this.getModel(ServiceNames.APPRAISAL), 'AppraisalPeeList', {
            Prcty: Constants.PROCESS_TYPE.LIST.code,
            Zzappgb: sType,
            Menid: this.getCurrentMenuId(),
            Werks: this.getAppointeeProperty('Werks'),
            [sEmpField]: this.getAppointeeProperty('Pernr'),
          });

          this.setTableData({ oViewModel, aRowData });
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTableData({ oViewModel, aRowData }) {
        const oTable = this.byId('performanceTable');
        const sType = oViewModel.getProperty('/type');

        oViewModel.setProperty(
          '/list',
          _.map(aRowData, (o) => {
            const sLogicalZzapstsSub = !_.isEmpty(o.ZzapstsPSub) ? o.ZzapstsPSub : o.ZzapstsSub;
            return {
              ...o,
              Zapgme: _.includes(['V', 'H'], _.get(Constants.FIELD_STATUS_MAP, [o.Zzapsts, sLogicalZzapstsSub, 'Zapgme', sType], '')) ? '' : _.isEqual(o.Zapgme, '0.000') ? '' : o.Zapgme,
              Zapgma: _.includes(['V', 'H'], _.get(Constants.FIELD_STATUS_MAP, [o.Zzapsts, sLogicalZzapstsSub, 'Zapgma', sType], '')) ? '' : _.isEqual(o.Zapgma, '0.000') ? '' : o.Zapgma,
            };
          })
        );
        oViewModel.setProperty('/listInfo/rowCount', _.get(this.TableUtils.count({ oTable, aRowData }), 'rowCount', 1));

        if (_.every(aRowData, (o) => _.isEqual(_.toNumber(o.Zapgma), 0) && _.isEqual(_.toNumber(o.Zapgme), 0))) {
          const mColumnsInfo = oViewModel.getProperty('/listInfo/columns');

          _.chain(mColumnsInfo).set(['Zapgme', 'visible'], false).set(['Zapgma', 'visible'], false).set(['Ename', 'width'], '15%').set(['Zzjikgbt', 'width'], '15%').set(['Zzjikcht', 'width'], '15%').commit();
        }

        if (_.isEqual(sType, Constants.APPRAISER_TYPE.ME)) {
          const mColumnsInfo = oViewModel.getProperty('/listInfo/columns');
          _.set(mColumnsInfo, ['Zapgma', 'visible'], false);
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
        const sDetailRoute = oViewModel.getProperty('/detailRoute');

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
