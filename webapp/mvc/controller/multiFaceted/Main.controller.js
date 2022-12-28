sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    UI5Error,
    Client,
    ServiceNames,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.multiFaceted.Main', {
      initializeModel() {
        return {
          busy: {
            Button: false,
          },
          filter: {
            Pernr: null,
            Ename: null,
            Gjahr: new Date().getFullYear(),
          },
        };
      },

      onObjectMatched() {
        this.getMenuModel().setProperty('/breadcrumbs/currentLocationText', this.getBundleText('LABEL_44001')); // 다면진단 보고서 조회
      },

      onEmployeeSearchOpen() {
        this.getEmployeeSearchDialogHandler()
          .setCallback(this.callbackAppointeeChange.bind(this)) // 선택 후 실행 할 Function - 각 화면에서 구현
          .openDialog();
      },

      callbackAppointeeChange({ Pernr, Ename }) {
        const oViewModel = this.getViewModel();
        oViewModel.setProperty('/filter/Pernr', Pernr);
        oViewModel.setProperty('/filter/Ename', Ename);
      },

      async onPressDownload() {
        this.setContentsBusy(true, 'Button');

        const { Pernr, Gjahr } = this.getViewModel().getProperty('/filter');
        if (!Pernr) {
          MessageBox.alert(this.getBundleText('MSG_00035')); // 대상자 사번이 없습니다.
          this.setContentsBusy(false, 'Button');
          return;
        }
        if (!Gjahr) {
          MessageBox.alert(this.getBundleText('MSG_00003', 'LABEL_43003')); // {대상년도}를 입력하세요.
          this.setContentsBusy(false, 'Button');
          return;
        }

        try {
          const [{ Url }] = await Client.getEntitySet(this.getModel(ServiceNames.TALENT), 'MultiDiagGetFile', { Pernr, Gjahr });
          if (!Url) {
            MessageBox.alert(this.getBundleText('MSG_44001')); // 파일이 존재하지 않습니다.
            return;
          }
          this.AttachFileAction.openFileLink(Url);
        } catch (oError) {
          this.debug('Controller > multiFaceted > retrieve Error', oError);

          if (oError instanceof UI5Error) {
            oError.code = oError.LEVEL.INFORMATION;
          }
          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, 'Button');
        }
      },

      // setContentsBusy(bContentsBusy = true, vTarget = []) {
      //   const oViewModel = this.getViewModel();
      //   const mBusy = oViewModel.getProperty('/busy');

      //   if (_.isEmpty(vTarget)) {
      //     _.forOwn(mBusy, (v, p) => _.set(mBusy, p, bContentsBusy));
      //   } else {
      //     if (_.isArray(vTarget)) {
      //       _.forEach(vTarget, (s) => _.set(mBusy, s, bContentsBusy));
      //     } else {
      //       _.set(mBusy, vTarget, bContentsBusy);
      //     }
      //   }

      //   oViewModel.refresh();
      // },
    });
  }
);
