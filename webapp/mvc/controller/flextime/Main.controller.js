/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.flextime.Main', {
      initializeModel() {
        return {
          busy: {
            Button: false,
            Dialog: false,
            Input: false,
            Summary: false,
            Details: false,
          },
          summary: {
            rowCount: 1,
            list: [
              { Zyymm: moment().format('YYYYMM'), Caldays: '31', Wrkdays: '22', Bastim: '177', Ctrtim: '196', Daytim: '194', Gaptim: '-2', Wekavg: '48.50', Statxt: '계약근로시간 미달', Stacol: '1', Clsda: moment('20220405').toDate() }, //
            ],
          },
          details: {
            rowCount: 9,
            list: [
              { Holiday: 'X', Datum: moment('20220301').toDate(), Todo2: '화', Todo3: '', Beguz: 'PT09H00M00S', Enduz: '1800', Todo6: '1.00', Todo7: '0.00', Todo8: '', Todo9: '8.00', Todo10: '8.00', Todo11: '1.00', Todo12: '' }, //
              { Holiday: '', Datum: moment('20220302').toDate(), Todo2: '수', Todo3: '', Beguz: '0900', Enduz: '1800', Todo6: '1.00', Todo7: '0.00', Todo8: '8.00', Todo9: '', Todo10: '16.00', Todo11: '1.00', Todo12: '' },
              { Holiday: '', Datum: moment('20220303').toDate(), Todo2: '목', Todo3: '연차', Beguz: '', Enduz: '', Todo6: '', Todo7: '', Todo8: '', Todo9: '8.00', Todo10: '24.00', Todo11: '', Todo12: '' },
              { Holiday: '', Datum: moment('20220304').toDate(), Todo2: '금', Todo3: '', Beguz: '1000', Enduz: '1500', Todo6: '1.00', Todo7: '0.00', Todo8: '4.50', Todo9: '', Todo10: '28.50', Todo11: '0.50', Todo12: '' },
              { Holiday: 'X', Datum: moment('20220305').toDate(), Todo2: '토', Todo3: '', Beguz: '', Enduz: '', Todo6: '', Todo7: '', Todo8: '', Todo9: '', Todo10: '28.50', Todo11: '', Todo12: '' },
              { Holiday: 'X', Datum: moment('20220306').toDate(), Todo2: '일', Todo3: '', Beguz: '', Enduz: '', Todo6: '', Todo7: '', Todo8: '', Todo9: '', Todo10: '28.50', Todo11: '', Todo12: '' },
              { Holiday: '', Datum: moment('20220307').toDate(), Todo2: '월', Todo3: '', Beguz: '0900', Enduz: '2130', Todo6: '0.50', Todo7: '0.00', Todo8: '12.00', Todo9: '', Todo10: '40.00', Todo11: '1.00', Todo12: '필수휴게시간 미달' },
              { Holiday: '', Datum: moment('20220308').toDate(), Todo2: '화', Todo3: '반차(오전)', Beguz: '1400', Enduz: '1800', Todo6: '0.00', Todo7: '0.00', Todo8: '4.00', Todo9: '4.00', Todo10: '48.00', Todo11: '0.00', Todo12: '시작시간 13시부터 가능' },
              { Holiday: '', Datum: moment('20220309').toDate(), Todo2: '수', Todo3: '반차(오후)', Beguz: '0900', Enduz: '1300', Todo6: '0.00', Todo7: '0.00', Todo8: '4.00', Todo9: '4.00', Todo10: '52.00', Todo11: '0.00', Todo12: '종료시간 14시까지 가능' },
            ],
          },
          dialog: {
            work: { rowCount: 1, list: [] },
            legal: { rowCount: 1, list: [] },
            extra: { rowCount: 2, list: [] },
          },
        };
      },

      async callbackAppointeeChange() {},

      async onObjectMatched() {
        try {
          this.setContentsBusy(true);

          this.getAppointeeModel().setProperty('/showBarChangeButton', this.isHass());

          this.initializeInputDialog();
        } catch (oError) {
          this.debug('Controller > flextime > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false);
        }
      },

      async initializeInputDialog() {
        const oView = this.getView();

        this._oTimeInputDialog = await Fragment.load({
          id: oView.getId(),
          name: 'sap.ui.yesco.mvc.view.flextime.fragment.TimeInputDialog',
          controller: this,
        });

        oView.addDependent(this._oTimeInputDialog);
      },

      setContentsBusy(bContentsBusy = true, vTarget = []) {
        const oViewModel = this.getViewModel();
        const mBusy = oViewModel.getProperty('/busy');

        if (_.isEmpty(vTarget)) {
          _.forOwn(mBusy, (v, p) => _.set(mBusy, p, bContentsBusy));
        } else {
          if (_.isArray(vTarget)) {
            _.forEach(vTarget, (s) => _.set(mBusy, s, bContentsBusy));
          } else {
            _.set(mBusy, vTarget, bContentsBusy);
          }
        }

        oViewModel.refresh();
      },

      helpInput() {},

      onPressSaveButton() {},

      onPressBatchButton() {
        this._oTimeInputDialog.open();
      },

      onPressDialogConfirm() {},
    });
  }
);
