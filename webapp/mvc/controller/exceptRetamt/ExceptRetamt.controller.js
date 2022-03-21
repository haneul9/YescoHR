sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Currency'
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils,
    Client,
    ServiceNames,
    FragmentEvent,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.exceptRetamt.ExceptRetamt', {
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          busy: false,
          data: {
            Retda : ''
          },
          InfoMessage : ''
        };
      },

      onBeforeShow() {
        
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          let sMsg = this.getBundleText('MSG_33001'), // 1일 평균임금 계산식
              sMsg2 = this.getBundleText('MSG_33003'); // 퇴직금 계산식
          
          sMsg = `
          <p>
            ${this.getBundleText('MSG_33001')}
          </p>
          `;

          sMsg2 = `
          <p style='font-size: 14px; min-height: 1.8rem; padding-left: 25.5rem; margin-top: 5px; font-weight: 500;'>
            ${this.getBundleText('MSG_33003')}
            <br/><br/>
            ${this.getBundleText('MSG_33004')}
          </p>
          `;

          oViewModel.setProperty('/InfoMessage', sMsg);
          oViewModel.setProperty('/InfoMessage2', sMsg2);
          
          await this.onSearch();

        } catch (oError) {
          this.debug('Controller > exceptRetamt > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
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
            Retda: (dRetda != "" ? moment(dRetda).hours(9).toDate() : null )           
          });

          oViewModel.setProperty('/data', aRowData[0]);
        } catch (oError) {
          this.debug('Controller > exceptRetamt > onSearch Error', oError);

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
