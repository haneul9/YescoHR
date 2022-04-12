sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    TableUtils,
    BaseController,
    MessageBox
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.exceptRetamt.mobile.ExceptRetamt', {
      TableUtils: TableUtils,
      TABLE_ID: 'exceptRetamtTable',

      initializeModel() {
        return {
          busy: false,
          data: {
            Retda: '',
          },
          listInfo: {
            Title: this.getBundleText('LABEL_33001'), // 예상퇴직금 조회
            busy: false,
            InfoMessage: '',
          },
        };
      },

      onBeforeShow() {},

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        if (AppUtils.isPRD() && !this.serviceAvailable()) return;

        try {
          oViewModel.setProperty('/busy', true);

          await this.onSearch();
        } catch (oError) {
          this.debug('Controller > mobile-ExceptRetamt > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      serviceAvailable() {
        const bOpen = moment().isAfter(moment('2022-04-18 09:00', 'YYYY-MM-DD HH:mm'));

        if (!bOpen)
          // 예상퇴직금 조회 서비스는 4/15까지 금액 검증 후 4/18 09시에 정식 오픈할 예정이니 양해 부탁드립니다.
          MessageBox.alert(this.getBundleText('MSG_33005', 'LABEL_00110'), {
            onClose: () => this.onNavBack(),
          });

        return bOpen;
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onSearch() {
        const oModel = this.getModel(ServiceNames.PAY);
        const oViewModel = this.getViewModel();
        const dRetda = oViewModel.getProperty('/data/Retda');

        try {
          oViewModel.setProperty('/busy', true);

          const aRowData = await Client.getEntitySet(oModel, 'ExpectRetAmt', {
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
            Retda: dRetda !== '' ? moment(dRetda).hours(9).toDate() : null,
          });

          oViewModel.setProperty('/data', aRowData[0]);
        } catch (oError) {
          this.debug('Controller > mobile-ExceptRetamt > onSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
