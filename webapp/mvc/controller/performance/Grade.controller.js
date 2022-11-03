sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/performance/constant/Constants',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    BaseController,
    Constants
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.performance.Grade', {
      initializeModel() {
        return {
          busy: false,
          type: '',
          listInfo: {
            rowCount: 1,
          },
          list: [],
          parameter: {
            rowData: {},
          },
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        try {
          this.getAppointeeModel().setProperty('/showBarChangeButton', this.isHass());

          const aRowData = await Client.getEntitySet(this.getModel(ServiceNames.APPRAISAL), 'Appraisal2GradeList', {
            Prcty: Constants.PROCESS_TYPE.LIST.code,
            Zzappgb: Constants.APPRAISER_TYPE.MB,
            Menid: this.getCurrentMenuId(),
            Werks: this.getAppointeeProperty('Werks'),
            Zzapper: this.getAppointeeProperty('Pernr')
          });

          this.setTableData({ oViewModel, aRowData });
        } catch (oError) {
          this.debug(`Controller > m/performanceGrade Grade > onObjectMatched Error`, oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTableData({ oViewModel, aRowData }) {
        const oTable = this.byId('gradeTable');

        oViewModel.setProperty('/list', aRowData);
        oViewModel.setProperty('/listInfo/rowCount', _.get(this.TableUtils.count({ oTable, aRowData }), 'rowCount', 1));
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = oViewModel.getProperty(sPath);

        // if (!_.isEqual(oRowData.Godetl, 'X')) {
        //   MessageBox.alert(this.getBundleText('MSG_10006')); // 현재 평가상태에서는 상세내역을 조회하실 수 없습니다.
        //   return;
        // }

        oViewModel.setProperty('/parameter/rowData', { ...oRowData });
        this.getRouter().navTo((this.isHass() ? 'h/performanceGrade-detail' : 'm/performanceGrade-detail'), { group: oRowData.Zzappgr });
      },

      getEmployeeSearchDialogOnLoadSearch() {
        const bIsEss = !this.isHass() && !this.isMss();

        return bIsEss;
      },

      getEmployeeSearchDialogCustomOptions() {
        const mSessionInfo = this.getSessionData();
        const bIsEss = !this.isHass() && !this.isMss();

        return {
          fieldEnabled: { Persa: !bIsEss, Orgeh: !bIsEss },
          searchConditions: {
            Persa: bIsEss ? mSessionInfo.Werks : 'ALL',
            Orgeh: bIsEss ? mSessionInfo.Orgeh : null,
            Orgtx: bIsEss ? mSessionInfo.Orgtx : null,
          },
        };
      },

      async callbackAppointeeChange() {
        const oViewModel = this.getViewModel();

        const aRowData = await Client.getEntitySet(this.getModel(ServiceNames.APPRAISAL), 'Appraisal2GradeList', {
          Prcty: Constants.PROCESS_TYPE.LIST.code,
          Zzappgb: Constants.APPRAISER_TYPE.MB,
          Menid: this.getCurrentMenuId(),
          Werks: this.getAppointeeProperty('Werks'),
          Zzapper: this.getAppointeeProperty('Pernr')
        });

        this.setTableData({ oViewModel, aRowData });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
