sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/control/MessageBox',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    BaseController,
    MessageBox
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.exceptRetamt.mobile.ExceptRetamt', {
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
        const sWerks = this.getSessionProperty('Werks');

        if (sWerks === '2000') {
          const bOpen = moment().isAfter(moment('2022-05-03 18:00', 'YYYY-MM-DD HH:mm'));
          const sMessage = this.getBundleText('MSG_33006', 'LABEL_00110'); // 예상퇴직금 조회 서비스는 5/3에 오픈할 예정이니 양해 부탁드립니다.

          if (!bOpen)
            MessageBox.alert(sMessage, {
              onClose: () => this.onNavBack(),
            });

          return bOpen;
        }
        const bOpen = moment().isAfter(moment('2022-04-30 18:00', 'YYYY-MM-DD HH:mm'));
        const sMessage = this.getBundleText('MSG_33005', 'LABEL_00110'); // 예상퇴직금 조회 서비스는 4/30일에 오픈할 예정이니 양해 부탁드립니다.

        if (!bOpen)
          MessageBox.alert(sMessage, {
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
